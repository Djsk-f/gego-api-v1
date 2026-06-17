import {
  Column,
  CreateDateColumn,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';
import { Permission } from './permission.entity';

export enum RoleScope {
  PLATFORM = 'PLATFORM',
  COMPANY = 'COMPANY',
  AGENCY = 'AGENCY',
  CUSTOMER = 'CUSTOMER',
}

@Entity('roles')
export class Role {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 80, unique: true })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'enum', enum: RoleScope })
  scope!: RoleScope;

  @ManyToMany(() => Permission, (permission) => permission.roles)
  permissions!: Permission[];

  /** Utilisateurs qui ont ce rôle (rôle unique par user) */
  @OneToMany(() => User, (user) => user.role)
  users!: User[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
