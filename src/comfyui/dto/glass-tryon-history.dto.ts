import {
  IsString,
  IsNumber,
  IsOptional,
  IsBoolean,
  IsUUID,
  Min,
  Max,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { GlassesResponseDto } from '../../glasses/dto/glasses-response.dto';

export class SaveGlassTryOnDto {
  @ApiProperty({
    description: 'ComfyUI prompt ID from the response',
    example: '7cb6261d-3b03-4171-bbd1-a4b256b42404',
  })
  @IsString()
  promptId: string;

  @ApiProperty({
    description: 'Glass ID that was tried on',
    example: '42a793e7-54d6-4550-8020-33695a15fb91',
  })
  @IsUUID()
  glassId: string;

  @ApiProperty({
    description: 'Processed image as base64',
    example: 'data:image/png;base64,iVBORw0KGgo...',
  })
  @IsString()
  resultImageBase64: string;

  @ApiProperty({
    description: 'ComfyUI output filename',
    example: 'ComfyUI_00001_.png',
  })
  @IsString()
  filename: string;

  @ApiProperty({
    description: 'Processing time in milliseconds',
    example: 5432,
  })
  @IsNumber()
  processingTime: number;

  @ApiProperty({
    description: 'Image size in bytes',
    example: 1024567,
  })
  @IsNumber()
  imageSize: number;

  @ApiPropertyOptional({
    description: 'Prompt used for generation',
    example: 'person wearing stylish eyeglasses, professional portrait',
  })
  @IsOptional()
  @IsString()
  prompt?: string;

  @ApiPropertyOptional({
    description: 'Negative prompt used',
    example: 'blurry, low quality, distorted',
  })
  @IsOptional()
  @IsString()
  negativePrompt?: string;

  @ApiPropertyOptional({
    description: 'Seed used for generation',
    example: 42,
  })
  @IsOptional()
  @IsNumber()
  seed?: number;
}

export class UpdateSavedStatusDto {
  @ApiProperty({
    description: 'Whether to mark this try-on as saved',
    example: true,
  })
  @IsBoolean()
  savedTryOn: boolean;
}

export class GlassTryOnHistoryResponseDto {
  @ApiProperty({
    description: 'Try-on history record ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  id: string;

  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  userId: string;

  @ApiProperty({
    description: 'Glass ID',
    example: '42a793e7-54d6-4550-8020-33695a15fb91',
  })
  glassId: string;

  @ApiProperty({
    description: 'Glass details',
    type: GlassesResponseDto,
  })
  glasses: GlassesResponseDto;

  @ApiPropertyOptional({
    description: 'Prompt used',
    example: 'person wearing stylish eyeglasses',
  })
  prompt?: string;

  @ApiPropertyOptional({
    description: 'Negative prompt used',
    example: 'blurry, low quality',
  })
  negativePrompt?: string;

  @ApiPropertyOptional({
    description: 'Seed used',
    example: 42,
  })
  seed?: number;

  @ApiProperty({
    description: 'Result image URL or base64',
    example: 'data:image/png;base64,iVBORw0KGgo...',
  })
  resultImageUrl: string;

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
    description: 'Processing time in milliseconds',
    example: 5432,
  })
  processingTime: number;

  @ApiProperty({
    description: 'Image size in bytes',
    example: 1024567,
  })
  imageSize: number;

  @ApiProperty({
    description: 'Whether this try-on is marked as saved',
    example: false,
  })
  savedTryOn: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  updatedAt: Date;

  static fromEntity(
    entity: any,
    glasses: GlassesResponseDto,
  ): GlassTryOnHistoryResponseDto {
    return {
      id: entity.id,
      userId: entity.userId,
      glassId: entity.glassesId,
      glasses,
      prompt: entity.prompt,
      negativePrompt: entity.negativePrompt,
      seed: entity.seed,
      resultImageUrl: entity.resultImageUrl,
      promptId: entity.promptId,
      filename: entity.filename,
      processingTime: entity.processingTime,
      imageSize: entity.imageSize,
      savedTryOn: entity.savedTryOn,
      createdAt: entity.createdAt,
      updatedAt: entity.updatedAt,
    };
  }
}

export class SaveGlassTryOnResponseDto {
  @ApiProperty({
    description: 'Operation success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Action performed',
    example: 'saved',
  })
  action: 'saved' | 'updated';

  @ApiProperty({
    description: 'Response message',
    example: 'Glass try-on saved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'Saved try-on data',
    type: GlassTryOnHistoryResponseDto,
  })
  data: GlassTryOnHistoryResponseDto;
}

export class GlassTryOnHistoryQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by saved status',
    example: true,
  })
  @IsOptional()
  @Type(() => Boolean)
  @IsBoolean()
  savedTryOn?: boolean;

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
    description: 'Items per page',
    example: 20,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  limit?: number = 20;
}

export class PaginatedGlassTryOnHistoryResponseDto {
  @ApiProperty({
    description: 'Array of glass try-on history records',
    type: [GlassTryOnHistoryResponseDto],
  })
  data: GlassTryOnHistoryResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: {
      total: 50,
      page: 1,
      limit: 20,
      totalPages: 3,
      hasNext: true,
      hasPrev: false,
    },
  })
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrev: boolean;
  };
}

