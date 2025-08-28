import { IsString, IsOptional, IsNumber, IsEnum, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum AllowedFileTypes {
  JPEG = 'image/jpeg',
  JPG = 'image/jpg',
  PNG = 'image/png',
  WEBP = 'image/webp',
  GIF = 'image/gif',
  PDF = 'application/pdf',
  TEXT = 'text/plain',
  JSON = 'application/json',
}

export class GeneratePresignedUrlDto {
  @ApiProperty({
    description: 'Name of the file to upload',
    example: 'profile-picture.jpg',
  })
  @IsString()
  fileName: string;

  @ApiProperty({
    description: 'MIME type of the file',
    enum: AllowedFileTypes,
    example: AllowedFileTypes.JPEG,
  })
  @IsEnum(AllowedFileTypes)
  fileType: AllowedFileTypes;

  @ApiProperty({
    description: 'S3 folder/prefix for the file',
    example: 'user-uploads',
    required: false,
    default: 'uploads',
  })
  @IsOptional()
  @IsString()
  folder?: string;

  @ApiProperty({
    description: 'URL expiration time in seconds',
    example: 3600,
    minimum: 60,
    maximum: 86400,
    required: false,
    default: 3600,
  })
  @IsOptional()
  @IsNumber()
  @Min(60) // Minimum 1 minute
  @Max(86400) // Maximum 24 hours
  expiresIn?: number;

  @ApiProperty({
    description: 'File size in bytes (for validation)',
    example: 1048576,
    required: false,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  fileSize?: number;
}
