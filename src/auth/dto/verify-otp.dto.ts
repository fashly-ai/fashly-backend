import { IsEmail, IsNotEmpty, IsString, Length, Matches } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class VerifyOtpDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;

  @ApiProperty({
    description: '6-digit verification code',
    example: '123456',
    minLength: 6,
    maxLength: 6,
    pattern: '^[0-9]{6}$',
  })
  @IsString({ message: 'OTP code must be a string' })
  @Length(6, 6, { message: 'OTP code must be exactly 6 digits' })
  @Matches(/^[0-9]{6}$/, { message: 'OTP code must contain only numbers' })
  @IsNotEmpty({ message: 'OTP code is required' })
  code: string;
}

export class VerifyOtpResponseDto {
  @ApiProperty({
    description: 'Whether the verification was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Verification successful',
  })
  message: string;

  @ApiProperty({
    description: 'JWT access token (only provided on successful verification)',
    example: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...',
    required: false,
  })
  accessToken?: string;

  @ApiProperty({
    description: 'User information (only provided on successful verification)',
    required: false,
    example: {
      id: 'uuid-string',
      email: 'user@example.com',
      createdAt: '2024-01-01T00:00:00.000Z',
    },
  })
  user?: {
    id: string;
    email: string;
    createdAt: Date;
  };

  @ApiProperty({
    description: 'Whether this was a new user signup',
    example: false,
  })
  isNewUser?: boolean;
}
