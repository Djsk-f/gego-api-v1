import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Trip } from '../trip/entities/trip.entity';
import { RouteStop } from '../route/entities/route-stop.entity';
import {
  obtenirSiegesDisponibles,
  predirePlacesLibresAArrivee,
  calculateSegmentPrice,
  SegmentAvailability,
  PredictionResult,
} from './helpers/seat-availability.helper';

@Injectable()
export class SeatAvailabilityService {
  constructor(
    @InjectRepository(Trip)
    private readonly tripRepository: Repository<Trip>,
    @InjectRepository(RouteStop)
    private readonly routeStopRepository: Repository<RouteStop>,
  ) {}

  async getAvailableSeats(
    tripId: string,
    departureStopId: string,
    arrivalStopId: string,
  ): Promise<SegmentAvailability> {
    return obtenirSiegesDisponibles(
      this.tripRepository.manager,
      tripId,
      departureStopId,
      arrivalStopId,
    );
  }

  async predictFreeSeats(
    tripId: string,
    stopCityId: string,
  ): Promise<PredictionResult> {
    return predirePlacesLibresAArrivee(
      this.tripRepository.manager,
      tripId,
      stopCityId,
    );
  }

  async getSegmentPrice(
    routeId: string,
    departureStopId: string,
    arrivalStopId: string,
  ): Promise<{ price: number }> {
    const price = await calculateSegmentPrice(
      this.tripRepository.manager,
      routeId,
      departureStopId,
      arrivalStopId,
    );
    return { price };
  }
}
