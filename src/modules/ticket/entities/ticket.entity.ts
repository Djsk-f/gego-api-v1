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
import { BookingSeat } from '../../booking/entities/booking-seat.entity';
import { User } from '../../user/entities/user.entity';

export enum TicketStatus {
  PENDING = 'PENDING',
  PAID = 'PAID',
  VALIDATED = 'VALIDATED',
  EXPIRED = 'EXPIRED',
}

@Entity('tickets')
@Index(['qrCode'], { unique: true })
export class Ticket {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  bookingSeatId!: string;

  @Column({ length: 120, unique: true })
  qrCode!: string;

  @Column({ type: 'enum', enum: TicketStatus, default: TicketStatus.PENDING })
  status!: TicketStatus;

  @Column({ type: 'timestamptz', nullable: true })
  validatedAt?: Date;

  @Column({ type: 'uuid', nullable: true })
  validatedBy?: string;

  @OneToOne(() => BookingSeat, (seat) => seat.ticket)
  @JoinColumn()
  bookingSeat!: BookingSeat;

  @ManyToOne(() => User, { onDelete: 'SET NULL' })
  @JoinColumn({ name: 'validatedBy' })
  validator?: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
