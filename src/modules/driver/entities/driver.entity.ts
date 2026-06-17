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
import { Agency } from '../../agency/entities/agency.entity';
import { Trip } from '../../trip/entities/trip.entity';

export enum DriverStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

@Entity('drivers')
@Index(['companyId', 'agencyId'])
export class Driver {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  companyId!: string;

  @Column({ type: 'uuid' })
  agencyId!: string;

  @Column({ length: 100 })
  firstName!: string;

  @Column({ length: 100 })
  lastName!: string;

  @Column({ length: 30 })
  phone!: string;

  @Column({ length: 50 })
  licenseNumber!: string;

  @Column({ type: 'decimal', precision: 2, scale: 1, default: 0 })
  rating!: number;

  @Column({ type: 'int', default: 0 })
  totalTrips!: number;

  @Column({ type: 'enum', enum: DriverStatus, default: DriverStatus.ACTIVE })
  status!: DriverStatus;

  @ManyToOne(() => Agency, (agency) => agency.drivers, { onDelete: 'CASCADE' })
  agency!: Agency;

  @OneToMany(() => Trip, (trip) => trip.driver)
  trips!: Trip[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
