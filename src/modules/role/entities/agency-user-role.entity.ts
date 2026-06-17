import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
  UpdateDateColumn,
} from 'typeorm';
import { Agency } from '../../agency/entities/agency.entity';
import { Company } from '../../company/entities/company.entity';
import { User } from '../../user/entities/user.entity';

export enum AgencyUserRoleStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
}

/**
 * Représente l'affectation d'un utilisateur à une agence.
 * Le rôle de l'utilisateur est porté par User.roleId (rôle unique).
 */
@Entity('agency_user_roles')
@Index(['userId'])
@Index(['companyId', 'agencyId'])
@Unique(['userId', 'companyId', 'agencyId'])
export class AgencyUserRole {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'uuid' })
  companyId!: string;

  @Column({ type: 'uuid' })
  agencyId!: string;

  @Column({
    type: 'enum',
    enum: AgencyUserRoleStatus,
    default: AgencyUserRoleStatus.ACTIVE,
  })
  status!: AgencyUserRoleStatus;

  @ManyToOne(() => User, (user) => user.agencyUserRoles, {
    onDelete: 'CASCADE',
  })
  user!: User;

  @ManyToOne(() => Company, (company) => company.agencyUserRoles, {
    onDelete: 'CASCADE',
  })
  company!: Company;

  @ManyToOne(() => Agency, (agency) => agency.agencyUserRoles, {
    onDelete: 'CASCADE',
  })
  agency!: Agency;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
