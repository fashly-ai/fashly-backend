import { IsOptional, IsString, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiPropertyOptional } from '@nestjs/swagger';
import type { ClothingType } from '../../database/entities/clothes.entity';

export class ClothesQueryDto {
  @ApiPropertyOptional({
    description: 'Search by name or brand',
    example: 'T-shirt',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Filter by brand',
    example: 'Nike',
  })
  @IsOptional()
  @IsString()
  brand?: string;

  @ApiPropertyOptional({
    description: 'Filter by clothing type',
    enum: ['upper', 'lower'],
    example: 'upper',
  })
  @IsOptional()
  @IsEnum(['upper', 'lower'])
  clothingType?: ClothingType;

  @ApiPropertyOptional({
    description: 'Filter by color',
    example: 'black',
  })
  @IsOptional()
  @IsString()
  color?: string;

  @ApiPropertyOptional({
    description: 'Filter by category',
    example: 'casual',
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiPropertyOptional({
    description: 'Filter by season',
    example: 'summer',
  })
  @IsOptional()
  @IsString()
  season?: string;

  @ApiPropertyOptional({
    description: 'Filter by style',
    example: 'sporty',
  })
  @IsOptional()
  @IsString()
  style?: string;

  @ApiPropertyOptional({
    description: 'Sort by field',
    enum: ['name', 'brand', 'price', 'createdAt'],
    default: 'createdAt',
  })
  @IsOptional()
  @IsString()
  sortBy?: 'name' | 'brand' | 'price' | 'createdAt' = 'createdAt';

  @ApiPropertyOptional({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    default: 'DESC',
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

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
}

