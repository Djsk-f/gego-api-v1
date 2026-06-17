import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import type { TenantContext } from '../../common/types/tenant-context.type';
import { DisableCityDto } from './dto/disable-city.dto';
import { EnableCityDto } from './dto/enable-city.dto';
import { UpdateCityDto } from './dto/update-city.dto';
import { UpdateRegionDto } from './dto/update-region.dto';
import { LocationService } from './location.service';

@Controller('locations/admin')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class LocationAdminController {
  constructor(private readonly locationService: LocationService) {}

  // ─── Regions ───────────────────────────────────────────────────────────────

  @Get('regions/super')
  @UseGuards(TenantGuard)
  @Permissions('location:manage')
  findAllRegionsSuper() {
    return this.locationService.adminFindRegions('SUPER_ADMIN');
  }

  @Get('regions')
  @UseGuards(TenantGuard)
  @Permissions('location:manage')
  findAllRegions(@CurrentTenant() tenant: TenantContext) {
    return this.locationService.adminFindRegions('COMPANY_ADMIN', tenant.companyId);
  }

  @Get('regions/:id')
  @Permissions('location:manage')
  findOneRegion(@Param('id') id: string) {
    return this.locationService.adminFindRegionById(id);
  }

  @Put('regions/:id')
  @Permissions('location:manage')
  updateRegion(
    @Param('id') id: string,
    @Body() dto: UpdateRegionDto,
  ) {
    return this.locationService.adminUpdateRegion(id, dto);
  }

  // ─── Cities ────────────────────────────────────────────────────────────────

  @Get('cities/super')
  @UseGuards(TenantGuard)
  @Permissions('location:manage')
  findAllCitiesSuper(@Query('regionId') regionId?: string) {
    return this.locationService.adminFindCities('SUPER_ADMIN', undefined, regionId);
  }

  @Get('cities')
  @UseGuards(TenantGuard)
  @Permissions('location:manage')
  findAllCities(
    @CurrentTenant() tenant: TenantContext,
    @Query('regionId') regionId?: string,
  ) {
    return this.locationService.adminFindCities('COMPANY_ADMIN', tenant.companyId, regionId);
  }

  @Get('cities/:id')
  @Permissions('location:manage')
  findOneCity(@Param('id') id: string) {
    return this.locationService.adminFindCityById(id);
  }

  @Put('cities/:id')
  @Permissions('location:manage')
  updateCity(
    @Param('id') id: string,
    @Body() dto: UpdateCityDto,
  ) {
    return this.locationService.adminUpdateCity(id, dto);
  }

  // ─── Company exclusions ────────────────────────────────────────────────────

  @Post('cities/disable')
  @UseGuards(TenantGuard)
  @Permissions('location:disable')
  disableCity(
    @Body() dto: DisableCityDto,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.locationService.disableCityForCompany(dto.cityId, tenant.companyId ?? '');
  }

  @Post('cities/enable')
  @UseGuards(TenantGuard)
  @Permissions('location:disable')
  enableCity(
    @Body() dto: EnableCityDto,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.locationService.adminEnableCityForCompany(dto.cityId, tenant.companyId ?? '');
  }
}
