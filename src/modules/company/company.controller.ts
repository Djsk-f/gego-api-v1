import {
  Body,
  Controller,
  Delete,
  Get,
  NotFoundException,
  Param,
  Patch,
  Post,
  UseGuards,
} from '@nestjs/common';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { CurrentTenant } from '../../common/decorators/current-tenant.decorator';
import { Permissions } from '../../common/decorators/permissions.decorator';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { PermissionsGuard } from '../../common/guards/permissions.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { TenantGuard } from '../../common/guards/tenant.guard';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import type { TenantContext } from '../../common/types/tenant-context.type';
import { UsersService } from '../user/user.service';
import { CompanyService } from './company.service';
import { CreateCompanyAdminDto } from './dto/create-company-admin.dto';
import { CreateCompanyDto } from './dto/create-company.dto';
import { UpdateCompanyDto } from './dto/update-company.dto';

@Controller('companies')
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class CompanyController {
  constructor(
    private readonly companyService: CompanyService,
    private readonly usersService: UsersService,
  ) {}

  @Post()
  @Roles('SUPER_ADMIN')
  @UseGuards(RolesGuard)
  create(@Body() dto: CreateCompanyDto) {
    return this.companyService.createCompany(dto);
  }

  @Get()
  @Permissions('company:read')
  async findAll(@CurrentUser() user: AuthenticatedUser) {
    if (user.type === 'SUPER_ADMIN') {
      return this.companyService.findCompanies();
    }
    const companyId = user.memberships[0]?.companyId;
    if (companyId && companyId !== '*') {
      const company = await this.companyService.findCompanyById(companyId);
      return [company];
    }
    return [];
  }

  @Get(':id')
  @Permissions('company:read')
  @UseGuards(TenantGuard)
  findOne(@Param('id') id: string, @CurrentTenant() tenant: TenantContext) {
    if (id !== tenant.companyId) {
      throw new NotFoundException('Entreprise non trouvée');
    }
    return this.companyService.findCompanyById(tenant.companyId as string);
  }

  @Patch(':id')
  @Permissions('company:update')
  @UseGuards(TenantGuard)
  update(@Param('id') id: string, @Body() dto: UpdateCompanyDto) {
    return this.companyService.updateCompany(id, dto);
  }

  @Delete(':id')
  @Permissions('company:delete')
  @UseGuards(TenantGuard)
  remove(@Param('id') id: string) {
    return this.companyService.deleteCompany(id);
  }

  @Get(':id/users')
  @Permissions('user:read')
  @UseGuards(TenantGuard)
  findUsers(@Param('id') id: string) {
    return this.companyService.findCompanyUsers(id);
  }

  @Post(':id/admins')
  @Permissions('company:update')
  @UseGuards(TenantGuard)
  async createAdmin(
    @Param('id') id: string,
    @Body() dto: CreateCompanyAdminDto,
  ) {
    await this.companyService.findCompanyById(id);
    return this.usersService.createCompanyAdmin({
      firstName: dto.firstName,
      lastName: dto.lastName,
      email: dto.email,
      phone: dto.phone,
      password: dto.password,
      companyId: id,
    });
  }
}
