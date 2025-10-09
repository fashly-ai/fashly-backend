import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  Column,
} from 'typeorm';
import { User } from './user.entity';
import { Glasses } from './glasses.entity';

@Entity('tryons')
@Index(['userId', 'glassesId'], { unique: true }) // Ensure one try-on record per user-glasses pair
export class TryOn {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  @Index()
  userId: string;

  @ManyToOne(() => Glasses, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'glassesId' })
  glasses: Glasses;

  @Column()
  @Index()
  glassesId: string;

  // Simple try-on tracking - no images or metadata needed

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
