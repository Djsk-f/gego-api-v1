import {
  Body,
  Controller,
  Get,
  Param,
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
import { CreateCityDto } from './dto/create-city.dto';
import { CreateRegionDto } from './dto/create-region.dto';
import { DisableCityDto } from './dto/disable-city.dto';
import { LocationService } from './location.service';

@Controller('locations')
export class LocationController {
  constructor(private readonly locationService: LocationService) {}

  @Get('regions')
  findRegions(@Query('companyId') companyId?: string) {
    return this.locationService.findRegions(companyId);
  }

  @Get('cities')
  findCities(
    @Query('companyId') companyId?: string,
    @Query('regionId') regionId?: string,
  ) {
    return this.locationService.findCities(companyId, regionId);
  }

  @Post('regions')
  @UseGuards(JwtAuthGuard, PermissionsGuard, TenantGuard)
  @Permissions('company:update')
  createRegion(
    @Body() dto: CreateRegionDto,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.locationService.createRegion(dto.name, dto.scope, tenant.companyId);
  }

  @Post('cities')
  @UseGuards(JwtAuthGuard, PermissionsGuard, TenantGuard)
  @Permissions('company:update')
  createCity(
    @Body() dto: CreateCityDto,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.locationService.createCity(dto.name, dto.regionId, dto.scope, tenant.companyId);
  }

  @Post('cities/disable')
  @UseGuards(JwtAuthGuard, PermissionsGuard, TenantGuard)
  @Permissions('company:update')
  disableCity(
    @Body() dto: DisableCityDto,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.locationService.disableCityForCompany(dto.cityId, tenant.companyId ?? '');
  }
}
