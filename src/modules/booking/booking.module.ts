import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { Booking } from './entities/booking.entity';
import { BookingSeat } from './entities/booking-seat.entity';
import { Trip } from '../trip/entities/trip.entity';
import { PricingRule } from '../trip/entities/pricing-rule.entity';
import { RouteStop } from '../route/entities/route-stop.entity';
import { SeatAvailabilityController } from './seat-availability.controller';
import { SeatAvailabilityService } from './seat-availability.service';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, BookingSeat, Trip, PricingRule, RouteStop])],
  controllers: [BookingController, SeatAvailabilityController],
  providers: [BookingService, SeatAvailabilityService],
  exports: [BookingService, SeatAvailabilityService],
})
export class BookingModule {}
