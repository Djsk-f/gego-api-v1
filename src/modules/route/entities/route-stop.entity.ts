import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { City } from '../../location/entities/city.entity';
import { Route } from './route.entity';

@Entity('route_stops')
@Index(['routeId', 'stopOrder'], { unique: true })
export class RouteStop {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  routeId!: string;

  @Column({ type: 'uuid' })
  cityId!: string;

  @Column({ type: 'int' })
  stopOrder!: number;

  @Column({ type: 'int', default: 10 })
  stopDurationMin!: number;

  @Column({ type: 'int', nullable: true })
  distanceFromPrevKm?: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, default: 0 })
  priceFromPrev!: number;

  @Column({ default: true })
  isActive!: boolean;

  @ManyToOne(() => Route, (route) => route.stops, { onDelete: 'CASCADE' })
  route!: Route;

  @ManyToOne(() => City, { onDelete: 'RESTRICT' })
  city!: City;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
