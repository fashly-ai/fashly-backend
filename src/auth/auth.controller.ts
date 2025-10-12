import {
  Controller,
  Post,
  Body,
  Get,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService, AuthResponse } from './auth.service';
import { SignUpDto } from './dto/signup.dto';
import { SignInDto } from './dto/signin.dto';
import { EmailSigninDto, EmailSigninResponseDto } from './dto/email-signin.dto';
import { VerifyOtpDto, VerifyOtpResponseDto } from './dto/verify-otp.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { Public } from './decorators/public.decorator';
import { User } from '../database/entities/user.entity';

@ApiTags('authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('signup')
  @ApiOperation({
    summary: 'User registration',
    description: 'Register a new user account',
  })
  @ApiResponse({
    status: 201,
    description: 'User successfully registered',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            fullName: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 409,
    description: 'User with this email already exists',
  })
  async signUp(@Body() signUpDto: SignUpDto): Promise<AuthResponse> {
    return this.authService.signUp(signUpDto);
  }

  @Public()
  @Post('signin')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description: 'Authenticate user and return JWT token',
  })
  @ApiResponse({
    status: 200,
    description: 'User successfully authenticated',
    schema: {
      type: 'object',
      properties: {
        access_token: { type: 'string' },
        user: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            firstName: { type: 'string' },
            lastName: { type: 'string' },
            fullName: { type: 'string' },
          },
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Invalid credentials',
  })
  async signIn(@Body() signInDto: SignInDto): Promise<AuthResponse> {
    return this.authService.signIn(signInDto);
  }

  @Get('profile')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Get current user profile information',
  })
  @ApiResponse({
    status: 200,
    description: 'User profile retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - valid JWT token required',
  })
  async getProfile(@CurrentUser() user: User) {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      isActive: user.isActive,
      createdAt: user.createdAt,
    };
  }

  @Public()
  @Post('sign-in')
  @ApiOperation({
    summary: 'Email-based sign-in',
    description: 'Initiate sign-in process with email. Sends OTP for existing users or signup flow for new users.',
  })
  @ApiResponse({
    status: 200,
    description: 'OTP sent successfully',
    type: EmailSigninResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid email format',
  })
  @ApiResponse({
    status: 429,
    description: 'Too many requests - please wait before requesting a new code',
  })
  async emailSignin(@Body() emailSigninDto: EmailSigninDto): Promise<EmailSigninResponseDto> {
    return this.authService.emailSignin(emailSigninDto);
  }

  @Public()
  @Post('sign-in-verify')
  @ApiOperation({
    summary: 'Verify OTP and complete authentication',
    description: 'Verify the OTP code and complete the sign-in or sign-up process. Returns JWT token on success. Use 111111 as universal bypass code for development/testing.',
  })
  @ApiResponse({
    status: 200,
    description: 'Authentication successful',
    type: VerifyOtpResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid OTP code or email',
  })
  @ApiResponse({
    status: 401,
    description: 'OTP verification failed',
  })
  async verifyOtp(@Body() verifyOtpDto: VerifyOtpDto): Promise<VerifyOtpResponseDto> {
    return this.authService.verifyOtp(verifyOtpDto);
  }
}
