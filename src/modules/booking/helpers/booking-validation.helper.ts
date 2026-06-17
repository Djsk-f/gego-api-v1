import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Trip, TripStatus } from '../../trip/entities/trip.entity';

export async function assertTripAvailable(
  manager: EntityManager,
  tripId: string,
  requestedSeats: number,
): Promise<Trip> {
  const trip = await manager.findOne(Trip, {
    where: { id: tripId },
    relations: { vehicle: true },
    lock: { mode: 'pessimistic_write' },
  });

  if (!trip) {
    throw new NotFoundException('Trip not found');
  }

  if (trip.status !== TripStatus.SCHEDULED) {
    throw new BadRequestException('Trip is not available for booking');
  }

  const availableSeats = trip.vehicle ? trip.vehicle.capacity - trip.bookedSeats : 0;

  if (availableSeats < requestedSeats) {
    throw new BadRequestException(`Only ${availableSeats} seats available`);
  }

  return trip;
}
