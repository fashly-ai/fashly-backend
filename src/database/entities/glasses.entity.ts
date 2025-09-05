import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

@Entity('glasses')
export class Glasses {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index() // Add index for faster searches
  name: string;

  @Column({ unique: true })
  @Index() // Add index for faster lookups
  productUrl: string;

  @Column()
  imageUrl: string;

  @Column('text', { nullable: true })
  allImages?: string;

  @Column({ nullable: true })
  brand: string;

  @Column({ nullable: true })
  category: string;

  @Column({ nullable: true })
  price?: string;

  @Column({ nullable: true })
  availability: string;

  @Column({ default: true })
  isActive: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper method to get allImages as array
  getAllImagesArray(): string[] {
    if (!this.allImages) return [];
    try {
      return JSON.parse(this.allImages);
    } catch {
      return [];
    }
  }

  // Helper method to set allImages from array
  setAllImagesArray(images: string[]): void {
    this.allImages = images.length > 0 ? JSON.stringify(images) : undefined;
  }
}
