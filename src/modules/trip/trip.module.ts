import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Trip } from './entities/trip.entity';
import { PricingRule } from './entities/pricing-rule.entity';
import { TripController } from './trip.controller';
import { TripService } from './trip.service';
import { PricingController } from './pricing.controller';
import { PricingService } from './pricing.service';

@Module({
  imports: [TypeOrmModule.forFeature([Trip, PricingRule])],
  controllers: [TripController, PricingController],
  providers: [TripService, PricingService],
  exports: [TripService, PricingService],
})
export class TripModule {}
