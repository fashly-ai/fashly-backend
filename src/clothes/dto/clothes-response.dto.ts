import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Clothes } from '../../database/entities/clothes.entity';
import type { ClothingType } from '../../database/entities/clothes.entity';

export class ClothesResponseDto {
  @ApiProperty({ description: 'Clothes ID', example: '123e4567-e89b-12d3-a456-426614174000' })
  id: string;

  @ApiProperty({ description: 'Clothes name', example: 'Classic White T-Shirt' })
  name: string;

  @ApiProperty({ description: 'Brand name', example: 'Nike' })
  brand: string;

  @ApiProperty({
    description: 'Clothing type',
    enum: ['upper', 'lower'],
    example: 'upper',
  })
  clothingType: ClothingType;

  @ApiPropertyOptional({ description: 'Description', example: 'Comfortable cotton t-shirt' })
  description?: string;

  @ApiPropertyOptional({ description: 'Price', example: 29.99 })
  price?: number;

  @ApiPropertyOptional({ description: 'Currency', example: 'USD' })
  currency?: string;

  @ApiProperty({ description: 'Main image URL', example: 'https://example.com/image.jpg' })
  imageUrl: string;

  @ApiPropertyOptional({ description: 'Thumbnail URL', example: 'https://example.com/thumb.jpg' })
  thumbnailUrl?: string;

  @ApiPropertyOptional({
    description: 'Additional images',
    type: [String],
    example: ['https://example.com/img1.jpg', 'https://example.com/img2.jpg'],
  })
  additionalImages?: string[];

  @ApiPropertyOptional({ description: 'Color', example: 'white' })
  color?: string;

  @ApiPropertyOptional({
    description: 'Available sizes',
    type: [String],
    example: ['S', 'M', 'L', 'XL'],
  })
  sizes?: string[];

  @ApiPropertyOptional({ description: 'Material', example: '100% Cotton' })
  material?: string;

  @ApiPropertyOptional({ description: 'Category', example: 'casual' })
  category?: string;

  @ApiPropertyOptional({ description: 'Season', example: 'summer' })
  season?: string;

  @ApiPropertyOptional({ description: 'Style', example: 'sporty' })
  style?: string;

  @ApiPropertyOptional({
    description: 'Tags',
    type: [String],
    example: ['trendy', 'comfortable'],
  })
  tags?: string[];

  @ApiPropertyOptional({ description: 'Product URL', example: 'https://example.com/product' })
  productUrl?: string;

  @ApiPropertyOptional({ description: 'SKU', example: 'TSH-WHT-001' })
  sku?: string;

  @ApiProperty({ description: 'Is active', example: true })
  isActive: boolean;

  @ApiProperty({ description: 'In stock', example: true })
  inStock: boolean;

  @ApiPropertyOptional({ description: 'Is favorited by user', example: false })
  isFavorite?: boolean;

  @ApiProperty({ description: 'Created at', example: '2025-11-30T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Updated at', example: '2025-11-30T10:00:00Z' })
  updatedAt: Date;

  static fromEntity(clothes: Clothes, isFavorite = false): ClothesResponseDto {
    return {
      id: clothes.id,
      name: clothes.name,
      brand: clothes.brand,
      clothingType: clothes.clothingType,
      description: clothes.description,
      price: clothes.price ? Number(clothes.price) : undefined,
      currency: clothes.currency,
      imageUrl: clothes.imageUrl,
      thumbnailUrl: clothes.thumbnailUrl,
      additionalImages: clothes.additionalImages,
      color: clothes.color,
      sizes: clothes.sizes,
      material: clothes.material,
      category: clothes.category,
      season: clothes.season,
      style: clothes.style,
      tags: clothes.tags,
      productUrl: clothes.productUrl,
      sku: clothes.sku,
      isActive: clothes.isActive,
      inStock: clothes.inStock,
      isFavorite,
      createdAt: clothes.createdAt,
      updatedAt: clothes.updatedAt,
    };
  }
}

export class PaginatedClothesResponseDto {
  @ApiProperty({
    description: 'Array of clothes items',
    type: [ClothesResponseDto],
  })
  data: ClothesResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: {
      total: 100,
      page: 1,
      limit: 20,
      totalPages: 5,
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

