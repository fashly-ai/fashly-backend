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

export type ItemType = 'glasses' | 'clothes';

@Entity('favorites')
@Index(['userId', 'glassesId'], { unique: true, where: '"glassesId" IS NOT NULL' }) // For backward compatibility
@Index(['userId', 'itemId', 'itemType'], { unique: true, where: '"itemId" IS NOT NULL' }) // For new items
export class Favorite {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'userId' })
  user: User;

  @Column()
  @Index()
  userId: string;

  // Legacy field for glasses (kept for backward compatibility)
  @ManyToOne(() => Glasses, { onDelete: 'CASCADE', nullable: true })
  @JoinColumn({ name: 'glassesId' })
  glasses?: Glasses;

  @Column({ nullable: true })
  @Index()
  glassesId?: string;

  // New generic fields for any item type
  @Column({ nullable: true })
  @Index()
  itemId?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  @Index()
  itemType?: ItemType;

  @CreateDateColumn()
  createdAt: Date;
}
