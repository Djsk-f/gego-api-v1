import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Booking, BookingStatus } from '../entities/booking.entity';
import { BookingSeat } from '../entities/booking-seat.entity';
import { Ticket, TicketStatus } from '../../ticket/entities/ticket.entity';
import { Payment, PaymentStatus } from '../../payment/entities/payment.entity';
import { Trip } from '../../trip/entities/trip.entity';

export async function resolveBookingForCancellation(
  manager: EntityManager,
  id: string,
  userId: string,
): Promise<{ booking: Booking; trip: Trip; payment: Payment | null }> {
  const booking = await manager.findOne(Booking, {
    where: { id, userId },
    relations: { trip: true, payment: true },
  });

  if (!booking) throw new NotFoundException('Booking not found');

  if (booking.status !== BookingStatus.CONFIRMED && booking.status !== BookingStatus.PENDING) {
    throw new BadRequestException('Booking cannot be cancelled');
  }

  const twoHoursFromNow = new Date(Date.now() + 2 * 60 * 60 * 1000);
  if (booking.trip.departureTime < twoHoursFromNow) {
    throw new BadRequestException('Cannot cancel less than 2 hours before departure');
  }

  return { booking, trip: booking.trip, payment: booking.payment };
}

export async function expireTickets(manager: EntityManager, bookingId: string): Promise<void> {
  const seats = await manager.find(BookingSeat, { where: { bookingId } });

  for (const seat of seats) {
    const ticket = await manager.findOne(Ticket, { where: { bookingSeatId: seat.id } });
    if (ticket) {
      ticket.status = TicketStatus.EXPIRED;
      await manager.save(ticket);
    }
  }
}
