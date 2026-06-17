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
@Index(['companyId', 'agencyId'])
export class Vehicle {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  companyId!: string;

  @Column({ type: 'uuid' })
  agencyId!: string;

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

  @ManyToOne(() => Agency, (agency) => agency.vehicles, { onDelete: 'CASCADE' })
  agency!: Agency;

  @OneToMany(() => Trip, (trip) => trip.vehicle)
  trips!: Trip[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
