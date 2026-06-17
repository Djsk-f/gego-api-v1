import { Body, Controller, Delete, Get, Param, Patch, Post, Query, UseGuards } from '@nestjs/common';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { TenantGuard } from '../../common/guards/tenant.guard';
import type { TenantContext } from '../../common/types/tenant-context.type';
import { CreatePricingDto } from './dto/create-pricing.dto';
import { UpdatePricingDto } from './dto/update-pricing.dto';
import { PricingService } from './pricing.service';

@Controller('pricing')
@UseGuards(JwtAuthGuard, PermissionsGuard, TenantGuard)
export class PricingController {
  constructor(private readonly pricingService: PricingService) {}

  @Post()
  @Permissions('trip:create')
  create(
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: CreatePricingDto,
  ) {
    return this.pricingService.create({
      ...dto,
      companyId: tenant.companyId as string,
      agencyId: tenant.agencyId as string,
    });
  }

  @Get()
  @Permissions('trip:read')
  findAll(
    @CurrentTenant() tenant: TenantContext,
    @Query('agencyId') agencyId?: string,
  ) {
    return this.pricingService.findAll(
      tenant.companyId as string,
      agencyId ?? tenant.agencyId,
    );
  }

  @Patch(':id')
  @Permissions('trip:update')
  update(
    @Param('id') id: string,
    @CurrentTenant() tenant: TenantContext,
    @Body() dto: UpdatePricingDto,
  ) {
    return this.pricingService.update(id, tenant.companyId as string, dto);
  }

  @Delete(':id')
  @Permissions('trip:cancel')
  remove(
    @Param('id') id: string,
    @CurrentTenant() tenant: TenantContext,
  ) {
    return this.pricingService.remove(id, tenant.companyId as string);
  }
}
