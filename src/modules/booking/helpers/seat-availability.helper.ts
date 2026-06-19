import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EntityManager, In } from 'typeorm';
import { Trip } from '../../trip/entities/trip.entity';
import { RouteStop } from '../../route/entities/route-stop.entity';
import { BookingSeat } from '../entities/booking-seat.entity';
import { Booking, BookingStatus } from '../entities/booking.entity';

export interface SeatAvailability {
  seatNumber: string;
  available: boolean;
  occupiedBy?: string;
}

export interface SegmentAvailability {
  tripId: string;
  vehicleCapacity: number;
  totalBookedOnSegment: number;
  availableSeats: number;
  seats: SeatAvailability[];
  departureStop: RouteStop;
  arrivalStop: RouteStop;
}

export interface PredictionResult {
  tripId: string;
  agencyCity: string;
  stopOrder: number;
  seatsFreed: number;
  seatNumbers: string[];
  currentlyOccupied: number;
  currentlyAvailable: number;
}

/**
 * Core function: Get available seats for a specific segment of a trip.
 *
 * A seat is AVAILABLE between stop A and stop B if and only if
 * there is NO existing booking for the same seat number on a segment
 * that OVERLAPS [A, B].
 *
 * Overlap condition: booking.departure_stop_order < requested.arrival_stop_order
 *                AND booking.arrival_stop_order > requested.departure_stop_order
 */
