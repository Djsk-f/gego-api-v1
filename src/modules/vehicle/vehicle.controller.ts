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
import { CreateVehicleDto } from './dto/create-vehicle.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UpdateVehicleDto } from './dto/update-vehicle.dto';
import { VehicleService } from './vehicle.service';

@Controller('vehicles')
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantGuard)
export class VehicleController {
  constructor(private readonly vehicleService: VehicleService) {}

  @Post()
  @Permissions('vehicle:create')
  create(
    @Body() dto: CreateVehicleDto,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.vehicleService.createVehicle(
      dto,
      tenant.companyId as string,
      tenant.agencyId,
    );
  }

  @Get()
  @Permissions('vehicle:read')
  findAll(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: PaginationDto & { agencyId?: string },
  ) {
    const page = parseInt(query.page ?? '1', 10);
    const limit = parseInt(query.limit ?? '20', 10);
    return this.vehicleService.findVehiclesByCompany(
      tenant.companyId as string,
      query.agencyId ?? undefined,
      page,
      limit,
    );
  }

  @Get(':id')
  @Permissions('vehicle:read')
  findOne(@Param('id') id: string, @CurrentTenant() tenant: TenantContext) {
    return this.vehicleService.findVehicleById(id, tenant.companyId as string);
  }

  @Patch(':id')
  @Permissions('vehicle:update')
  update(
    @Param('id') id: string,
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: UpdateVehicleDto,
  ) {
    return this.vehicleService.updateVehicle(id, tenant.companyId as string, dto);
  }

  @Delete(':id')
  @Permissions('vehicle:delete')
  remove(@Param('id') id: string, @CurrentTenant() tenant: TenantContext) {
    return this.vehicleService.deleteVehicle(id, tenant.companyId as string);
  }
}
