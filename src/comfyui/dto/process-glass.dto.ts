import {
  IsString,
  IsOptional,
  IsUUID,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';
import { Transform } from 'class-transformer';

export class ProcessGlassDto {
  @ApiProperty({
    description: 'Glass ID (UUID)',
    example: '42a793e7-54d6-4550-8020-33695a15fb91',
    required: true,
  })
  @IsUUID()
  glassId: string;

  @ApiProperty({
    description: 'Positive prompt for image generation',
    example: 'person wearing stylish eyeglasses, professional portrait, clear face, natural lighting',
    required: false,
    default: 'person wearing eyeglasses, professional photo, clear face',
  })
  @IsOptional()
  @IsString()
  @Length(0, 1000)
  prompt?: string;

  @ApiProperty({
    description: 'Negative prompt to avoid certain features',
    example: 'blurry, low quality, distorted, cropped face, partial face',
    required: false,
    default: 'blurry, low quality, distorted, cropped face',
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

