import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export type ClothingType = 'upper' | 'lower';

@Entity('clothes')
@Index(['isActive', 'clothingType'])
@Index(['brand', 'isActive'])
export class Clothes {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', length: 255 })
  name: string;

  @Column({ type: 'varchar', length: 100 })
  brand: string;

  @Column({ type: 'varchar', length: 50 })
  @Index()
  clothingType: ClothingType; // 'upper' or 'lower'

  @Column({ type: 'text', nullable: true })
  description?: string;

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price?: number;

  @Column({ type: 'varchar', length: 10, nullable: true })
  currency?: string;

  @Column({ type: 'text' })
  imageUrl: string;

  @Column({ type: 'text', nullable: true })
  thumbnailUrl?: string;

  @Column({ type: 'simple-array', nullable: true })
  additionalImages?: string[];

  @Column({ type: 'varchar', length: 50, nullable: true })
  color?: string;

  @Column({ type: 'simple-array', nullable: true })
  sizes?: string[];

  @Column({ type: 'varchar', length: 100, nullable: true })
  material?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  category?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  season?: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  style?: string;

  @Column({ type: 'simple-array', nullable: true })
  tags?: string[];

  @Column({ type: 'text', nullable: true })
  productUrl?: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  sku?: string;

  @Column({ type: 'boolean', default: true })
  @Index()
  isActive: boolean;

  @Column({ type: 'boolean', default: true })
  inStock: boolean;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;
}


