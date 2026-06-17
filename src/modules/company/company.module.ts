import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgencyUserRole } from '../role/entities/agency-user-role.entity';
import { UserModule } from '../user/user.module';
import { CompanyController } from './company.controller';
import { CompanyService } from './company.service';
import { Company } from './entities/company.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Company, AgencyUserRole]), UserModule],
  controllers: [CompanyController],
  providers: [CompanyService],
  exports: [CompanyService],
})
export class CompanyModule {}
