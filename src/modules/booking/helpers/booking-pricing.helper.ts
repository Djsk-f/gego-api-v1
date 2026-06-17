import { EntityManager } from 'typeorm';
import { Trip } from '../../trip/entities/trip.entity';
import { PricingRule } from '../../trip/entities/pricing-rule.entity';

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
