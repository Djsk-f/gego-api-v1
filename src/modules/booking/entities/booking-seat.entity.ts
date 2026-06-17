import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Booking } from './booking.entity';
import { Ticket } from '../../ticket/entities/ticket.entity';

@Entity('booking_seats')
@Index(['bookingId'])
@Index(['bookingId', 'seatNumber'], { unique: true })
export class BookingSeat {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  bookingId!: string;

  @Column({ length: 10 })
  seatNumber!: string;

  @Column({ length: 100 })
  passengerName!: string;

  @Column({ length: 30, nullable: true })
  passengerPhone?: string;

  @ManyToOne(() => Booking, (booking) => booking.seats, { onDelete: 'CASCADE' })
  booking!: Booking;

  @OneToOne(() => Ticket, (ticket) => ticket.bookingSeat)
  ticket!: Ticket;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
