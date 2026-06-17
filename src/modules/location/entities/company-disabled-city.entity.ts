import { Entity, JoinColumn, ManyToOne, PrimaryColumn } from 'typeorm';
import { City } from './city.entity';

@Entity('company_disabled_cities')
export class CompanyDisabledCity {
  @PrimaryColumn({ type: 'uuid' })
  companyId!: string;

  @PrimaryColumn({ type: 'uuid' })
  cityId!: string;

  @ManyToOne(() => City, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'cityId' })
  city!: City;
}
