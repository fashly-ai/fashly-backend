import { IsOptional, IsNumber, Min, Max, IsBoolean } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional, ApiProperty } from '@nestjs/swagger';

export class FashnHistoryQueryDto {
  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Filter by saved status',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  savedOnly?: boolean;
}

export class FashnHistoryItemDto {
  @ApiProperty({
    description: 'History record ID',
    example: 'hist_123',
  })
  id: string;

  @ApiProperty({
    description: 'Model image URL',
    example: 'https://example.com/model.jpg',
  })
  modelImageUrl: string;

  @ApiPropertyOptional({
    description: 'Array of garment image URLs (if using new garmentUrls mode)',
    example: ['https://example.com/shirt.jpg', 'https://example.com/pants.jpg'],
    type: [String],
  })
  garmentUrls?: string[];

  @ApiPropertyOptional({
    description: 'Upper garment image URL (legacy mode)',
    example: 'https://example.com/upper.jpg',
  })
  upperGarmentUrl?: string;

  @ApiPropertyOptional({
    description: 'Lower garment image URL (legacy mode)',
    example: 'https://example.com/lower.jpg',
  })
  lowerGarmentUrl?: string;

  @ApiProperty({
    description: 'Result image URL',
    example: 'https://fashn.ai/outputs/result.jpg',
  })
  resultImageUrl: string;

  @ApiProperty({
    description: 'FASHN prediction ID',
    example: 'pred_abc123',
  })
  predictionId: string;

  @ApiProperty({
    description: 'Processing time in milliseconds',
    example: 5432,
  })
  processingTime: number;

  @ApiProperty({
    description: 'Whether this is saved to favorites',
    example: false,
  })
  isSaved: boolean;

  @ApiProperty({
    description: 'Created timestamp',
    example: '2025-11-30T10:00:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Updated timestamp',
    example: '2025-11-30T10:00:00Z',
  })
  updatedAt: Date;
}

export class PaginationDto {
  @ApiProperty({ description: 'Total number of items', example: 100 })
  total: number;

  @ApiProperty({ description: 'Current page number', example: 1 })
  page: number;

  @ApiProperty({ description: 'Items per page', example: 20 })
  limit: number;

  @ApiProperty({ description: 'Total number of pages', example: 5 })
  totalPages: number;

  @ApiProperty({ description: 'Whether there is a next page', example: true })
  hasNext: boolean;

  @ApiProperty({ description: 'Whether there is a previous page', example: false })
  hasPrev: boolean;
}

export class FashnHistoryResponseDto {
  @ApiProperty({
    description: 'Array of history items',
    type: [FashnHistoryItemDto],
  })
  data: FashnHistoryItemDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationDto,
  })
  pagination: PaginationDto;
}

export class UpdateFashnSavedStatusDto {
  @ApiProperty({
    description: 'Whether to save or unsave the try-on',
    example: true,
  })
  @IsBoolean()
  isSaved: boolean;
}

