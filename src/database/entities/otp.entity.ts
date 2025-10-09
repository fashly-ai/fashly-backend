import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  Index,
} from 'typeorm';

export enum OtpType {
  SIGNIN = 'signin',
  SIGNUP = 'signup',
}

export enum OtpStatus {
  PENDING = 'pending',
  USED = 'used',
  EXPIRED = 'expired',
}

@Entity('otps')
@Index(['email', 'type', 'status'])
export class Otp {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  @Index()
  email: string;

  @Column({ length: 6 })
  code: string;

  @Column({
    type: 'enum',
    enum: OtpType,
  })
  type: OtpType;

  @Column({
    type: 'enum',
    enum: OtpStatus,
    default: OtpStatus.PENDING,
  })
  status: OtpStatus;

  @Column({ type: 'timestamp' })
  expiresAt: Date;

  @Column({ nullable: true })
  usedAt: Date;

  @Column({ default: 0 })
  attemptCount: number;

  @Column({ default: 3 })
  maxAttempts: number;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;

  // Helper method to check if OTP is expired
  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  // Helper method to check if OTP is valid for use
  isValid(): boolean {
    return (
      this.status === OtpStatus.PENDING &&
      !this.isExpired() &&
      this.attemptCount < this.maxAttempts
    );
  }

  // Helper method to mark OTP as used
  markAsUsed(): void {
    this.status = OtpStatus.USED;
    this.usedAt = new Date();
  }

  // Helper method to mark OTP as expired
  markAsExpired(): void {
    this.status = OtpStatus.EXPIRED;
  }

  // Helper method to increment attempt count
  incrementAttempt(): void {
    this.attemptCount += 1;
    if (this.attemptCount >= this.maxAttempts) {
      this.status = OtpStatus.EXPIRED;
    }
  }
}
