import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  JoinColumn,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Booking } from '../../booking/entities/booking.entity';
import { AgencyUserRole } from '../../role/entities/agency-user-role.entity';
import { Role } from '../../role/entities/role.entity';

export enum UserType {
  CUSTOMER = 'CUSTOMER',
  AGENCY_STAFF = 'AGENCY_STAFF',
  COMPANY_ADMIN = 'COMPANY_ADMIN',
  SUPER_ADMIN = 'SUPER_ADMIN',
}

export enum UserStatus {
  ACTIVE = 'ACTIVE',
  INACTIVE = 'INACTIVE',
  SUSPENDED = 'SUSPENDED',
}

@Entity('users')
@Index(['email'], { unique: true, where: 'email IS NOT NULL' })
@Index(['phone'], { unique: true, where: 'phone IS NOT NULL' })
export class User {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 100 })
  firstName!: string;

  @Column({ length: 100 })
  lastName!: string;

  @Column({ length: 180, nullable: true })
  email?: string;

  @Column({ length: 30, nullable: true })
  phone?: string;

  @Column({ type: 'text', nullable: true, select: false })
  passwordHash?: string;

  @Column({ type: 'enum', enum: UserType, default: UserType.CUSTOMER })
  type!: UserType;

  @Column({ type: 'enum', enum: UserStatus, default: UserStatus.ACTIVE })
  status!: UserStatus;

  @Column({ type: 'uuid', nullable: true })
  companyId?: string;

  /**
   * Rôle unique de l'utilisateur (CUSTOMER, COMPANY_ADMIN, AGENCY_MANAGER…)
   */
  @Column({ type: 'uuid', nullable: true })
  roleId?: string;

  @ManyToOne(() => Role, { nullable: true, eager: false })
  @JoinColumn({ name: 'roleId' })
  role?: Role;

  @OneToMany(() => AgencyUserRole, (agencyUserRole) => agencyUserRole.user)
  agencyUserRoles!: AgencyUserRole[];

  @OneToMany(() => Booking, (booking) => booking.user)
  bookings!: Booking[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
