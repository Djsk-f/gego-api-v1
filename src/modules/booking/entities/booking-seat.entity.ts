import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Booking } from './booking.entity';
import { Ticket } from '../../ticket/entities/ticket.entity';
import { RouteStop } from '../../route/entities/route-stop.entity';

@Entity('booking_seats')
@Index(['bookingId'])
@Index(['bookingId', 'seatNumber'], { unique: true })
@Index(['departureStopId'])
@Index(['arrivalStopId'])
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

  @Column({ type: 'uuid', nullable: true })
  departureStopId?: string;

  @Column({ type: 'uuid', nullable: true })
  arrivalStopId?: string;

  @ManyToOne(() => Booking, (booking) => booking.seats, { onDelete: 'CASCADE' })
  booking!: Booking;

  @ManyToOne(() => RouteStop, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'departureStopId' })
  departureStop?: RouteStop;

  @ManyToOne(() => RouteStop, { onDelete: 'RESTRICT', nullable: true })
  @JoinColumn({ name: 'arrivalStopId' })
  arrivalStop?: RouteStop;

  @OneToOne(() => Ticket, (ticket) => ticket.bookingSeat)
  ticket!: Ticket;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
