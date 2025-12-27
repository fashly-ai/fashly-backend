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

@Entity('glass_tryon_history')
@Index(['userId', 'createdAt'])
export class GlassTryOnHistory {
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

  // Request data
  @Column({ type: 'text', nullable: true })
  prompt?: string;

  @Column({ type: 'text', nullable: true })
  negativePrompt?: string;

  @Column({ type: 'integer', nullable: true })
  seed?: number;

  // Response data
  @Column({ type: 'text' })
  resultImageUrl: string; // Base64 or URL to the processed image

  @Column()
  promptId: string; // ComfyUI prompt ID

  @Column()
  filename: string; // ComfyUI output filename

  @Column({ type: 'integer' })
  processingTime: number; // In milliseconds

  @Column({ type: 'integer' })
  imageSize: number; // In bytes

  // Save status
  @Column({ default: false })
  @Index()
  savedTryOn: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}

