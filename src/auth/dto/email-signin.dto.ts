import { IsEmail, IsNotEmpty } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class EmailSigninDto {
  @ApiProperty({
    description: 'User email address',
    example: 'user@example.com',
    format: 'email',
  })
  @IsEmail({}, { message: 'Please provide a valid email address' })
  @IsNotEmpty({ message: 'Email is required' })
  email: string;
}

export class EmailSigninResponseDto {
  @ApiProperty({
    description: 'Whether the operation was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Verification code sent to your email',
  })
  message: string;

  @ApiProperty({
    description: 'Type of authentication flow',
    example: 'signin',
    enum: ['signin', 'signup'],
  })
  type: 'signin' | 'signup';

  @ApiProperty({
    description: 'Email address (masked for privacy)',
    example: 'u***@example.com',
  })
  email: string;
}
