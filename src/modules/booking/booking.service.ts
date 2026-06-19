import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { BaseService } from '../../common/services/base.service';
import { Booking, BookingStatus } from './entities/booking.entity';
import { CreateBookingDto } from './dto/create-booking.dto';
import { assertTripAvailable, assertSegmentAvailable } from './helpers/booking-validation.helper';
import { resolvePrice, resolveSegmentPrice } from './helpers/booking-pricing.helper';
import { generateSeatsAndTickets } from './helpers/ticket-generator.helper';
import { createPendingPayment } from './helpers/payment-creator.helper';
import { resolveBookingForCancellation, expireTickets } from './helpers/booking-cancellation.helper';
import { PaymentStatus } from '../payment/entities/payment.entity';

@Injectable()
export class BookingService extends BaseService<Booking> {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    private readonly dataSource: DataSource,
  ) {
    super(bookingRepository);
  }

  async createBooking(dto: CreateBookingDto, userId?: string) {
    return this.dataSource.transaction(async (manager) => {
      const hasSegmentInfo = dto.departureStopId && dto.arrivalStopId;

      let trip;

      if (hasSegmentInfo) {
        // Segment-aware booking: validate seats for the specific segment
        const seatNumbers = dto.seats.map((s) => s.seatNumber);
        trip = await assertSegmentAvailable(
          manager,
          dto.tripId,
          seatNumbers,
          dto.departureStopId!,
          dto.arrivalStopId!,
        );
      } else {
        // Legacy flat booking
        trip = await assertTripAvailable(manager, dto.tripId, dto.seats.length);
      }

      const unitPrice = await resolveSegmentPrice(
        manager,
        trip,
        dto.departureStopId,
        dto.arrivalStopId,
      );
      const totalPrice = unitPrice * dto.seats.length;

      const booking = manager.create(Booking, {
        companyId: trip.companyId,
        agencyId: trip.agencyId,
        userId: userId,
        tripId: trip.id,
        totalPrice,
        passengerCount: dto.seats.length,
        status: BookingStatus.PENDING,
      });

      const savedBooking = await manager.save(booking);

      // Propagate segment info from DTO to each seat
      const seatsWithSegment = dto.seats.map((s) => ({
        ...s,
        departureStopId: s.departureStopId ?? dto.departureStopId,
        arrivalStopId: s.arrivalStopId ?? dto.arrivalStopId,
      }));

      await generateSeatsAndTickets(manager, savedBooking.id, seatsWithSegment);

      trip.bookedSeats += dto.seats.length;
      await manager.save(trip);

      await createPendingPayment(manager, savedBooking.id, totalPrice);

      return manager.findOne(Booking, {
        where: { id: savedBooking.id },
        relations: {
          seats: { ticket: true, departureStop: true, arrivalStop: true },
          payment: true,
          trip: { route: true },
        },
      });
    });
  }

  findByUser(userId: string) {
    return this.bookingRepository.find({
      where: { userId },
      relations: { seats: { ticket: true, departureStop: true, arrivalStop: true }, payment: true, trip: true, agency: true },
      order: { createdAt: 'DESC' },
    });
  }

  findByUserAndId(id: string, userId: string) {
    return this.findOne({
      where: { id, userId },
      relations: {
        seats: { ticket: true, departureStop: true, arrivalStop: true },
        payment: true,
        trip: { vehicle: true, driver: true, route: true },
        agency: true,
      },
    });
  }

  async cancel(id: string, userId: string) {
    return this.dataSource.transaction(async (manager) => {
      const { booking, trip, payment } = await resolveBookingForCancellation(manager, id, userId);

      booking.status = BookingStatus.CANCELLED;
      booking.cancelledAt = new Date();
      await manager.save(booking);

      trip.bookedSeats -= booking.passengerCount;
      await manager.save(trip);

      if (payment) {
        payment.status = PaymentStatus.REFUNDED;
        await manager.save(payment);
      }

      await expireTickets(manager, booking.id);

      return booking;
    });
  }
}
