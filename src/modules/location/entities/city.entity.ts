import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  JoinColumn,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Region } from './region.entity';

export enum CityScope {
  GLOBAL = 'GLOBAL',
  COMPANY = 'COMPANY',
}

@Entity('cities')
@Index(['name', 'regionId'], { unique: true })
@Index(['name', 'companyId'], { unique: true })
export class City {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ type: 'uuid' })
  regionId!: string;

  @ManyToOne(() => Region, (region) => region.cities, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'regionId' })
  region!: Region;

  @Column({ type: 'enum', enum: CityScope, default: CityScope.GLOBAL })
  scope!: CityScope;

  @Column({ type: 'uuid', nullable: true })
  companyId?: string;

  @Column({ default: true })
  isActive!: boolean;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
