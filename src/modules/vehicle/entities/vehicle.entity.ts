import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Trip } from '../../trip/entities/trip.entity';
import { VehicleMaintenanceLog } from './vehicle-maintenance-log.entity';

export enum VehicleType {
  BUS = 'BUS',
  MINIBUS = 'MINIBUS',
  CAR = 'CAR',
}

export enum VehicleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  MAINTENANCE = 'MAINTENANCE',
}

@Entity('vehicles')
@Index(['companyId'])
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  companyId!: string;

  @Column({ length: 20 })
  plateNumber!: string;

  @Column({ length: 50 })
  model!: string;

  @Column({ type: 'enum', enum: VehicleType, default: VehicleType.BUS })
  type!: VehicleType;

  @Column({ type: 'int' })
  capacity!: number;

  @Column({ type: 'enum', enum: VehicleStatus, default: VehicleStatus.ACTIVE })
  status!: VehicleStatus;

  @Column({ type: 'int', default: 0 })
  totalTrips!: number;

  @Column({ type: 'timestamptz', nullable: true })
  lastServiceAt?: Date;

  @Column({ type: 'timestamptz', nullable: true })
  nextServiceAt?: Date;

  @OneToMany(() => Trip, (trip) => trip.vehicle)
  trips!: Trip[];

  @OneToMany(() => VehicleMaintenanceLog, (log) => log.vehicle)
  maintenanceLogs!: VehicleMaintenanceLog[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
