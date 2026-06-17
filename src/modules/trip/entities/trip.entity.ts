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
import { Booking } from '../../booking/entities/booking.entity';
import { Driver } from '../../driver/entities/driver.entity';
import { Vehicle } from '../../vehicle/entities/vehicle.entity';

export enum TripStatus {
  SCHEDULED = 'SCHEDULED',
  ACTIVE = 'ACTIVE',
  COMPLETED = 'COMPLETED',
  CANCELLED = 'CANCELLED',
}

@Entity('trips')
@Index(['companyId', 'agencyId'])
@Index(['departureCity', 'arrivalCity'])
@Index(['departureTime'])
export class Trip {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  companyId!: string;

  @Column({ type: 'uuid' })
  agencyId!: string;

  @Column({ type: 'uuid' })
  vehicleId!: string;

  @Column({ type: 'uuid', nullable: true })
  driverId?: string;

  @Column({ length: 100 })
  departureCity!: string;

  @Column({ length: 100 })
  arrivalCity!: string;

  @Column({ type: 'timestamptz' })
  departureTime!: Date;

  @Column({ type: 'timestamptz', nullable: true })
  arrivalTime?: Date;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  price!: number;

  @Column({ type: 'int', default: 0 })
  bookedSeats!: number;

  @Column({ type: 'enum', enum: TripStatus, default: TripStatus.SCHEDULED })
  status!: TripStatus;

  @ManyToOne(() => Agency, (agency) => agency.trips, { onDelete: 'CASCADE' })
  agency!: Agency;

  @ManyToOne(() => Vehicle, (vehicle) => vehicle.trips, { onDelete: 'CASCADE' })
  vehicle!: Vehicle;

  @ManyToOne(() => Driver, (driver) => driver.trips, { onDelete: 'SET NULL', nullable: true })
  driver?: Driver;

  @OneToMany(() => Booking, (booking) => booking.trip)
  bookings!: Booking[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
