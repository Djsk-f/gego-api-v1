import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Permission } from '../modules/role/entities/permission.entity';
import { Role, RoleScope } from '../modules/role/entities/role.entity';

const PERMISSIONS = [
  { name: 'trip:create', description: 'Create trips' },
  { name: 'trip:read', description: 'Read trips' },
  { name: 'trip:update', description: 'Update trips' },
  { name: 'trip:cancel', description: 'Cancel trips' },
  { name: 'vehicle:create', description: 'Create vehicles' },
  { name: 'vehicle:read', description: 'Read vehicles' },
  { name: 'vehicle:update', description: 'Update vehicles' },
  { name: 'vehicle:delete', description: 'Delete vehicles' },
  { name: 'booking:read', description: 'Read bookings' },
  { name: 'booking:confirm', description: 'Confirm bookings' },
  { name: 'ticket:read', description: 'Read tickets' },
  { name: 'ticket:validate', description: 'Validate tickets' },
  { name: 'agency:create', description: 'Create agencies' },
  { name: 'agency:read', description: 'Read agencies' },
  { name: 'agency:update', description: 'Update agencies' },
  { name: 'agency:delete', description: 'Delete agencies' },
  { name: 'agency:user:create', description: 'Create agency users' },
  { name: 'agency:user:update', description: 'Update agency users' },
  { name: 'company:read', description: 'Read companies' },
  { name: 'company:update', description: 'Update companies' },
  { name: 'company:delete', description: 'Delete companies' },
  { name: 'user:read', description: 'Read users' },
  { name: 'user:update', description: 'Update users' },
  { name: 'user:delete', description: 'Delete users' },
  { name: 'location:manage', description: 'Manage locations (regions/cities)' },
  { name: 'location:disable', description: 'Disable cities for a company' },
];

const ROLES = [
  {
    name: 'SUPER_ADMIN',
    description: 'Platform super administrator',
    scope: RoleScope.PLATFORM,
    permissions: PERMISSIONS.map((p) => p.name),
  },
  {
    name: 'COMPANY_ADMIN',
    description: 'Company administrator',
    scope: RoleScope.COMPANY,
    permissions: [
      'trip:create',
      'trip:read',
      'trip:update',
      'trip:cancel',
      'vehicle:create',
      'vehicle:read',
      'vehicle:update',
      'vehicle:delete',
      'booking:read',
      'booking:confirm',
      'ticket:read',
      'ticket:validate',
      'agency:create',
      'agency:read',
      'agency:update',
      'agency:delete',
      'agency:user:create',
      'agency:user:update',
      'company:read',
      'company:update',
      'company:delete',
      'user:read',
      'user:update',
      'user:delete',
      'location:manage',
      'location:disable',
    ],
  },
  {
    name: 'AGENCY_MANAGER',
    description: 'Agency manager',
    scope: RoleScope.AGENCY,
    permissions: [
      'trip:create',
      'trip:read',
      'trip:update',
      'trip:cancel',
      'vehicle:create',
      'vehicle:read',
      'vehicle:update',
      'vehicle:delete',
      'booking:read',
      'booking:confirm',
      'ticket:read',
      'ticket:validate',
      'agency:read',
      'agency:user:create',
      'agency:user:update',
      'user:read',
    ],
  },
  {
    name: 'TICKET_AGENT',
    description: 'Ticket agent',
    scope: RoleScope.AGENCY,
    permissions: [
      'trip:read',
      'booking:read',
      'booking:confirm',
      'ticket:read',
      'ticket:validate',
    ],
  },
  {
    name: 'VEHICLE_MANAGER',
    description: 'Vehicle manager',
    scope: RoleScope.AGENCY,
    permissions: [
      'vehicle:create',
      'vehicle:read',
      'vehicle:update',
      'vehicle:delete',
      'trip:read',
    ],
  },
  {
    name: 'CUSTOMER',
    description: 'Customer',
    scope: RoleScope.CUSTOMER,
    permissions: ['trip:read', 'booking:read', 'ticket:read'],
  },
];

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(Permission)
    private readonly permissionRepository: Repository<Permission>,
    @InjectRepository(Role)
    private readonly roleRepository: Repository<Role>,
  ) {}

  async onApplicationBootstrap() {
    const forceSeed = process.env.RUN_SEED === 'true';
    const shouldSeed =
      forceSeed || (await this.rolesAndPermissionsEmpty());

    if (!shouldSeed) {
      return;
    }

    if (forceSeed) {
      this.logger.log('RUN_SEED=true — forced seed...');
    } else {
      this.logger.log('Auto-detected empty roles/permissions — seeding...');
    }

    await this.seedPermissions();
    await this.seedRoles();
    this.logger.log('Database seed completed.');
  }

  private async rolesAndPermissionsEmpty(): Promise<boolean> {
    const permCount = await this.permissionRepository.count();
    if (permCount === 0) return true;

    const roles = await this.roleRepository.find({
      relations: { permissions: true },
    });
    if (roles.length === 0) return true;

    return roles.some((r) => !r.permissions?.length);
  }

  private async seedPermissions() {
    for (const permissionData of PERMISSIONS) {
      const exists = await this.permissionRepository.findOne({
        where: { name: permissionData.name },
      });

      if (!exists) {
        const permission = this.permissionRepository.create(permissionData);
        await this.permissionRepository.save(permission);
        this.logger.log(`Created permission: ${permissionData.name}`);
      }
    }
  }

  private async seedRoles() {
    const allPermissions = await this.permissionRepository.find();
    const permissionMap = new Map(allPermissions.map((p) => [p.name, p]));

    for (const roleData of ROLES) {
      let role = await this.roleRepository.findOne({
        where: { name: roleData.name },
        relations: { permissions: true },
      });

      if (!role) {
        role = this.roleRepository.create({
          name: roleData.name,
          description: roleData.description,
          scope: roleData.scope,
        });
        await this.roleRepository.save(role);
        this.logger.log(`Created role: ${roleData.name}`);
      }

      const rolePermissions = roleData.permissions
        .map((name) => permissionMap.get(name))
        .filter((p): p is Permission => p !== undefined);

      role.permissions = rolePermissions;
      await this.roleRepository.save(role);
      this.logger.log(`Updated role permissions: ${roleData.name}`);
    }
  }
}
