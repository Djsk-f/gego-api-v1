import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgencyUserRole } from './entities/agency-user-role.entity';
import { Permission } from './entities/permission.entity';
import { Role } from './entities/role.entity';
import { RoleController } from './role.controller';
import { RoleService } from './role.service';

@Module({
  imports: [TypeOrmModule.forFeature([AgencyUserRole, Permission, Role])],
  controllers: [RoleController],
  providers: [RoleService],
  exports: [RoleService, TypeOrmModule],
})
export class RoleModule {}
