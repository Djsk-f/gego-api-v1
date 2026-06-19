import {
  Column,
  CreateDateColumn,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  UpdateDateColumn,
} from 'typeorm';
import { User } from '../../user/entities/user.entity';

export enum RatingTargetType {
  AGENCY = 'AGENCY',
  TRIP = 'TRIP',
  DRIVER = 'DRIVER',
}

@Entity('ratings')
@Index(['targetType', 'targetId'])
@Index(['userId', 'targetType', 'targetId'], { unique: true })
export class Rating {
  @PrimaryGeneratedColumn('uuid')
  id!: string;

  @Column({ type: 'uuid' })
  userId!: string;

  @Column({ type: 'enum', enum: RatingTargetType })
  targetType!: RatingTargetType;

  @Column({ type: 'uuid' })
  targetId!: string;

  @Column({ type: 'int' })
  score!: number;

  @Column({ type: 'text', nullable: true })
  comment?: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user!: User;

  @CreateDateColumn()
  createdAt!: Date;

  @UpdateDateColumn()
  updatedAt!: Date;
}
