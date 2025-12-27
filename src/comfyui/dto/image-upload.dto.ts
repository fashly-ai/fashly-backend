import {
  IsString,
  IsOptional,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class ImageUploadDto {
  @ApiProperty({
    description: 'Positive prompt for image generation',
    example: 'photograph of victorian woman with wings, sky clouds, meadow grass',
    required: false,
    default: 'high quality photograph, professional',
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  prompt?: string;

  @ApiProperty({
    description: 'Negative prompt to avoid certain features',
    example: 'blurry, low quality, distorted',
    required: false,
    default: 'blurry, low quality',
  })
  @IsOptional()
  @IsString()
  @Length(0, 500)
  negativePrompt?: string;

  @ApiProperty({
    description: 'Random seed for reproducibility (leave empty for random)',
    example: 42,
    required: false,
    type: 'number',
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (value === undefined || value === null || value === '') return undefined;
    const num = Number(value);
    return isNaN(num) ? undefined : num;
  })
  seed?: number;
}

