import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { TryOn } from '../../database/entities/tryon.entity';
import { GlassesResponseDto } from '../../glasses/dto/glasses-response.dto';

export class SaveTryOnDto {
  @ApiProperty({
    description: 'ID of the glasses that was tried on',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  glassesId: string;
}

export class TryOnHistoryQueryDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
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
}

export class TryOnHistoryResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the try-on record',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Glasses information',
    type: GlassesResponseDto,
  })
  glasses: GlassesResponseDto;

  @ApiProperty({
    description: 'When the glasses was first tried on',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the try-on record was last updated',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;

  static fromEntity(tryOn: TryOn, glasses: GlassesResponseDto): TryOnHistoryResponseDto {
    return {
      id: tryOn.id,
      glasses,
      createdAt: tryOn.createdAt,
      updatedAt: tryOn.updatedAt,
    };
  }
}

export class PaginatedTryOnHistoryResponseDto {
  @ApiProperty({
    description: 'Array of try-on history records',
    type: [TryOnHistoryResponseDto],
  })
  data: TryOnHistoryResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: {
      total: 25,
      page: 1,
      limit: 20,
      totalPages: 2,
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

export class SaveTryOnResponseDto {
  @ApiProperty({
    description: 'Whether the operation was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Action performed',
    example: 'saved',
    enum: ['saved', 'updated'],
  })
  action: 'saved' | 'updated';

  @ApiProperty({
    description: 'Message describing the result',
    example: 'Try-on saved successfully',
  })
  message: string;

  @ApiProperty({
    description: 'The saved try-on record',
    type: TryOnHistoryResponseDto,
  })
  data: TryOnHistoryResponseDto;
}