export async function obtenirSiegesDisponibles(
  manager: EntityManager,
  tripId: string,
  departureStopId: string,
  arrivalStopId: string,
): Promise<SegmentAvailability> {
  // 1. Load trip with vehicle and route
  const trip = await manager.findOne(Trip, {
    where: { id: tripId },
    relations: { vehicle: true, route: true },
  });

  if (!trip) {
    throw new NotFoundException('Voyage introuvable');
  }

  if (!trip.vehicle) {
    throw new BadRequestException('Aucun véhicule associé à ce voyage');
  }

  const vehicleCapacity = trip.vehicle.capacity;

  // 2. Load all route stops for this trip's route
  if (!trip.routeId) {
    // Fallback for legacy trips without route — use flat capacity check
    return buildLegacyAvailability(trip, vehicleCapacity, departureStopId, arrivalStopId);
  }

  const stops = await manager.find(RouteStop, {
    where: { routeId: trip.routeId },
    order: { stopOrder: 'ASC' },
  });

  if (stops.length === 0) {
    throw new BadRequestException('La route associée n\'a pas d\'escales');
  }

  // 3. Find departure and arrival stops
  const departureStop = stops.find((s) => s.id === departureStopId);
  const arrivalStop = stops.find((s) => s.id === arrivalStopId);

  if (!departureStop) {
    throw new NotFoundException('Escale de départ introuvable sur cette route');
  }
  if (!arrivalStop) {
    throw new NotFoundException('Escale d\'arrivée introuvable sur cette route');
  }

  if (departureStop.stopOrder >= arrivalStop.stopOrder) {
    throw new BadRequestException(
      `L'ordre de départ (${departureStop.stopOrder}) doit être inférieur à l'ordre d'arrivée (${arrivalStop.stopOrder})`,
    );
  }

  // 4. Get all active bookings for this trip
  const activeBookings = await manager.find(Booking, {
    where: {
      tripId,
      status: In([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
    },
    select: { id: true },
  });

  if (activeBookings.length === 0) {
    // No bookings — all seats available
    return {
      tripId,
      vehicleCapacity,
      totalBookedOnSegment: 0,
      availableSeats: vehicleCapacity,
      seats: generateAllSeats(vehicleCapacity),
      departureStop,
      arrivalStop,
    };
  }

  const bookingIds = activeBookings.map((b) => b.id);

  // 5. Get all booking seats with their segment info
  const bookedSeats = await manager.find(BookingSeat, {
    where: {
      bookingId: In(bookingIds),
      departureStopId: In(stops.map((s) => s.id)),
      arrivalStopId: In(stops.map((s) => s.id)),
    },
    relations: { departureStop: true, arrivalStop: true },
  });

  // 6. Determine which seats are occupied on the requested segment
  const occupiedSeats = new Set<string>();

  for (const bs of bookedSeats) {
    if (!bs.departureStop || !bs.arrivalStop) continue;

    const bsFrom = bs.departureStop.stopOrder;
    const bsTo = bs.arrivalStop.stopOrder;

    // Overlap check: segments overlap when booking.from < requested.to AND booking.to > requested.from
    if (bsFrom < arrivalStop.stopOrder && bsTo > departureStop.stopOrder) {
      occupiedSeats.add(bs.seatNumber);
    }
  }

  // 7. Build full seat list
  const seats: SeatAvailability[] = [];
  for (let i = 1; i <= vehicleCapacity; i++) {
    const seatNumber = generateSeatNumber(i);
    seats.push({
      seatNumber,
      available: !occupiedSeats.has(seatNumber),
      occupiedBy: occupiedSeats.has(seatNumber) ? 'Occupé' : undefined,
    });
  }

  return {
    tripId,
    vehicleCapacity,
    totalBookedOnSegment: occupiedSeats.size,
    availableSeats: vehicleCapacity - occupiedSeats.size,
    seats,
    departureStop,
    arrivalStop,
  };
}

/**
 * Prediction function: How many seats will be freed at a specific intermediate stop?
 *
 * This lets an agency manager at an intermediate stop (e.g., Yaoundé)
 * see how many current passengers will alight there, freeing seats for new sales.
 */
export async function predirePlacesLibresAArrivee(
  manager: EntityManager,
  tripId: string,
  stopCityId: string,
): Promise<PredictionResult> {
  // 1. Load trip with route
  const trip = await manager.findOne(Trip, {
    where: { id: tripId },
    relations: { vehicle: true, route: true },
  });

  if (!trip) {
    throw new NotFoundException('Voyage introuvable');
  }

  if (!trip.vehicle) {
    throw new BadRequestException('Aucun véhicule associé à ce voyage');
  }

  if (!trip.routeId) {
    throw new BadRequestException('Ce voyage n\'est pas associé à une route avec escales');
  }

  // 2. Load route stops
  const stops = await manager.find(RouteStop, {
    where: { routeId: trip.routeId },
    order: { stopOrder: 'ASC' },
  });

  // 3. Find the target stop
  const targetStop = stops.find((s) => s.cityId === stopCityId);
  if (!targetStop) {
    throw new NotFoundException('Cette ville n\'est pas une escale de la route');
  }

  // 4. Get active bookings
  const activeBookings = await manager.find(Booking, {
    where: {
      tripId,
      status: In([BookingStatus.PENDING, BookingStatus.CONFIRMED]),
    },
    select: { id: true },
  });

  if (activeBookings.length === 0) {
    const vehicleCapacity = trip.vehicle.capacity;
    return {
      tripId,
      agencyCity: stopCityId,
      stopOrder: targetStop.stopOrder,
      seatsFreed: 0,
      seatNumbers: [],
      currentlyOccupied: 0,
      currentlyAvailable: vehicleCapacity,
    };
  }

  const bookingIds = activeBookings.map((b) => b.id);

  // 5. Get all booking seats with segment info
  const bookedSeats = await manager.find(BookingSeat, {
    where: {
      bookingId: In(bookingIds),
    },
    relations: { departureStop: true, arrivalStop: true },
  });

  // 6. Count seats freed at this stop (passengers whose arrival = this stop)
  const freedSeats: string[] = [];
  let currentlyOccupied = 0;

  for (const bs of bookedSeats) {
    if (!bs.departureStop || !bs.arrivalStop) continue;

    // Seat is occupied if it's on a segment that includes this stop
    const segFrom = bs.departureStop.stopOrder;
    const segTo = bs.arrivalStop.stopOrder;

    if (segFrom < targetStop.stopOrder && segTo >= targetStop.stopOrder) {
      currentlyOccupied++;
    }

    // Seat is freed if the passenger alights exactly at this stop
    if (segTo === targetStop.stopOrder) {
      freedSeats.push(bs.seatNumber);
    }
  }

  const vehicleCapacity = trip.vehicle.capacity;

  return {
    tripId,
    agencyCity: stopCityId,
    stopOrder: targetStop.stopOrder,
    seatsFreed: freedSeats.length,
    seatNumbers: freedSeats.sort(),
    currentlyOccupied,
    currentlyAvailable: vehicleCapacity - currentlyOccupied,
  };
}

/**
 * Calculate segment price based on cumulative priceFromPrev values.
 * E.g., Douala(0) → Yaoundé(5000) → Bertoua(7000) → Garoua(6000)
 * Douala→Bertoua = 5000 + 7000 = 12000
 */
export async function calculateSegmentPrice(
  manager: EntityManager,
  routeId: string,
  departureStopId: string,
  arrivalStopId: string,
): Promise<number> {
  const stops = await manager.find(RouteStop, {
    where: { routeId },
    order: { stopOrder: 'ASC' },
  });

  const depIdx = stops.findIndex((s) => s.id === departureStopId);
  const arrIdx = stops.findIndex((s) => s.id === arrivalStopId);

  if (depIdx === -1 || arrIdx === -1 || depIdx >= arrIdx) {
    throw new BadRequestException('Escales de départ/arrivée invalides pour ce calcul');
  }

  let totalPrice = 0;
  for (let i = depIdx + 1; i <= arrIdx; i++) {
    totalPrice += Number(stops[i].priceFromPrev) || 0;
  }
  return totalPrice;
}

// --- Helpers ---

function generateSeatNumber(index: number): string {
  const row = Math.ceil(index / 4);
  const col = ['A', 'B', 'C', 'D'][(index - 1) % 4];
  return `${row}${col}`;
}

function generateAllSeats(capacity: number): SeatAvailability[] {
  const seats: SeatAvailability[] = [];
  for (let i = 1; i <= capacity; i++) {
    seats.push({ seatNumber: generateSeatNumber(i), available: true });
  }
  return seats;
}

async function buildLegacyAvailability(
  trip: Trip,
  vehicleCapacity: number,
  departureStopId: string,
  arrivalStopId: string,
): Promise<SegmentAvailability> {
  // Fallback for trips without a route — flat capacity check
  const depStop = { id: departureStopId, stopOrder: 1, cityId: '', routeId: '', stopDurationMin: 0, isActive: true, priceFromPrev: 0 } as RouteStop;
  const arrStop = { id: arrivalStopId, stopOrder: 2, cityId: '', routeId: '', stopDurationMin: 0, isActive: true, priceFromPrev: 0 } as RouteStop;

  return {
    tripId: trip.id,
    vehicleCapacity,
    totalBookedOnSegment: trip.bookedSeats,
    availableSeats: vehicleCapacity - trip.bookedSeats,
    seats: generateAllSeats(vehicleCapacity),
    departureStop: depStop,
    arrivalStop: arrStop,
  };
}
