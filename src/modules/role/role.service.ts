import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from './entities/permission.entity';
import { Role } from './entities/role.entity';
import { CreateRoleDto } from './dto/create-role.dto';

@Injectable()
export class RoleService {
  constructor(
    @InjectRepository(Role)
    private readonly rolesRepository: Repository<Role>,
    @InjectRepository(Permission)
    private readonly permissionsRepository: Repository<Permission>,
  ) {}

  async create(dto: CreateRoleDto): Promise<Role> {
    const existing = await this.rolesRepository.findOne({
      where: { name: dto.name },
    });
    if (existing) {
      throw new ConflictException(`Role ${dto.name} already exists`);
    }

    let permissions: Permission[] = [];
    if (dto.permissionNames?.length) {
      permissions = await this.permissionsRepository.find({
        where: dto.permissionNames.map((name) => ({ name })),
      });
    }

    const role = this.rolesRepository.create({
      name: dto.name,
      description: dto.description,
      scope: dto.scope,
      permissions,
    });
    return this.rolesRepository.save(role);
  }

  findAll(): Promise<Role[]> {
    return this.rolesRepository.find({
      relations: { permissions: true },
      order: { name: 'ASC' },
    });
  }

  async findById(id: string): Promise<Role> {
    const role = await this.rolesRepository.findOne({
      where: { id },
      relations: { permissions: true },
    });
    if (!role) {
      throw new NotFoundException('Role not found');
    }
    return role;
  }

  async updatePermissions(
    id: string,
    permissionNames: string[],
  ): Promise<Role> {
    const role = await this.findById(id);

    const permissions = await this.permissionsRepository.find({
      where: permissionNames.map((name) => ({ name })),
    });

    const found = new Set(permissions.map((p) => p.name));
    const missing = permissionNames.filter((n) => !found.has(n));
    if (missing.length > 0) {
      throw new NotFoundException(
        `Permissions not found: ${missing.join(', ')}`,
      );
    }

    role.permissions = permissions;
    return this.rolesRepository.save(role);
  }

  async findPermissions(): Promise<Permission[]> {
    return this.permissionsRepository.find({ order: { name: 'ASC' } });
  }
}
