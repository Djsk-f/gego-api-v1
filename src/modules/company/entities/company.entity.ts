import {
  Column,
  CreateDateColumn,
  Entity,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Agency } from '../../agency/entities/agency.entity';
import { AgencyUserRole } from '../../role/entities/agency-user-role.entity';

export enum CompanyStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

@Entity('companies')
export class Company {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 150 })
  name!: string;

  @Column({ length: 180, nullable: true })
  legalName?: string;

  @Column({ length: 180, nullable: true })
  email?: string;

  @Column({ length: 30, nullable: true })
  phone?: string;

  @Column({ type: 'text', nullable: true })
  address?: string;

  @Column({ type: 'enum', enum: CompanyStatus, default: CompanyStatus.ACTIVE })
  status!: CompanyStatus;

  @Column({ length: 60, unique: true, nullable: true })
  registrationNumber?: string;

  @Column({ type: 'text', nullable: true })
  logo?: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @OneToMany(() => Agency, (agency) => agency.company)
  agencies!: Agency[];

  @OneToMany(() => AgencyUserRole, (agencyUserRole) => agencyUserRole.company)
  agencyUserRoles!: AgencyUserRole[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
