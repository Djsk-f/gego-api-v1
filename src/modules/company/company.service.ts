import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { BaseService } from '../../common/services/base.service';
import { AgencyUserRole } from '../role/entities/agency-user-role.entity';
import { User } from '../user/entities/user.entity';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';
import { Company } from './entities/company.entity';
import { generateUniqueRccm } from './helpers/registration-number.helper';

@Injectable()
export class CompanyService extends BaseService<Company> {
  constructor(
    @InjectRepository(Company)
    private readonly companyRepository: Repository<Company>,
    @InjectRepository(AgencyUserRole)
    private readonly agencyUserRoleRepository: Repository<AgencyUserRole>,
  ) {
    super(companyRepository);
  }

  async createCompany(dto: CreateCompanyDto) {
    const existing = await this.companyRepository
      .createQueryBuilder('company')
      .where('LOWER(company.name) = LOWER(:name)', { name: dto.name })
      .getOne();
    if (existing) {
      throw new ConflictException('Une entreprise avec ce nom existe déjà');
    }

    const registrationNumber = await generateUniqueRccm(this.companyRepository);
    return this.create({ ...dto, registrationNumber });
  }

  findCompanies() {
    return this.findAll();
  }

  findCompanyById(id: string) {
    return this.findById(id);
  }

  async updateCompany(id: string, dto: UpdateCompanyDto) {
    const company = await this.findById(id);
    Object.assign(company, dto);
    return this.companyRepository.save(company);
  }

  async deleteCompany(id: string) {
    const company = await this.findById(id);
    await this.companyRepository.remove(company);
  }

  async findCompanyUsers(companyId: string): Promise<User[]> {
    const viaRoles = await this.agencyUserRoleRepository
      .createQueryBuilder('aur')
      .innerJoinAndSelect('aur.user', 'user')
      .where('aur.companyId = :companyId', { companyId })
      .distinct(true)
      .getMany();

    const viaCompanyId = await this.companyRepository.manager
      .getRepository(User)
      .createQueryBuilder('user')
      .where('user.companyId = :companyId', { companyId })
      .getMany();

    const map = new Map<string, User>();
    for (const row of viaRoles) {
      map.set(row.user.id, row.user);
    }
    for (const user of viaCompanyId) {
      map.set(user.id, user);
    }

    return Array.from(map.values());
  }
}
