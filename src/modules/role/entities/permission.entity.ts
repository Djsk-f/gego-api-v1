import {
  Column,
  CreateDateColumn,
  Entity,
  JoinTable,
  ManyToMany,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Role } from './role.entity';

@Entity('permissions')
export class Permission {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ length: 120, unique: true })
  name!: string;

  @Column({ type: 'text', nullable: true })
  description?: string;

  @ManyToMany(() => Role, (role) => role.permissions)
  @JoinTable({
    name: 'role_permissions',
    joinColumn: {
      name: 'permission_id',
      referencedColumnName: 'id',
    },
    inverseJoinColumn: {
      name: 'role_id',
      referencedColumnName: 'id',
    },
  })
  roles!: Role[];

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
