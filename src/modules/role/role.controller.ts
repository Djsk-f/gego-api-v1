import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { Roles } from '../../common/decorators/roles.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CreateRoleDto } from './dto/create-role.dto';
import { UpdateRolePermissionsDto } from './dto/update-role-permissions.dto';
import { RoleService } from './role.service';

@Controller('roles')
export class RoleController {
  constructor(private readonly roleService: RoleService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  create(@Body() dto: CreateRoleDto) {
    return this.roleService.create(dto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('user:read')
  findAll() {
    return this.roleService.findAll();
  }

  @Get('permissions')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('user:read')
  findPermissions() {
    return this.roleService.findPermissions();
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard)
  @Permissions('user:read')
  findOne(@Param('id') id: string) {
    return this.roleService.findById(id);
  }

  @Put(':id/permissions')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles('SUPER_ADMIN')
  updatePermissions(
    @Param('id') id: string,
    @Body() dto: UpdateRolePermissionsDto,
  ) {
    return this.roleService.updatePermissions(id, dto.permissionNames);
  }
}
