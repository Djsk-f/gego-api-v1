import { BadRequestException, ForbiddenException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { BaseService } from '../../common/services/base.service';
import type { AuthenticatedUser } from '../../common/types/authenticated-user.type';
import { Booking, BookingStatus } from '../booking/entities/booking.entity';
import { BookingSeat } from '../booking/entities/booking-seat.entity';
import { Payment, PaymentProvider, PaymentStatus } from './entities/payment.entity';
import { Ticket, TicketStatus } from '../ticket/entities/ticket.entity';
import { resolveBookingForPayment, resolvePaymentByRef } from './helpers/payment-validation.helper';

@Injectable()
export class PaymentService extends BaseService<Payment> {
  constructor(
    @InjectRepository(Payment)
    private readonly paymentRepository: Repository<Payment>,
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly dataSource: DataSource,
  ) {
    super(paymentRepository);
  }

  async initiate(bookingId: string, provider: PaymentProvider, phone: string | undefined, user: AuthenticatedUser) {
    const { booking, payment } = await resolveBookingForPayment(
      this.paymentRepository.manager,
      bookingId,
    );

    if (user.type !== 'SUPER_ADMIN' && booking.userId !== user.id) {
      throw new ForbiddenException('You do not own this booking');
    }

    payment.provider = provider;
    if (phone) {
      payment.metadata = { ...(payment.metadata || {}), phone };
    }

    await this.paymentRepository.save(payment);

    return {
      paymentId: payment.id,
      bookingId: booking.id,
      amount: payment.amount,
      provider,
      status: PaymentStatus.PENDING,
      transactionRef: payment.transactionRef,
      message: 'Payment initiated. Use /payments/confirm to simulate success.',
    };
  }

  async confirm(transactionRef: string, user: AuthenticatedUser) {
    const payment = await resolvePaymentByRef(
      this.paymentRepository.manager,
      transactionRef,
    );

    if (user.type !== 'SUPER_ADMIN' && payment.booking.userId !== user.id) {
      throw new ForbiddenException('You do not own this booking');
    }

    if (payment.status !== PaymentStatus.PENDING) {
      throw new BadRequestException(
        `Payment cannot be confirmed (current status: ${payment.status})`,
      );
    }

    return this.dataSource.transaction(async (manager) => {
      payment.status = PaymentStatus.SUCCESS;
      payment.paidAt = new Date();
      await manager.save(payment);

      payment.booking.status = BookingStatus.CONFIRMED;
      await manager.save(payment.booking);

      const seatIds = (await manager.find(BookingSeat, {
        where: { bookingId: payment.bookingId },
        select: { id: true },
      })).map(s => s.id);

      await manager.update(
        Ticket,
        { bookingSeatId: In(seatIds) },
        { status: TicketStatus.PAID },
      );

      return {
        status: PaymentStatus.SUCCESS,
        paidAt: payment.paidAt,
        bookingId: payment.bookingId,
      };
    });
  }

  async findPaymentStatus(bookingId: string, user: AuthenticatedUser) {
    const payment = await this.findOne({ where: { bookingId }, relations: { booking: true } });

    if (user.type !== 'SUPER_ADMIN' && payment.booking.userId !== user.id) {
      throw new ForbiddenException('You do not own this booking');
    }

    return {
      status: payment.status,
      amount: payment.amount,
      provider: payment.provider,
      paidAt: payment.paidAt,
      transactionRef: payment.transactionRef,
    };
  }
}
