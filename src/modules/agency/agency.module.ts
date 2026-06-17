import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AgencyUserRole } from '../role/entities/agency-user-role.entity';
import { Role } from '../role/entities/role.entity';
import { User } from '../user/entities/user.entity';
import { AgencyController } from './agency.controller';
import { AgencyService } from './agency.service';
import { Agency } from './entities/agency.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Agency, User, Role, AgencyUserRole])],
  controllers: [AgencyController],
  providers: [AgencyService],
  exports: [TypeOrmModule, AgencyService],
})
export class AgencyModule {}
