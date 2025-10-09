import {
  Entity,
  PrimaryGeneratedColumn,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
  Index,
  Column,
} from 'typeorm';
import { User } from './user.entity';
import { Glasses } from './glasses.entity';

@Entity('favorites')
@Index(['userId', 'glassesId'], { unique: true }) // Ensure one favorite per user-glasses pair
export class Favorite {
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

  @CreateDateColumn()
  createdAt: Date;
}
