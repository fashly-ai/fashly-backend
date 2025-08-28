import { IsString, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class GenerateDownloadUrlDto {
  @ApiProperty({
    description: 'S3 object key/path',
    example: 'uploads/1704067200000_abc123_profile-picture.jpg',
  })
  @IsString()
  key: string;

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
}
