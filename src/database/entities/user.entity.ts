import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';
import { Exclude } from 'class-transformer';

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column()
  firstName: string;

  @Column()
  lastName: string;

  @Column()
  @Exclude()
  password: string;

  @Column({ default: true })
  isActive: boolean;

  // Profile fields
  @Column({ nullable: true })
  height?: string; // e.g., "5'6\"" or "168cm"

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  weight?: number; // in lbs or kg

  @Column({ nullable: true })
  weightUnit?: string; // "lbs" or "kg"

  @Column({ nullable: true })
  profileImageUrl?: string; // URL to profile/selfie image

  @Column({ nullable: true })
  phoneNumber?: string;

  @Column({ type: 'date', nullable: true })
  dateOfBirth?: Date;

  @Column({ nullable: true })
  gender?: string; // "male", "female", "other", "prefer-not-to-say"

  @Column({ nullable: true })
  bio?: string;

  @Column({ nullable: true })
  location?: string;

  @Column({ default: false })
  profileCompleted: boolean;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Virtual property for full name
  get fullName(): string {
    return `${this.firstName} ${this.lastName}`;
  }
}
