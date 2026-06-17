import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  OneToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Booking } from '../../booking/entities/booking.entity';

export enum PaymentProvider {
  WALLET = 'WALLET',
  MTN_MOMO = 'MTN_MOMO',
  ORANGE_MONEY = 'ORANGE_MONEY',
  CASH = 'CASH',
}

export enum PaymentStatus {
  PENDING = 'PENDING',
  SUCCESS = 'SUCCESS',
  FAILED = 'FAILED',
  REFUNDED = 'REFUNDED',
}

@Entity('payments')
@Index(['bookingId'], { unique: true })
@Index(['transactionRef'], { unique: true })
export class Payment {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  bookingId!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  amount!: number;

  @Column({ length: 10, default: 'XAF' })
  currency!: string;

  @Column({ type: 'enum', enum: PaymentProvider })
  provider!: PaymentProvider;

  @Column({ length: 100, unique: true })
  transactionRef!: string;

  @Column({ type: 'enum', enum: PaymentStatus, default: PaymentStatus.PENDING })
  status!: PaymentStatus;

  @Column({ type: 'timestamptz', nullable: true })
  paidAt?: Date;

  @Column({ type: 'jsonb', nullable: true })
  metadata?: Record<string, unknown>;

  @OneToOne(() => Booking, (booking) => booking.payment)
  @JoinColumn()
  booking!: Booking;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
