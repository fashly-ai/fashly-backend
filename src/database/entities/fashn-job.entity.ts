import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { User } from './user.entity';

export enum FashnJobStatus {
  PENDING = 'pending',
  PROCESSING_UPPER = 'processing_upper',
  PROCESSING_LOWER = 'processing_lower',
  COMPLETED = 'completed',
  FAILED = 'failed',
}

@Entity('fashn_jobs')
@Index(['userId', 'createdAt'])
@Index(['status'])
export class FashnJob {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'user_id' })
  user: User;

  @Column({ name: 'model_image_url', type: 'text' })
  modelImageUrl: string;

  @Column({ name: 'upper_garment_url', type: 'text', nullable: true })
  upperGarmentUrl: string;

  @Column({ name: 'lower_garment_url', type: 'text', nullable: true })
  lowerGarmentUrl: string;

  @Column({ name: 'outfit_image_url', type: 'text', nullable: true })
  outfitImageUrl: string;

  // New: Array of garment URLs (replaces upper/lower/outfit)
  @Column({ name: 'garment_urls', type: 'simple-array', nullable: true })
  garmentUrls: string[];

  @Column({
    type: 'enum',
    enum: FashnJobStatus,
    default: FashnJobStatus.PENDING,
  })
  status: FashnJobStatus;

  @Column({ name: 'upper_prediction_id', type: 'varchar', length: 255, nullable: true })
  upperPredictionId: string;

  @Column({ name: 'lower_prediction_id', type: 'varchar', length: 255, nullable: true })
  lowerPredictionId: string;

  @Column({ name: 'upper_result_url', type: 'text', nullable: true })
  upperResultUrl: string;

  @Column({ name: 'result_image_url', type: 'text', nullable: true })
  resultImageUrl: string;

  @Column({ type: 'integer', nullable: true })
  seed: number;

  @Column({ type: 'varchar', length: 50, default: 'quality' })
  mode: string;

  @Column({ type: 'varchar', length: 50, default: 'auto' })
  category: string;

  @Column({ name: 'processing_time', type: 'integer', nullable: true })
  processingTime: number;

  @Column({ name: 'error_message', type: 'text', nullable: true })
  errorMessage: string;

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>;

  @Column({ name: 'save_to_history', type: 'boolean', default: false })
  saveToHistory: boolean;

  @Column({ name: 'history_id', type: 'uuid', nullable: true })
  historyId: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @Column({ name: 'completed_at', type: 'timestamp', nullable: true })
  completedAt: Date;
}

