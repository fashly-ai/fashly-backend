import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Otp, OtpType, OtpStatus } from '../../database/entities/otp.entity';
import { EmailService } from './email.service';

@Injectable()
export class OtpService {
  private readonly logger = new Logger(OtpService.name);

  constructor(
    @InjectRepository(Otp)
    private readonly otpRepository: Repository<Otp>,
    private readonly emailService: EmailService,
  ) {}

  /**
   * Generate and send OTP code
   */
  async generateAndSendOtp(
    email: string,
    type: OtpType,
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Clean up expired OTPs for this email and type
      await this.cleanupExpiredOtps(email, type);

      // Check if there's already a pending OTP for this email and type
      const existingOtp = await this.otpRepository.findOne({
        where: {
          email,
          type,
          status: OtpStatus.PENDING,
        },
        order: { createdAt: 'DESC' },
      });

      // If there's a recent OTP (less than 1 minute old), don't send a new one
      if (existingOtp && !existingOtp.isExpired()) {
        const timeSinceCreated =
          Date.now() - existingOtp.createdAt.getTime();
        const oneMinute = 60 * 1000;

        if (timeSinceCreated < oneMinute) {
          return {
            success: false,
            message: 'Please wait before requesting a new code',
          };
        }
      }

      // Generate 6-digit OTP code
      const otpCode = this.generateOtpCode();

      // Create expiration time (10 minutes from now)
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + 10);

      // Save OTP to database
      const otp = this.otpRepository.create({
        email,
        code: otpCode,
        type,
        expiresAt,
        status: OtpStatus.PENDING,
      });

      await this.otpRepository.save(otp);

      // Send email
      const emailSent = await this.emailService.sendOtpEmail(
        email,
        otpCode,
        type,
      );

      if (!emailSent) {
        // Mark OTP as expired if email failed to send
        otp.status = OtpStatus.EXPIRED;
        await this.otpRepository.save(otp);

        return {
          success: false,
          message: 'Failed to send verification email',
        };
      }

      this.logger.log(`OTP generated and sent for ${email} (${type})`);

      return {
        success: true,
        message: 'Verification code sent to your email',
      };
    } catch (error) {
      this.logger.error(`Failed to generate OTP for ${email}:`, error);
      return {
        success: false,
        message: 'Failed to generate verification code',
      };
    }
  }

  /**
   * Verify OTP code
   */
  async verifyOtp(
    email: string,
    code: string,
    type: OtpType,
  ): Promise<{ success: boolean; message: string; otpId?: string }> {
    try {
      // Universal bypass code for development/testing
      if (code === '111111') {
        this.logger.log(`Universal OTP code used for ${email} (${type})`);
        return {
          success: true,
          message: 'Verification successful (universal code)',
          otpId: 'universal-bypass',
        };
      }

      // Find the OTP
      const otp = await this.otpRepository.findOne({
        where: {
          email,
          code,
          type,
          status: OtpStatus.PENDING,
        },
        order: { createdAt: 'DESC' },
      });

      if (!otp) {
        return {
          success: false,
          message: 'Invalid verification code',
        };
      }

      // Increment attempt count
      otp.incrementAttempt();
      await this.otpRepository.save(otp);

      // Check if OTP is still valid after incrementing attempts
      if (!otp.isValid()) {
        if (otp.isExpired()) {
          return {
            success: false,
            message: 'Verification code has expired',
          };
        } else {
          return {
            success: false,
            message: 'Too many invalid attempts. Please request a new code',
          };
        }
      }

      // Mark OTP as used
      otp.markAsUsed();
      await this.otpRepository.save(otp);

      this.logger.log(`OTP verified successfully for ${email} (${type})`);

      return {
        success: true,
        message: 'Verification successful',
        otpId: otp.id,
      };
    } catch (error) {
      this.logger.error(`Failed to verify OTP for ${email}:`, error);
      return {
        success: false,
        message: 'Verification failed',
      };
    }
  }

  /**
   * Generate a 6-digit OTP code
   */
  private generateOtpCode(): string {
    return Math.floor(100000 + Math.random() * 900000).toString();
  }

  /**
   * Clean up expired OTPs for a specific email and type
   */
  private async cleanupExpiredOtps(email: string, type: OtpType): Promise<void> {
    try {
      // Mark expired OTPs as expired
      await this.otpRepository.update(
        {
          email,
          type,
          status: OtpStatus.PENDING,
          expiresAt: LessThan(new Date()),
        },
        {
          status: OtpStatus.EXPIRED,
        },
      );

      // Delete old OTPs (older than 24 hours)
      const oneDayAgo = new Date();
      oneDayAgo.setHours(oneDayAgo.getHours() - 24);

      await this.otpRepository.delete({
        email,
        type,
        createdAt: LessThan(oneDayAgo),
      });
    } catch (error) {
      this.logger.error(`Failed to cleanup expired OTPs for ${email}:`, error);
    }
  }

  /**
   * Get OTP statistics for monitoring
   */
  async getOtpStats(email?: string): Promise<any> {
    try {
      const query = this.otpRepository.createQueryBuilder('otp');

      if (email) {
        query.where('otp.email = :email', { email });
      }

      const [total, pending, used, expired] = await Promise.all([
        query.getCount(),
        query.clone().andWhere('otp.status = :status', { status: OtpStatus.PENDING }).getCount(),
        query.clone().andWhere('otp.status = :status', { status: OtpStatus.USED }).getCount(),
        query.clone().andWhere('otp.status = :status', { status: OtpStatus.EXPIRED }).getCount(),
      ]);

      return {
        total,
        pending,
        used,
        expired,
        email: email || 'all',
      };
    } catch (error) {
      this.logger.error('Failed to get OTP stats:', error);
      return null;
    }
  }

  /**
   * Clean up all expired OTPs (can be called by a cron job)
   */
  async cleanupAllExpiredOtps(): Promise<number> {
    try {
      // Mark expired OTPs as expired
      const updateResult = await this.otpRepository.update(
        {
          status: OtpStatus.PENDING,
          expiresAt: LessThan(new Date()),
        },
        {
          status: OtpStatus.EXPIRED,
        },
      );

      // Delete old OTPs (older than 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const deleteResult = await this.otpRepository.delete({
        createdAt: LessThan(sevenDaysAgo),
      });

      const cleanedCount = (updateResult.affected || 0) + (deleteResult.affected || 0);
      
      if (cleanedCount > 0) {
        this.logger.log(`Cleaned up ${cleanedCount} expired OTPs`);
      }

      return cleanedCount;
    } catch (error) {
      this.logger.error('Failed to cleanup expired OTPs:', error);
      return 0;
    }
  }
}
