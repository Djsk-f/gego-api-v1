import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Agency } from '../../agency/entities/agency.entity';

@Entity('pricing_rules')
@Index(['agencyId', 'departureCity', 'arrivalCity'])
@Index(['agencyId', 'active'])
export class PricingRule {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  companyId!: string;

  @Column({ type: 'uuid' })
  agencyId!: string;

  @Column({ length: 100 })
  departureCity!: string;

  @Column({ length: 100 })
  arrivalCity!: string;

  @Column({ type: 'decimal', precision: 10, scale: 2 })
  basePrice!: number;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  vipPrice?: number;

  @Column({ type: 'boolean', default: true })
  active!: boolean;

  @ManyToOne(() => Agency, (agency) => agency.pricingRules, { onDelete: 'CASCADE' })
  agency!: Agency;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
