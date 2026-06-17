import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { City } from './entities/city.entity';
import { CompanyDisabledCity } from './entities/company-disabled-city.entity';
import { Region } from './entities/region.entity';
import { LocationAdminController } from './location-admin.controller';
import { LocationController } from './location.controller';
import { LocationSeed } from './location.seed';
import { LocationService } from './location.service';

@Module({
  imports: [
    TypeOrmModule.forFeature([Region, City, CompanyDisabledCity]),
  ],
  controllers: [LocationController, LocationAdminController],
  providers: [LocationService, LocationSeed],
  exports: [LocationService],
})
export class LocationModule {}
