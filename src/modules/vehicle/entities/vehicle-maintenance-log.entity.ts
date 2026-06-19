import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Vehicle } from './vehicle.entity';

export enum MaintenanceType {
  SERVICE = 'SERVICE',
  REPAIR = 'REPAIR',
  INSPECTION = 'INSPECTION',
  TIRE_CHANGE = 'TIRE_CHANGE',
  OTHER = 'OTHER',
}

export enum MaintenanceStatus {
  SCHEDULED = 'SCHEDULED',
  IN_PROGRESS = 'IN_PROGRESS',
  COMPLETED = 'COMPLETED',
}

@Entity('vehicle_maintenance_logs')
@Index(['vehicleId'])
@Index(['companyId'])
@Index(['status'])
export class VehicleMaintenanceLog {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  companyId!: string;

  @Column({ type: 'uuid' })
  vehicleId!: string;

  @Column({ type: 'enum', enum: MaintenanceType })
  type!: MaintenanceType;

  @Column({ type: 'text' })
  description!: string;

  @Column({ type: 'int', nullable: true })
  mileage?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  cost?: number;

  @Column({ type: 'timestamptz' })
  performedAt!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  nextServiceAt?: Date;

  @Column({ type: 'enum', enum: MaintenanceStatus, default: MaintenanceStatus.COMPLETED })
  status!: MaintenanceStatus;

  @Column({ length: 150, nullable: true })
  performedBy?: string;

  @ManyToOne(() => Vehicle, { onDelete: 'CASCADE' })
  vehicle!: Vehicle;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
