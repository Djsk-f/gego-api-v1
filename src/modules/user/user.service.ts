import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import * as bcrypt from 'bcrypt';
import { FindOptionsRelations, Repository } from 'typeorm';
import { BCRYPT_ROUNDS } from '../../common/constants/bcrypt';
import { Role } from '../role/entities/role.entity';
import { User, UserType } from './entities/user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
  ) {}

  findAllUsers() {
    return this.usersRepository.find({ order: { createdAt: 'DESC' } });
  }

  async findUsersByCompany(
    companyId: string,
    userType: string,
    page: number,
    limit: number,
  ) {
    if (userType === 'SUPER_ADMIN') {
      return this.usersRepository.find({
        skip: (page - 1) * limit,
        take: limit,
        order: { createdAt: 'DESC' },
      });
    }

    return this.usersRepository.find({
      where: { companyId },
      skip: (page - 1) * limit,
      take: limit,
      order: { createdAt: 'DESC' },
    });
  }

  async findUserByIdScoped(
    id: string,
    companyId: string,
    userType: string,
  ) {
    if (userType === 'SUPER_ADMIN') {
      return this.findById(id);
    }

    const user = await this.usersRepository.findOne({
      where: { id, companyId },
    });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }

    return user;
  }

  findById(id: string, relations?: FindOptionsRelations<User>) {
    return this.usersRepository.findOne({
      where: { id },
      relations,
    });
  }

  findByIdentifier(identifier: string, relations?: FindOptionsRelations<User>) {
    return this.usersRepository.findOne({
      where: [{ email: identifier }, { phone: identifier }],
      relations,
    });
  }

  findByIdentifierWithPassword(identifier: string, relations?: FindOptionsRelations<User>) {
    return this.usersRepository.findOne({
      where: [{ email: identifier }, { phone: identifier }],
      relations,
      select: {
        id: true,
        firstName: true,
        lastName: true,
        email: true,
        phone: true,
        type: true,
        status: true,
        passwordHash: true,
        companyId: true,
        roleId: true,
        createdAt: true,
        updatedAt: true,
      },
    });
  }

  private async assertUniqueContact(
    email?: string,
    phone?: string,
  ): Promise<void> {
    const conditions: Array<{ email: string } | { phone: string }> = [];
    if (email) conditions.push({ email });
    if (phone) conditions.push({ phone });
    if (conditions.length === 0) return;

    const existing = await this.usersRepository.findOne({
      where: conditions,
    });
    if (existing) {
      throw new ConflictException(
        'Un utilisateur avec cet email ou ce telephone existe deja',
      );
    }
  }

  async createCustomer(input: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    passwordHash: string;
  }) {
    await this.assertUniqueContact(input.email, input.phone);

    const role = await this.rolesRepository.findOne({
      where: { name: 'CUSTOMER' },
    });
    if (!role) {
      throw new NotFoundException(
        'Role CUSTOMER introuvable. Executez le seed (RUN_SEED=true).',
      );
    }

    const user = this.usersRepository.create({
      ...input,
      type: UserType.CUSTOMER,
      roleId: role.id,
    });
    return this.usersRepository.save(user);
  }

  async createCompanyAdmin(input: {
    firstName: string;
    lastName: string;
    email?: string;
    phone?: string;
    password: string;
    companyId?: string;
  }) {
    await this.assertUniqueContact(input.email, input.phone);
    const passwordHash = await bcrypt.hash(input.password, BCRYPT_ROUNDS);

    const role = await this.rolesRepository.findOne({
      where: { name: 'COMPANY_ADMIN' },
    });
    if (!role) {
      throw new NotFoundException(
        'Role COMPANY_ADMIN introuvable. Executez le seed (RUN_SEED=true).',
      );
    }

    const user = this.usersRepository.create({
      ...input,
      passwordHash,
      type: UserType.COMPANY_ADMIN,
      roleId: role.id,
    });
    return this.usersRepository.save(user);
  }

  async updateUser(id: string, dto: Partial<User>, companyId: string, userType: string) {
    const user = userType === 'SUPER_ADMIN'
      ? await this.findById(id)
      : await this.usersRepository.findOne({ where: { id, companyId } });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    Object.assign(user, dto);
    return this.usersRepository.save(user);
  }

  async deleteUser(id: string, companyId: string, userType: string) {
    const user = userType === 'SUPER_ADMIN'
      ? await this.findById(id)
      : await this.usersRepository.findOne({ where: { id, companyId } });

    if (!user) {
      throw new NotFoundException('Utilisateur non trouvé');
    }
    await this.usersRepository.delete(id);
  }
}
