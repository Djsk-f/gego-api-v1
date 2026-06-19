import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import type { TenantContext } from '../../common/types/tenant-context.type';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { CreateDriverDto } from './dto/create-driver.dto';
import { UpdateDriverDto } from './dto/update-driver.dto';
import { DriverService } from './driver.service';

@Controller('drivers')
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantGuard)
export class DriverController {
  constructor(private readonly driverService: DriverService) {}

  @Post()
  @Permissions('driver:create')
  create(
    @Body() dto: CreateDriverDto,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.driverService.createDriver(
      dto,
      tenant.companyId as string,
    );
  }

  @Get()
  @Permissions('driver:read')
  findAll(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: PaginationDto,
  ) {
    const page = parseInt(query.page ?? '1', 10);
    const limit = parseInt(query.limit ?? '20', 10);
    return this.driverService.findDriversByCompany(
      tenant.companyId as string,
      page,
      limit,
    );
  }

  @Get(':id')
  @Permissions('driver:read')
  findOne(@Param('id') id: string, @CurrentTenant() tenant: TenantContext) {
    return this.driverService.findDriverById(id, tenant.companyId as string);
  }

  @Patch(':id')
  @Permissions('driver:update')
  update(
    @Param('id') id: string,
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: UpdateDriverDto,
  ) {
    return this.driverService.updateDriver(id, tenant.companyId as string, dto);
  }

  @Delete(':id')
  @Permissions('driver:delete')
  remove(@Param('id') id: string, @CurrentTenant() tenant: TenantContext) {
    return this.driverService.deleteDriver(id, tenant.companyId as string);
  }
}
