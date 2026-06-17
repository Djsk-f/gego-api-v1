import { Between, EntityManager } from 'typeorm';
import { Trip, TripStatus } from '../entities/trip.entity';
import { PricingRule } from '../entities/pricing-rule.entity';

export async function enrichTripsWithPricing(
  manager: EntityManager,
  trips: Trip[],
): Promise<(Trip & { vipPrice: number | null; availableSeats: number })[]> {
  if (trips.length === 0) return [];

  const keys = trips.map((t) => ({
    agencyId: t.agencyId,
    departureCity: t.departureCity,
    arrivalCity: t.arrivalCity,
  }));

  const pricingRules = keys.length > 0
    ? await manager.find(PricingRule, {
        where: keys.map((k) => ({
          agencyId: k.agencyId,
          departureCity: k.departureCity,
          arrivalCity: k.arrivalCity,
          active: true,
        })),
      })
    : [];

  const pricingMap = new Map(
    pricingRules.map((r) => [`${r.agencyId}|${r.departureCity}|${r.arrivalCity}`, r]),
  );

  return trips.map((trip) => {
    const key = `${trip.agencyId}|${trip.departureCity}|${trip.arrivalCity}`;
    const pricing = pricingMap.get(key);

    const availableSeats = trip.vehicle ? trip.vehicle.capacity - trip.bookedSeats : 0;

    return {
      ...trip,
      price: pricing ? Number(pricing.basePrice) : Number(trip.price),
      vipPrice: pricing?.vipPrice ? Number(pricing.vipPrice) : null,
      availableSeats,
    };
  });
}

export function buildSearchDateRange(date?: string): { start: Date; end: Date } {
  const start = date ? new Date(date) : new Date();
  start.setHours(0, 0, 0, 0);

  const end = new Date(start);
  end.setDate(end.getDate() + 1);

  return { start, end };
}

export function buildTripSearchWhere(
  departureCity: string,
  arrivalCity: string,
  start: Date,
  end: Date,
) {
  return {
    departureCity,
    arrivalCity,
    departureTime: Between(start, end),
    status: TripStatus.SCHEDULED,
  };
}
