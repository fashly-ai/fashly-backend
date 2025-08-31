import { IsString, IsOptional, IsEnum } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export enum GarmentCategory {
  TOPS = 'tops',
  BOTTOMS = 'bottoms',
  DRESSES = 'dresses',
  OUTERWEAR = 'outerwear',
  GENERAL = 'general',
}

export class VirtualTryOnDto {
  @ApiProperty({
    description: 'Category of the garment being tried on',
    enum: GarmentCategory,
    example: GarmentCategory.TOPS,
    required: false,
    default: GarmentCategory.GENERAL,
  })
  @IsOptional()
  @IsEnum(GarmentCategory)
  category?: GarmentCategory;

  @ApiProperty({
    description: 'Additional processing options (JSON string)',
    example: '{"preserve_background": true, "fit_adjustment": "normal"}',
    required: false,
  })
  @IsOptional()
  @IsString()
  options?: string;
}
