import {
  Injectable,
  ConflictException,
  UnauthorizedException,
  Logger,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { User } from '../database/entities/user.entity';
import { Otp, OtpType } from '../database/entities/otp.entity';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { EmailSigninDto, EmailSigninResponseDto } from './dto/email-signin.dto';
import { VerifyOtpDto, VerifyOtpResponseDto } from './dto/verify-otp.dto';
import { OtpService } from './services/otp.service';
import { EmailService } from './services/email.service';

export interface JwtPayload {
  sub: string;
  email: string;
  firstName: string;
  lastName: string;
}

export interface AuthResponse {
  access_token: string;
  user: {
    id: string;
    email: string;
    firstName: string;
    lastName: string;
    fullName: string;
  };
}

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Otp)
    private otpRepository: Repository<Otp>,
    private jwtService: JwtService,
    private otpService: OtpService,
    private emailService: EmailService,
  ) {}

  async signUp(signUpDto: SignUpDto): Promise<AuthResponse> {
    const { email, password, firstName, lastName } = signUpDto;

    // Check if user already exists
    const existingUser = await this.userRepository.findOne({
      where: { email },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    // Hash password
    const saltRounds = 12;
    const hashedPassword = await bcrypt.hash(password, saltRounds);

    // Create user
    const user = this.userRepository.create({
      email,
      firstName,
      lastName,
      password: hashedPassword,
    });

    const savedUser = await this.userRepository.save(user);

    this.logger.log(`New user registered: ${email}`);

    // Generate JWT token
    const payload: JwtPayload = {
      sub: savedUser.id,
      email: savedUser.email,
      firstName: savedUser.firstName,
      lastName: savedUser.lastName,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: savedUser.id,
        email: savedUser.email,
        firstName: savedUser.firstName,
        lastName: savedUser.lastName,
        fullName: savedUser.fullName,
      },
    };
  }

  async signIn(signInDto: SignInDto): Promise<AuthResponse> {
    const { email, password } = signInDto;

    // Find user by email
    const user = await this.userRepository.findOne({
      where: { email },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    // Check password
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is disabled');
    }

    this.logger.log(`User signed in: ${email}`);

    // Generate JWT token
    const payload: JwtPayload = {
      sub: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
    };

    const access_token = this.jwtService.sign(payload);

    return {
      access_token,
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        fullName: user.fullName,
      },
    };
  }

  async validateUser(payload: JwtPayload): Promise<User | null> {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub },
    });

    if (user && user.isActive) {
      return user;
    }

    return null;
  }

  async getUserById(id: string): Promise<User | null> {
    return this.userRepository.findOne({
      where: { id },
    });
  }

  /**
   * Email-based sign-in: Check if user exists and send appropriate OTP
   */
  async emailSignin(emailSigninDto: EmailSigninDto): Promise<EmailSigninResponseDto> {
    const { email } = emailSigninDto;

    try {
      // Check if user exists
      const existingUser = await this.userRepository.findOne({
        where: { email },
      });

      const type = existingUser ? OtpType.SIGNIN : OtpType.SIGNUP;
      
      // Generate and send OTP
      const result = await this.otpService.generateAndSendOtp(email, type);

      if (!result.success) {
        return {
          success: false,
          message: result.message,
          type,
          email: this.maskEmail(email),
        };
      }

      this.logger.log(`${type.toUpperCase()} OTP sent to ${email}`);

      return {
        success: true,
        message: result.message,
        type,
        email: this.maskEmail(email),
      };
    } catch (error) {
      this.logger.error(`Email signin failed for ${email}:`, error);
      return {
        success: false,
        message: 'Failed to process sign-in request',
        type: 'signin',
        email: this.maskEmail(email),
      };
    }
  }

  /**
   * Verify OTP and complete authentication
   */
  async verifyOtp(verifyOtpDto: VerifyOtpDto): Promise<VerifyOtpResponseDto> {
    const { email, code } = verifyOtpDto;

    try {
      // First, try to verify as sign-in
      let verificationResult = await this.otpService.verifyOtp(
        email,
        code,
        OtpType.SIGNIN,
      );

      let isNewUser = false;
      let user: User | null = null;

      if (verificationResult.success) {
        // Sign-in verification successful - user should exist
        user = await this.userRepository.findOne({ where: { email } });
        
        if (!user) {
          return {
            success: false,
            message: 'User account not found',
          };
        }
      } else {
        // Try to verify as sign-up
        verificationResult = await this.otpService.verifyOtp(
          email,
          code,
          OtpType.SIGNUP,
        );

        if (verificationResult.success) {
          // Sign-up verification successful - create new user
          user = await this.createUserFromEmail(email);
          isNewUser = true;

          // Send welcome email
          await this.emailService.sendWelcomeEmail(email);
        }
      }

      if (!verificationResult.success || !user) {
        return {
          success: false,
          message: verificationResult.message,
        };
      }

      // Generate JWT token
      const payload: JwtPayload = {
        sub: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
      };

      const accessToken = this.jwtService.sign(payload);

      this.logger.log(`Authentication successful for ${email} (${isNewUser ? 'new user' : 'existing user'})`);

      return {
        success: true,
        message: 'Authentication successful',
        accessToken,
        user: {
          id: user.id,
          email: user.email,
          createdAt: user.createdAt,
        },
        isNewUser,
      };
    } catch (error) {
      this.logger.error(`OTP verification failed for ${email}:`, error);
      return {
        success: false,
        message: 'Verification failed',
      };
    }
  }

  /**
   * Create a new user from email (for OTP-based signup)
   */
  private async createUserFromEmail(email: string): Promise<User> {
    // Extract name from email as fallback
    const emailPrefix = email.split('@')[0];
    const firstName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);

    const user = this.userRepository.create({
      email,
      firstName,
      lastName: '',
      password: '', // No password for OTP-based auth
      isActive: true,
    });

    return await this.userRepository.save(user);
  }

  /**
   * Mask email for privacy (e.g., user@example.com -> u***@example.com)
   */
  private maskEmail(email: string): string {
    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) {
      return `${localPart[0]}***@${domain}`;
    }
    return `${localPart[0]}${'*'.repeat(localPart.length - 2)}${localPart[localPart.length - 1]}@${domain}`;
  }
}
