import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('fashn_history')
@Index(['userId', 'createdAt'])
export class FashnHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ name: 'user_id', type: 'uuid' })
  @Index()
  userId: string;

  @Column({ name: 'model_image_url', type: 'text' })
  modelImageUrl: string;

  @Column({ name: 'upper_garment_url', type: 'text', nullable: true })
  upperGarmentUrl: string;

  @Column({ name: 'lower_garment_url', type: 'text', nullable: true })
  lowerGarmentUrl?: string;

  // New: Array of garment URLs (replaces upper/lower)
  @Column({ name: 'garment_urls', type: 'simple-array', nullable: true })
  garmentUrls: string[];

  @Column({ name: 'result_image_url', type: 'text' })
  resultImageUrl: string;

  @Column({ name: 'prediction_id', type: 'varchar', length: 255 })
  predictionId: string;

  @Column({ name: 'processing_time', type: 'integer' })
  processingTime: number;

  @Column({ name: 'category', type: 'varchar', length: 100, nullable: true })
  category?: string;

  @Column({ name: 'is_saved', type: 'boolean', default: false })
  isSaved: boolean;

  @Column({ name: 'model_name', type: 'varchar', length: 100, default: 'tryon-v1.6' })
  modelName: string;

  @Column({ name: 'metadata', type: 'jsonb', nullable: true })
  metadata?: Record<string, any>;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}

