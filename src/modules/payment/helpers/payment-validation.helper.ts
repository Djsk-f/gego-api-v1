import { BadRequestException, NotFoundException } from '@nestjs/common';
import { EntityManager } from 'typeorm';
import { Booking, BookingStatus } from '../../booking/entities/booking.entity';
import { Payment, PaymentStatus } from '../entities/payment.entity';

export async function resolveBookingForPayment(
  manager: EntityManager,
  bookingId: string,
): Promise<{ booking: Booking; payment: Payment }> {
  const booking = await manager.findOne(Booking, {
    where: { id: bookingId },
    relations: { payment: true },
  });

  if (!booking) throw new NotFoundException('Booking not found');
  if (booking.status !== BookingStatus.PENDING) {
    throw new BadRequestException('Booking is not pending payment');
  }

  const payment = booking.payment ?? (await manager.findOne(Payment, { where: { bookingId } }));
  if (!payment) throw new NotFoundException('Payment not found');
  if (payment.status === PaymentStatus.SUCCESS) {
    throw new BadRequestException('Payment already completed');
  }

  return { booking, payment };
}

export async function resolvePaymentByRef(
  manager: EntityManager,
  transactionRef: string,
): Promise<Payment> {
  const payment = await manager.findOne(Payment, {
    where: { transactionRef },
    relations: { booking: true },
  });

  if (!payment) throw new NotFoundException('Payment not found');
  return payment;
}
