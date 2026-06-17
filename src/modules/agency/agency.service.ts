import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { DataSource, Repository } from 'typeorm';
import { BCRYPT_ROUNDS } from '../../common/constants/bcrypt';
import { BaseService } from '../../common/services/base.service';
import { AgencyUserRole } from '../role/entities/agency-user-role.entity';
import { Role } from '../role/entities/role.entity';
import { User, UserStatus, UserType } from '../user/entities/user.entity';
import { CreateAgencyStaffDto } from './dto/create-agency-staff.dto';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { UpdateAgencyDto } from './dto/update-agency.dto';
import { Agency } from './entities/agency.entity';

@Injectable()
export class AgencyService extends BaseService<Agency> {
  constructor(
    @InjectRepository(Agency)
    private readonly agencyRepository: Repository<Agency>,
    private readonly dataSource: DataSource,
  ) {
    super(agencyRepository);
  }

  async createAgency(dto: CreateAgencyDto, companyId: string): Promise<Agency> {
    return this.create({ ...dto, companyId });
  }

  findAgenciesByCompany(companyId: string, page = 1, limit = 20): Promise<Agency[]> {
    return this.agencyRepository.find({
      where: { companyId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }

  async findAgencyById(id: string, companyId: string): Promise<Agency> {
    const agency = await this.agencyRepository.findOne({
      where: { id, companyId },
    });
    if (!agency) {
      throw new NotFoundException('Agence non trouvee');
    }
    return agency;
  }

  async updateAgency(id: string, companyId: string, dto: UpdateAgencyDto): Promise<Agency> {
    const agency = await this.findAgencyById(id, companyId);
    Object.assign(agency, dto);
    return this.agencyRepository.save(agency);
  }

  async deleteAgency(id: string, companyId: string): Promise<void> {
    const agency = await this.findAgencyById(id, companyId);
    await this.agencyRepository.remove(agency);
  }

  async createStaff(
    agencyId: string,
    companyId: string,
    dto: CreateAgencyStaffDto,
  ): Promise<User> {
    const agency = await this.findAgencyById(agencyId, companyId);

    return this.dataSource.transaction(async (manager) => {
      // 1. Trouver le rôle par son nom
      const role = await manager.findOne(Role, {
        where: { name: dto.roleName },
      });
      if (!role) {
        throw new NotFoundException(`Rôle introuvable : ${dto.roleName}`);
      }

      // 2. Vérifier unicité email/téléphone
      const existing = await manager.findOne(User, {
        where: [
          ...(dto.email ? [{ email: dto.email }] : []),
          ...(dto.phone ? [{ phone: dto.phone }] : []),
        ],
      });
      if (existing) {
        throw new ConflictException(
          'Un utilisateur avec cet identifiant existe déjà',
        );
      }

      // 3. Créer l'utilisateur AGENCY_STAFF avec son rôle unique
      const passwordHash = await bcrypt.hash(dto.password, BCRYPT_ROUNDS);
      const user = manager.create(User, {
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        phone: dto.phone,
        passwordHash,
        type: UserType.AGENCY_STAFF,
        status: UserStatus.ACTIVE,
        companyId,
        roleId: role.id,   // ← rôle porté par le User
      });
      const savedUser = await manager.save(User, user);

      // 4. Créer l'affectation à l'agence (sans roleId)
      const agencyUserRole = manager.create(AgencyUserRole, {
        userId: savedUser.id,
        companyId,
        agencyId: agency.id,
      });
      await manager.save(AgencyUserRole, agencyUserRole);

      return savedUser;
    });
  }

  async getStaff(agencyId: string, companyId: string) {
    await this.findAgencyById(agencyId, companyId);

    return this.dataSource
      .getRepository(AgencyUserRole)
      .createQueryBuilder('aur')
      .innerJoinAndSelect('aur.user', 'user')
      .leftJoinAndSelect('user.role', 'role')
      .leftJoinAndSelect('role.permissions', 'permissions')
      .where('aur.agencyId = :agencyId', { agencyId })
      .andWhere('aur.companyId = :companyId', { companyId })
      .getMany();
  }
}
