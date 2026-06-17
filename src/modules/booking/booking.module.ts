import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { BookingController } from './booking.controller';
import { BookingService } from './booking.service';
import { Booking } from './entities/booking.entity';
import { BookingSeat } from './entities/booking-seat.entity';
import { Trip } from '../trip/entities/trip.entity';
import { PricingRule } from '../trip/entities/pricing-rule.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Booking, BookingSeat, Trip, PricingRule])],
  controllers: [BookingController],
  providers: [BookingService],
  exports: [BookingService],
})
export class BookingModule {}
