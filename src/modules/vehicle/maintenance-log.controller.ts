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
import { CreateMaintenanceLogDto } from './dto/create-maintenance-log.dto';
import { UpdateMaintenanceLogDto } from './dto/update-maintenance-log.dto';
import { MaintenanceLogService } from './maintenance-log.service';

@Controller('vehicles/:vehicleId/maintenance')
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantGuard)
export class MaintenanceLogController {
  constructor(private readonly maintenanceLogService: MaintenanceLogService) {}

  @Post()
  @Permissions('vehicle:update')
  create(
    @Param('vehicleId') vehicleId: string,
    @Body() dto: CreateMaintenanceLogDto,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.maintenanceLogService.createLog(dto, vehicleId, tenant.companyId as string);
  }

  @Get()
  @Permissions('vehicle:read')
  findAll(
    @Param('vehicleId') vehicleId: string,
    @Query() query: PaginationDto,
  ) {
    const page = parseInt(query.page ?? '1', 10);
    const limit = parseInt(query.limit ?? '20', 10);
    return this.maintenanceLogService.findByVehicle(vehicleId, page, limit);
  }

  @Patch(':id')
  @Permissions('vehicle:update')
  update(
    @Param('id') id: string,
    @Body() dto: UpdateMaintenanceLogDto,
  ) {
    return this.maintenanceLogService.updateLog(id, dto);
  }

  @Delete(':id')
  @Permissions('vehicle:delete')
  remove(@Param('id') id: string) {
    return this.maintenanceLogService.deleteLog(id);
  }
}
