import { Body, Controller, Delete, Get, Param, Patch, Query, UseGuards } from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import { PaginationDto } from '../../common/dto/pagination.dto';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import type { TenantContext } from '../../common/types/tenant-context.type';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { UsersService } from './user.service';
import { UpdateUserDto } from './dto/update-user.dto';

@Controller('users')
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantGuard)
export class UserController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions('user:read')
  findAll(
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
    @Query() pagination: PaginationDto,
  ) {
    const page = parseInt(pagination.page ?? '1', 10);
    const limit = parseInt(pagination.limit ?? '20', 10);
    return this.usersService.findUsersByCompany(tenant.companyId as string, user.type, page, limit);
  }

  @Get(':id')
  @Permissions('user:read')
  findOne(
    @Param('id') id: string,
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.findUserByIdScoped(id, tenant.companyId as string, user.type);
  }

  @Patch(':id')
  @Permissions('user:update')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateUserDto,
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.updateUser(id, dto, tenant.companyId as string, user.type);
  }

  @Delete(':id')
  @Permissions('user:delete')
  remove(
    @Param('id') id: string,
    @CurrentTenant() tenant: TenantContext,
    @CurrentUser() user: AuthenticatedUser,
  ) {
    return this.usersService.deleteUser(id, tenant.companyId as string, user.type);
  }
}
