import {
  BadRequestException,
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
import { CreateTripDto } from './dto/create-trip.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { SearchTripsDto } from './dto/search-trips.dto';
import { UpdateTripDto } from './dto/update-trip.dto';
import { TripService } from './trip.service';

@Controller('trips')
export class TripController {
  constructor(private readonly tripService: TripService) {}

  @Post()
  @UseGuards(JwtAuthGuard, PermissionsGuard, TenantGuard)
  @Permissions('trip:create')
  create(
    @Body() dto: CreateTripDto,
    @CurrentTenant() tenant: TenantContext,
  ) {
    if (!tenant.agencyId) {
      throw new BadRequestException('agencyId is required to create a trip');
    }
    return this.tripService.createTrip(
      dto,
      tenant.companyId as string,
      tenant.agencyId,
    );
  }

  @Get()
  @UseGuards(JwtAuthGuard, PermissionsGuard, TenantGuard)
  @Permissions('trip:read')
  findAll(
    @CurrentTenant() tenant: TenantContext,
    @Query() query: PaginationDto & { agencyId?: string },
  ) {
    const page = parseInt(query.page ?? '1', 10);
    const limit = parseInt(query.limit ?? '20', 10);
    return this.tripService.findByCompany(
      tenant.companyId as string,
      query.agencyId ?? undefined,
      page,
      limit,
    );
  }

  @Get('search')
  search(@Query() dto: SearchTripsDto) {
    return this.tripService.search(dto);
  }

  @Get('vehicle/:vehicleId')
  @UseGuards(JwtAuthGuard, PermissionsGuard, TenantGuard)
  @Permissions('trip:read')
  findByVehicle(
    @Param('vehicleId') vehicleId: string,
    @CurrentTenant() tenant: TenantContext,
    @Query() query: PaginationDto,
  ) {
    const page = parseInt(query.page ?? '1', 10);
    const limit = parseInt(query.limit ?? '50', 10);
    return this.tripService.findByVehicle(vehicleId, tenant.companyId as string, page, limit);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard, TenantGuard)
  @Permissions('trip:read')
  findOne(@Param('id') id: string, @CurrentTenant() tenant: TenantContext) {
    return this.tripService.findTripById(id, tenant.companyId as string);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard, TenantGuard)
  @Permissions('trip:update')
  update(
    @Param('id') id: string,
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: UpdateTripDto,
  ) {
    return this.tripService.updateTrip(id, tenant.companyId as string, dto);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, PermissionsGuard, TenantGuard)
  @Permissions('trip:cancel')
  remove(@Param('id') id: string, @CurrentTenant() tenant: TenantContext) {
    return this.tripService.deleteTrip(id, tenant.companyId as string);
  }
}
