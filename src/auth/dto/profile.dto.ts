import { 
  IsString, 
  IsOptional, 
  IsEmail, 
  IsNumber, 
  IsDateString, 
  IsEnum, 
  IsUrl, 
  IsPhoneNumber, 
  Length, 
  Min, 
  Max 
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export enum Gender {
  MALE = 'male',
  FEMALE = 'female',
  OTHER = 'other',
  PREFER_NOT_TO_SAY = 'prefer-not-to-say',
}

export enum WeightUnit {
  LBS = 'lbs',
  KG = 'kg',
}

export class UpdateProfileDto {
  @ApiProperty({
    description: 'First name',
    example: 'John',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  firstName?: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 50)
  lastName?: string;

  @ApiProperty({
    description: 'Email address',
    example: 'user@example.com',
    required: false,
  })
  @IsOptional()
  @IsEmail()
  email?: string;

  @ApiProperty({
    description: 'Height (e.g., "5\'6\"", "168cm")',
    example: '5\'6"',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 20)
  height?: string;

  @ApiProperty({
    description: 'Weight in specified unit',
    example: 130,
    minimum: 50,
    maximum: 500,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(50)
  @Max(500)
  weight?: number;

  @ApiProperty({
    description: 'Weight unit',
    enum: WeightUnit,
    example: WeightUnit.LBS,
    required: false,
  })
  @IsOptional()
  @IsEnum(WeightUnit)
  weightUnit?: WeightUnit;

  @ApiProperty({
    description: 'Profile image URL',
    example: 'https://storage.googleapis.com/bucket/profile-images/user123.jpg',
    required: false,
  })
  @IsOptional()
  @IsUrl()
  profileImageUrl?: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+1234567890',
    required: false,
  })
  @IsOptional()
  @IsPhoneNumber()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Date of birth',
    example: '1990-01-15',
    format: 'date',
    required: false,
  })
  @IsOptional()
  @IsDateString()
  dateOfBirth?: string;

  @ApiProperty({
    description: 'Gender',
    enum: Gender,
    example: Gender.FEMALE,
    required: false,
  })
  @IsOptional()
  @IsEnum(Gender)
  gender?: Gender;

  @ApiProperty({
    description: 'Bio/description',
    example: 'Fashion enthusiast and style blogger',
    maxLength: 500,
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  bio?: string;

  @ApiProperty({
    description: 'Location',
    example: 'New York, NY',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 100)
  location?: string;
}

export class ProfileResponseDto {
  @ApiProperty({
    description: 'User ID',
    example: 'uuid-string',
  })
  id: string;

  @ApiProperty({
    description: 'Email address',
    example: 'user@example.com',
  })
  email: string;

  @ApiProperty({
    description: 'First name',
    example: 'John',
  })
  firstName: string;

  @ApiProperty({
    description: 'Last name',
    example: 'Doe',
  })
  lastName: string;

  @ApiProperty({
    description: 'Full name',
    example: 'John Doe',
  })
  fullName: string;

  @ApiProperty({
    description: 'Height',
    example: '5\'6"',
    required: false,
  })
  height?: string;

  @ApiProperty({
    description: 'Weight',
    example: 130,
    required: false,
  })
  weight?: number;

  @ApiProperty({
    description: 'Weight unit',
    enum: WeightUnit,
    example: WeightUnit.LBS,
    required: false,
  })
  weightUnit?: WeightUnit;

  @ApiProperty({
    description: 'Profile image URL',
    example: 'https://storage.googleapis.com/bucket/profile-images/user123.jpg',
    required: false,
  })
  profileImageUrl?: string;

  @ApiProperty({
    description: 'Phone number',
    example: '+1234567890',
    required: false,
  })
  phoneNumber?: string;

  @ApiProperty({
    description: 'Date of birth',
    example: '1990-01-15',
    required: false,
  })
  dateOfBirth?: string;

  @ApiProperty({
    description: 'Gender',
    enum: Gender,
    example: Gender.FEMALE,
    required: false,
  })
  gender?: Gender;

  @ApiProperty({
    description: 'Bio/description',
    example: 'Fashion enthusiast and style blogger',
    required: false,
  })
  bio?: string;

  @ApiProperty({
    description: 'Location',
    example: 'New York, NY',
    required: false,
  })
  location?: string;

  @ApiProperty({
    description: 'Whether profile is completed',
    example: true,
  })
  profileCompleted: boolean;

  @ApiProperty({
    description: 'Account creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}

export class UpdateProfileResponseDto {
  @ApiProperty({
    description: 'Whether the update was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Response message',
    example: 'Profile updated successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Updated user profile',
    type: ProfileResponseDto,
  })
  profile: ProfileResponseDto;
}
