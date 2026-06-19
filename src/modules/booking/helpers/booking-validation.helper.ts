import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EntityManager, In } from 'typeorm';
import { Trip, TripStatus } from '../../trip/entities/trip.entity';
import { RouteStop } from '../../route/entities/route-stop.entity';
import { Booking, BookingStatus } from '../entities/booking.entity';
import { BookingSeat } from '../entities/booking-seat.entity';

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

/**
 * Segment-aware validation: check if requested seats are available
 * for the specific segment (departureStop → arrivalStop).
 */
export async function assertSegmentAvailable(
  manager: EntityManager,
  tripId: string,
  requestedSeats: string[],
  departureStopId: string,
  arrivalStopId: string,
): Promise<Trip> {
  const trip = await manager.findOne(Trip, {
    where: { id: tripId },
    relations: { vehicle: true, route: true },
    lock: { mode: 'pessimistic_write' },
  });

  if (!trip) {
    throw new NotFoundException('Voyage introuvable');
  }

  if (trip.status !== TripStatus.SCHEDULED) {
    throw new BadRequestException('Ce voyage n\'est pas disponible pour réservation');
  }

  // If trip has no route, fall back to flat capacity check
  if (!trip.routeId || !trip.vehicle) {
    const availableSeats = trip.vehicle ? trip.vehicle.capacity - trip.bookedSeats : 0;
    if (availableSeats < requestedSeats.length) {
      throw new BadRequestException(`Seulement ${availableSeats} place(s) disponible(s)`);
    }
    return trip;
  }

  // Load route stops to get ordering
  const stops = await manager.find(RouteStop, {
    where: { routeId: trip.routeId },
    order: { stopOrder: 'ASC' },
  });

  const depStop = stops.find((s) => s.id === departureStopId);
  const arrStop = stops.find((s) => s.id === arrivalStopId);

  if (!depStop || !arrStop) {
    throw new BadRequestException('Escales de départ/arrivée invalides');
  }

  if (depStop.stopOrder >= arrStop.stopOrder) {
    throw new BadRequestException('L\'escale de départ doit précéder l\'escale d\'arrivée');
  }

  // Get all active bookings for this trip
  const activeBookings = await manager.find(Booking, {
    where: {
      tripId,
      status: In([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
    },
    select: { id: true },
  });

  // Get all booked seats with segment info
  const occupiedSeats = new Set<string>();

  if (activeBookings.length > 0) {
    const bookingIds = activeBookings.map((b) => b.id);

    const bookedSeats = await manager.find(BookingSeat, {
      where: { bookingId: In(bookingIds) },
      relations: { departureStop: true, arrivalStop: true },
    });

    for (const bs of bookedSeats) {
      if (!bs.departureStop || !bs.arrivalStop) continue;

      const bsFrom = bs.departureStop.stopOrder;
      const bsTo = bs.arrivalStop.stopOrder;

      // Overlap check
      if (bsFrom < arrStop.stopOrder && bsTo > depStop.stopOrder) {
        occupiedSeats.add(bs.seatNumber);
      }
    }
  }

  // Check each requested seat
  const conflicts: string[] = [];
  for (const seat of requestedSeats) {
    if (occupiedSeats.has(seat)) {
      conflicts.push(seat);
    }
  }

  if (conflicts.length > 0) {
    throw new BadRequestException(
      `Les places suivantes sont déjà occupées sur ce segment: ${conflicts.join(', ')}`,
    );
  }

  // Also check flat capacity
  const availableSeats = trip.vehicle.capacity - trip.bookedSeats;
  if (availableSeats < requestedSeats.length) {
    throw new BadRequestException(
      `Seulement ${availableSeats} place(s) disponible(s) dans le véhicule`,
    );
  }

  return trip;
}
