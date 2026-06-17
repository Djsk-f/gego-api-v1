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
import { AgencyService } from './agency.service';
import { CreateAgencyDto } from './dto/create-agency.dto';
import { CreateAgencyStaffDto } from './dto/create-agency-staff.dto';
import { PaginationDto } from '../../common/dto/pagination.dto';
import { UpdateAgencyDto } from './dto/update-agency.dto';

@Controller('agencies')
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantGuard)
export class AgencyController {
  constructor(private readonly agencyService: AgencyService) {}

  @Post()
  @Permissions('agency:create')
  create(
    @Body() dto: CreateAgencyDto,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.agencyService.createAgency(dto, tenant.companyId as string);
  }

  @Get()
  @Permissions('agency:read')
  findAll(
    @CurrentTenant() tenant: TenantContext,
    @Query() pagination: PaginationDto,
  ) {
    const page = parseInt(pagination.page ?? '1', 10);
    const limit = parseInt(pagination.limit ?? '20', 10);
    return this.agencyService.findAgenciesByCompany(tenant.companyId as string, page, limit);
  }

  @Get(':id')
  @Permissions('agency:read')
  findOne(@Param('id') id: string, @CurrentTenant() tenant: TenantContext) {
    return this.agencyService.findAgencyById(id, tenant.companyId as string);
  }

  @Patch(':id')
  @Permissions('agency:update')
  update(
    @Param('id') id: string,
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: UpdateAgencyDto,
  ) {
    return this.agencyService.updateAgency(id, tenant.companyId as string, dto);
  }

  @Delete(':id')
  @Permissions('agency:delete')
  remove(@Param('id') id: string, @CurrentTenant() tenant: TenantContext) {
    return this.agencyService.deleteAgency(id, tenant.companyId as string);
  }

  // ─── Staff de l'agence ────────────────────────────────────────────────────

  @Post(':id/staff')
  @Permissions('agency:user:create')
  createStaff(
    @Param('id') id: string,
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreateAgencyStaffDto,
  ) {
    return this.agencyService.createStaff(
      id,
      tenant.companyId as string,
      dto,
    );
  }

  @Get(':id/staff')
  @Permissions('agency:read')
  getStaff(
    @Param('id') id: string,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.agencyService.getStaff(id, tenant.companyId as string);
  }
}
