import { EntityManager } from 'typeorm';
import { Trip } from '../../trip/entities/trip.entity';
import { PricingRule } from '../../trip/entities/pricing-rule.entity';
import { RouteStop } from '../../route/entities/route-stop.entity';

export async function resolvePrice(
  manager: EntityManager,
  trip: Trip,
): Promise<number> {
  const pricing = await manager.findOne(PricingRule, {
    where: {
      agencyId: trip.agencyId,
      departureCity: trip.departureCity,
      arrivalCity: trip.arrivalCity,
      active: true,
    },
  });

  return pricing ? Number(pricing.basePrice) : Number(trip.price);
}

/**
 * Resolve price for a specific segment using cumulative priceFromPrev values.
 * Falls back to PricingRule, then to trip.price.
 */
export async function resolveSegmentPrice(
  manager: EntityManager,
  trip: Trip,
  departureStopId?: string,
  arrivalStopId?: string,
): Promise<number> {
  // If segment info provided, try route-based pricing
  if (departureStopId && arrivalStopId && trip.routeId) {
    const stops = await manager.find(RouteStop, {
      where: { routeId: trip.routeId },
      order: { stopOrder: 'ASC' },
    });

    const depIdx = stops.findIndex((s) => s.id === departureStopId);
    const arrIdx = stops.findIndex((s) => s.id === arrivalStopId);

    if (depIdx !== -1 && arrIdx !== -1 && depIdx < arrIdx) {
      let segmentPrice = 0;
      for (let i = depIdx + 1; i <= arrIdx; i++) {
        segmentPrice += Number(stops[i].priceFromPrev) || 0;
      }

      if (segmentPrice > 0) {
        return segmentPrice;
      }
    }
  }

  // Fallback to flat pricing
  return resolvePrice(manager, trip);
}
