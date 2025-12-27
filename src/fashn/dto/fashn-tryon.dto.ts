import { IsString, IsUrl, IsOptional, IsBoolean, IsNumber, IsEnum } from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { FashnJobStatus } from '../../database/entities/fashn-job.entity';

export class FashnTryOnRequestDto {
  @ApiProperty({
    description: 'URL of the full body model image',
    example: 'https://example.com/model.jpg',
  })
  @IsUrl()
  @IsString()
  modelImageUrl: string;

  @ApiProperty({
    description: 'URL of the upper garment image (e.g., shirt, jacket)',
    example: 'https://example.com/upper-garment.jpg',
  })
  @IsUrl()
  @IsString()
  upperGarmentUrl: string;

  @ApiProperty({
    description: 'URL of the lower garment image (e.g., pants, skirt)',
    example: 'https://example.com/lower-garment.jpg',
  })
  @IsUrl()
  @IsString()
  lowerGarmentUrl: string;

  @ApiPropertyOptional({
    description: 'Category of the try-on (e.g., casual, formal)',
    example: 'casual',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Whether to save the result to history',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  saveToHistory?: boolean;
}

export class FashnTryOnResponseDto {
  @ApiProperty({
    description: 'Whether the try-on was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'URL of the generated try-on image',
    example: 'https://fashn.ai/outputs/tryon-12345.jpg',
  })
  outputImageUrl: string;

  @ApiProperty({
    description: 'Prediction ID from FASHN API',
    example: 'pred_abc123xyz',
  })
  predictionId: string;

  @ApiProperty({
    description: 'Processing time in milliseconds',
    example: 5432,
  })
  processingTime: number;

  @ApiProperty({
    description: 'Model name used for the prediction',
    example: 'tryon-v1.6',
  })
  model: string;

  @ApiPropertyOptional({
    description: 'Additional metadata from the prediction',
  })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({
    description: 'ID of the saved history record if saveToHistory was true',
  })
  historyId?: string;
}

export class FashnPredictionStatusDto {
  @ApiProperty({
    description: 'Prediction ID to check status',
    example: 'pred_abc123xyz',
  })
  @IsString()
  predictionId: string;
}

export class FashnPredictionStatusResponseDto {
  @ApiProperty({
    description: 'Current status of the prediction',
    example: 'completed',
    enum: ['queued', 'processing', 'completed', 'failed'],
  })
  status: string;

  @ApiProperty({
    description: 'Prediction ID',
    example: 'pred_abc123xyz',
  })
  predictionId: string;

  @ApiPropertyOptional({
    description: 'Output image URL if completed',
    example: 'https://fashn.ai/outputs/tryon-12345.jpg',
  })
  outputImageUrl?: string;

  @ApiPropertyOptional({
    description: 'Error message if failed',
  })
  error?: string;

  @ApiPropertyOptional({
    description: 'Progress percentage (0-100)',
    example: 75,
  })
  progress?: number;
}

// ============================================
// Async/Queue-based Try-On DTOs
// ============================================

export class FashnAsyncTryOnRequestDto {
  @ApiPropertyOptional({
    description: 'URL of the full body model image. If not provided, will use user\'s default image.',
    example: 'https://example.com/model.jpg',
  })
  @IsOptional()
  @IsUrl()
  @IsString()
  modelImageUrl?: string;

  @ApiPropertyOptional({
    description: 'Array of garment image URLs. All images will be combined into one and sent to FASHN API in auto mode. Use this for flexible multi-garment try-on.',
    example: [
      'https://example.com/shirt.jpg',
      'https://example.com/pants.jpg',
      'https://example.com/jacket.jpg'
    ],
    type: [String],
  })
  @IsOptional()
  @IsUrl({}, { each: true })
  garmentUrls?: string[];

  @ApiPropertyOptional({
    description: 'URL of the upper garment image (e.g., shirt, jacket). DEPRECATED: Use garmentUrls instead.',
    example: 'https://example.com/upper-garment.jpg',
  })
  @IsOptional()
  @IsUrl()
  @IsString()
  upperGarmentUrl?: string;

  @ApiPropertyOptional({
    description: 'URL of the lower garment image (e.g., pants, skirt). DEPRECATED: Use garmentUrls instead.',
    example: 'https://example.com/lower-garment.jpg',
  })
  @IsOptional()
  @IsUrl()
  @IsString()
  lowerGarmentUrl?: string;

  @ApiPropertyOptional({
    description: 'URL of combined outfit image (top+bottom in one image). DEPRECATED: Use garmentUrls instead.',
    example: 'https://example.com/outfit.jpg',
  })
  @IsOptional()
  @IsUrl()
  @IsString()
  outfitImageUrl?: string;

  @ApiPropertyOptional({
    description: 'Category for outfit image: auto, tops, bottoms, one-pieces',
    example: 'auto',
    default: 'auto',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Random seed for reproducible results',
    example: 42,
  })
  @IsOptional()
  @IsNumber()
  seed?: number;

  @ApiPropertyOptional({
    description: 'Quality mode: performance, balanced, quality',
    example: 'quality',
    default: 'quality',
  })
  @IsOptional()
  @IsString()
  mode?: string;

  @ApiPropertyOptional({
    description: 'Whether to save the result to history when complete',
    example: true,
    default: false,
  })
  @IsOptional()
  @IsBoolean()
  saveToHistory?: boolean;
}

export class FashnAsyncTryOnResponseDto {
  @ApiProperty({
    description: 'Job ID for tracking the async try-on',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  jobId: string;

  @ApiProperty({
    description: 'Current status of the job',
    example: 'pending',
    enum: FashnJobStatus,
  })
  status: FashnJobStatus;

  @ApiProperty({
    description: 'Message about the job',
    example: 'Try-on job queued successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Timestamp when the job was created',
  })
  createdAt: Date;
}

export class FashnJobStatusResponseDto {
  @ApiProperty({
    description: 'Job ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  jobId: string;

  @ApiProperty({
    description: 'Current status of the job',
    example: 'completed',
    enum: FashnJobStatus,
  })
  status: FashnJobStatus;

  @ApiPropertyOptional({
    description: 'Progress percentage (0-100)',
    example: 75,
  })
  progress?: number;

  @ApiPropertyOptional({
    description: 'URL of the generated try-on image (when completed)',
    example: 'https://fashn.ai/outputs/tryon-12345.jpg',
  })
  resultImageUrl?: string;

  @ApiPropertyOptional({
    description: 'URL of intermediate result (upper garment applied)',
  })
  upperResultUrl?: string;

  @ApiPropertyOptional({
    description: 'Processing time in milliseconds (when completed)',
  })
  processingTime?: number;

  @ApiPropertyOptional({
    description: 'Error message if failed',
  })
  errorMessage?: string;

  @ApiPropertyOptional({
    description: 'History ID if saved to history',
  })
  historyId?: string;

  @ApiPropertyOptional({
    description: 'Array of garment image URLs (if using new garmentUrls mode)',
    example: ['https://example.com/shirt.jpg', 'https://example.com/pants.jpg'],
    type: [String],
  })
  garmentUrls?: string[];

  @ApiPropertyOptional({
    description: 'Upper garment URL (legacy mode)',
  })
  upperGarmentUrl?: string;

  @ApiPropertyOptional({
    description: 'Lower garment URL (legacy mode)',
  })
  lowerGarmentUrl?: string;

  @ApiPropertyOptional({
    description: 'Model image URL used for the try-on',
  })
  modelImageUrl?: string;

  @ApiProperty({
    description: 'Timestamp when the job was created',
  })
  createdAt: Date;

  @ApiPropertyOptional({
    description: 'Timestamp when the job was completed',
  })
  completedAt?: Date;

  @ApiPropertyOptional({
    description: 'Additional metadata',
  })
  metadata?: Record<string, any>;
}

