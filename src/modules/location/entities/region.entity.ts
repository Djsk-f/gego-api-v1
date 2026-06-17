import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { City } from './city.entity';

export enum RegionScope {
  GLOBAL = 'GLOBAL',
  COMPANY = 'COMPANY',
}

@Entity('regions')
@Index(['name', 'companyId'], { unique: true })
export class Region {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  name!: string;

  @Column({ type: 'enum', enum: RegionScope, default: RegionScope.GLOBAL })
  scope!: RegionScope;

  @Column({ type: 'uuid', nullable: true })
  companyId?: string;

  @Column({ default: true })
  isActive!: boolean;

  @OneToMany(() => City, (city) => city.region)
  cities!: City[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
