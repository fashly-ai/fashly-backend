import {
  IsString,
  IsOptional,
  IsNumber,
  IsBase64,
  Min,
  Max,
  Length,
} from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class Image2ImageDto {
  @ApiProperty({
    description: 'Base64 encoded input image',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
    required: true,
  })
  @IsString()
  @IsBase64()
  image: string;

  @ApiProperty({
    description: 'Positive prompt for image generation',
    example: 'photograph of victorian woman with wings, sky clouds, meadow grass',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 1000)
  prompt?: string;

  @ApiProperty({
    description: 'Negative prompt to avoid certain features',
    example: 'blurry, low quality, distorted',
    required: false,
  })
  @IsOptional()
  @IsString()
  @Length(1, 500)
  negativePrompt?: string;

  @ApiProperty({
    description: 'Random seed for reproducibility',
    example: 42,
    required: false,
    minimum: 0,
    maximum: 2147483647,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(2147483647)
  seed?: number;
}

export class Image2ImageResponseDto {
  @ApiProperty({
    description: 'ComfyUI prompt ID',
    example: '7cb6261d-3b03-4171-bbd1-a4b256b42404',
  })
  promptId: string;

  @ApiProperty({
    description: 'Output filename',
    example: 'ComfyUI_00001_.png',
  })
  filename: string;

  @ApiProperty({
    description: 'Base64 encoded output image',
    example: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==',
  })
  imageBase64: string;

  @ApiProperty({
    description: 'Image size in bytes',
    example: 1024567,
  })
  size: number;

  @ApiProperty({
    description: 'Processing time in milliseconds',
    example: 5432,
  })
  processingTime: number;
}

export class ComfyHealthResponseDto {
  @ApiProperty({
    description: 'ComfyUI service status',
    example: true,
  })
  healthy: boolean;

  @ApiProperty({
    description: 'ComfyUI URL',
    example: 'http://localhost:8188',
  })
  url: string;

  @ApiProperty({
    description: 'Timestamp of health check',
    example: '2024-01-01T00:00:00.000Z',
  })
  timestamp: string;
}

export class ComfyQueueResponseDto {
  @ApiProperty({
    description: 'Number of items in queue',
    example: 2,
  })
  queueLength: number;

  @ApiProperty({
    description: 'Queue data',
  })
  queue: any;
}

