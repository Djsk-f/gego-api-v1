import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import type { TenantContext } from '../../common/types/tenant-context.type';
import { CreateRouteDto } from './dto/create-route.dto';
import { UpdateRouteDto } from './dto/update-route.dto';
import { RouteService } from './route.service';

@Controller('routes')
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantGuard)
export class RouteController {
  constructor(private readonly routeService: RouteService) {}

  @Post()
  @Permissions('route:create')
  create(
    @Body() dto: CreateRouteDto,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.routeService.create(dto, tenant.companyId as string);
  }

  @Get()
  @Permissions('route:read')
  findAll(@CurrentTenant() tenant: TenantContext) {
    return this.routeService.findAll(tenant.companyId as string);
  }

  @Get(':id')
  @Permissions('route:read')
  findOne(
    @Param('id') id: string,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.routeService.findById(id, tenant.companyId as string);
  }

  @Patch(':id')
  @Permissions('route:update')
  update(
    @Param('id') id: string,
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: UpdateRouteDto,
  ) {
    return this.routeService.update(id, tenant.companyId as string, dto);
  }

  @Delete(':id')
  @Permissions('route:delete')
  remove(
    @Param('id') id: string,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.routeService.remove(id, tenant.companyId as string);
  }

  @Patch(':routeId/stops/:stopId/toggle')
  @Permissions('route:update')
  toggleStop(
    @Param('routeId') routeId: string,
    @Param('stopId') stopId: string,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.routeService.toggleStop(routeId, stopId, tenant.companyId as string);
  }

  @Post(':routeId/stops')
  @Permissions('route:update')
  addStop(
    @Param('routeId') routeId: string,
    @CurrentTenant() tenant: TenantContext,
    @Body() body: { cityId: string; stopOrder: number; stopDurationMin: number; distanceFromPrevKm?: number; priceFromPrev?: number },
  ) {
    return this.routeService.addStop(
      routeId,
      tenant.companyId as string,
      body.cityId,
      body.stopOrder,
      body.stopDurationMin,
      body.distanceFromPrevKm,
      body.priceFromPrev,
    );
  }

  @Delete(':routeId/stops/:stopId')
  @Permissions('route:update')
  removeStop(
    @Param('routeId') routeId: string,
    @Param('stopId') stopId: string,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.routeService.removeStop(routeId, stopId, tenant.companyId as string);
  }
}
