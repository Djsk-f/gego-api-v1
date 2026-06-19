import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Company } from '../../company/entities/company.entity';
import { Booking } from '../../booking/entities/booking.entity';
import { AgencyUserRole } from '../../role/entities/agency-user-role.entity';
import { PricingRule } from '../../trip/entities/pricing-rule.entity';
import { Trip } from '../../trip/entities/trip.entity';

export enum AgencyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

@Entity('agencies')
@Index(['companyId', 'city'])
export class Agency {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  companyId!: string;

  @Column({ length: 150 })
  name!: string;

  @Column({ length: 100, nullable: true })
  region?: string;

  @Column({ length: 100 })
  city!: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ length: 30, nullable: true })
  phone?: string;

  @Column({ type: 'enum', enum: AgencyStatus, default: AgencyStatus.ACTIVE })
  status!: AgencyStatus;

  @Column({ type: 'decimal', precision: 3, scale: 1, default: 0 })
  rating!: number;

  @ManyToOne(() => Company, (company) => company.agencies, {
    onDelete: 'CASCADE',
  })
  company!: Company;

  @OneToMany(() => AgencyUserRole, (agencyUserRole) => agencyUserRole.agency)
  agencyUserRoles!: AgencyUserRole[];

  @OneToMany(() => Trip, (trip) => trip.agency)
  trips!: Trip[];

  @OneToMany(() => Booking, (booking) => booking.agency)
  bookings!: Booking[];

  @OneToMany(() => PricingRule, (rule) => rule.agency)
  pricingRules!: PricingRule[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
