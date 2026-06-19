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
import { City } from '../../location/entities/city.entity';
import { RouteStop } from './route-stop.entity';

export enum RouteStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

@Entity('routes')
@Index(['companyId'])
@Index(['departureCityId', 'arrivalCityId'])
export class Route {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  companyId!: string;

  @Column({ length: 150 })
  name!: string;

  @Column({ type: 'uuid' })
  departureCityId!: string;

  @Column({ type: 'uuid' })
  arrivalCityId!: string;

  @Column({ type: 'int', nullable: true })
  distanceKm?: number;

  @Column({ type: 'int', nullable: true })
  baseDurationMin?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePrice!: number;

  @Column({ type: 'enum', enum: RouteStatus, default: RouteStatus.ACTIVE })
  status!: RouteStatus;

  @ManyToOne(() => City, { onDelete: 'RESTRICT' })
  departureCity!: City;

  @ManyToOne(() => City, { onDelete: 'RESTRICT' })
  arrivalCity!: City;

  @OneToMany(() => RouteStop, (stop) => stop.route, { cascade: true })
  stops!: RouteStop[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
