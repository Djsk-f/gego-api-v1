import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Agency } from '../../agency/entities/agency.entity';
import { Trip } from '../../trip/entities/trip.entity';
import { User } from '../../user/entities/user.entity';
import { BookingSeat } from './booking-seat.entity';
import { Payment } from '../../payment/entities/payment.entity';

export enum BookingStatus {
  PENDING = 'PENDING',
  CONFIRMED = 'CONFIRMED',
  CANCELLED = 'CANCELLED',
  REFUNDED = 'REFUNDED',
}

@Entity('bookings')
@Index(['userId'])
@Index(['tripId'])
@Index(['companyId', 'agencyId'])
@Index(['status'])
export class Booking {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  companyId!: string;

  @Column({ type: 'uuid' })
  agencyId!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid' })
  tripId!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  totalPrice!: number;

  @Column({ type: 'int', default: 1 })
  passengerCount!: number;

  @Column({ type: 'enum', enum: BookingStatus, default: BookingStatus.PENDING })
  status!: BookingStatus;

  @Column({ type: 'timestamptz', nullable: true })
  cancelledAt?: Date;

  @Column({ type: 'text', nullable: true })
  cancellationReason?: string;

  @ManyToOne(() => User, (user) => user.bookings, { onDelete: 'CASCADE' })
  user!: User;

  @ManyToOne(() => Trip, (trip) => trip.bookings, { onDelete: 'CASCADE' })
  trip!: Trip;

  @ManyToOne(() => Agency, (agency) => agency.bookings, { onDelete: 'CASCADE' })
  agency!: Agency;

  @OneToMany(() => BookingSeat, (seat) => seat.booking)
  seats!: BookingSeat[];

  @OneToOne(() => Payment, (payment) => payment.booking)
  payment!: Payment;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
