import { Controller, Get, Param, Query, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard';
import { SeatAvailabilityService } from './seat-availability.service';

@Controller('seats')
export class SeatAvailabilityController {
  constructor(private readonly seatAvailabilityService: SeatAvailabilityService) {}

  /**
   * GET /api/v1/seats/available?tripId=xxx&departureStopId=xxx&arrivalStopId=xxx
   * Returns available seats for a specific segment of a trip.
   */
  @Get('available')
  @UseGuards(JwtAuthGuard)
  getAvailableSeats(
    @Query('tripId') tripId: string,
    @Query('departureStopId') departureStopId: string,
    @Query('arrivalStopId') arrivalStopId: string,
  ) {
    return this.seatAvailabilityService.getAvailableSeats(
      tripId,
      departureStopId,
      arrivalStopId,
    );
  }

  /**
   * GET /api/v1/seats/predict/:tripId/:cityId
   * Predict how many seats will be freed at a specific intermediate stop.
   */
  @Get('predict/:tripId/:cityId')
  @UseGuards(JwtAuthGuard)
  predictFreeSeats(
    @Param('tripId') tripId: string,
    @Param('cityId') cityId: string,
  ) {
    return this.seatAvailabilityService.predictFreeSeats(tripId, cityId);
  }

  /**
   * GET /api/v1/seats/price/:routeId?departureStopId=xxx&arrivalStopId=xxx
   * Calculate segment price based on cumulative priceFromPrev.
   */
  @Get('price/:routeId')
  @UseGuards(JwtAuthGuard)
  getSegmentPrice(
    @Param('routeId') routeId: string,
    @Query('departureStopId') departureStopId: string,
    @Query('arrivalStopId') arrivalStopId: string,
  ) {
    return this.seatAvailabilityService.getSegmentPrice(
      routeId,
      departureStopId,
      arrivalStopId,
    );
  }
}
