import { randomBytes } from 'crypto';
import { EntityManager } from 'typeorm';
import { BookingSeat } from '../entities/booking-seat.entity';
import { Ticket, TicketStatus } from '../../ticket/entities/ticket.entity';

export async function generateSeatsAndTickets(
  manager: EntityManager,
  bookingId: string,
  seats: {
    seatNumber: string;
    passengerName: string;
    passengerPhone?: string;
    departureStopId?: string;
    arrivalStopId?: string;
  }[],
): Promise<void> {
  for (const seatDto of seats) {
    const seat = manager.create(BookingSeat, {
      bookingId,
      seatNumber: seatDto.seatNumber,
      passengerName: seatDto.passengerName,
      passengerPhone: seatDto.passengerPhone,
      departureStopId: seatDto.departureStopId,
      arrivalStopId: seatDto.arrivalStopId,
    });

    const savedSeat = await manager.save(seat);

    const qrCode = `GEGO-${bookingId.slice(0, 8)}-${savedSeat.id.slice(0, 8)}-${randomBytes(4).toString('hex').toUpperCase()}`;

    const ticket = manager.create(Ticket, {
      bookingSeatId: savedSeat.id,
      qrCode,
      status: TicketStatus.PENDING,
    });

    await manager.save(ticket);
  }
}
