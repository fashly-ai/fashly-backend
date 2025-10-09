import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Glasses } from '../../database/entities/glasses.entity';

export class GlassesResponseDto {
  @ApiProperty({
    description: 'Unique identifier for the glasses',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Name of the glasses',
    example: 'Ray-Ban Aviator Classic',
  })
  name: string;

  @ApiProperty({
    description: 'Product URL',
    example: 'https://example.com/glasses/ray-ban-aviator',
  })
  productUrl: string;

  @ApiProperty({
    description: 'Main image URL',
    example: 'https://example.com/images/glasses/main.jpg',
  })
  imageUrl: string;

  @ApiPropertyOptional({
    description: 'Additional images as JSON array',
    example: ['https://example.com/images/glasses/1.jpg', 'https://example.com/images/glasses/2.jpg'],
  })
  allImages?: string[];

  @ApiPropertyOptional({
    description: 'Brand name',
    example: 'Ray-Ban',
  })
  brand?: string;

  @ApiPropertyOptional({
    description: 'Category of glasses',
    example: 'Sunglasses',
  })
  category?: string;

  @ApiPropertyOptional({
    description: 'Price of the glasses',
    example: '$150.00',
  })
  price?: string;

  @ApiPropertyOptional({
    description: 'Availability status',
    example: 'In Stock',
  })
  availability?: string;

  @ApiProperty({
    description: 'Whether the glasses are active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Whether the glasses is favorited by the current user',
    example: true,
  })
  isFavorite?: boolean;

  static fromEntity(glasses: Glasses, isFavorite?: boolean): GlassesResponseDto {
    return {
      id: glasses.id,
      name: glasses.name,
      productUrl: glasses.productUrl,
      imageUrl: glasses.imageUrl,
      allImages: glasses.getAllImagesArray(),
      brand: glasses.brand,
      category: glasses.category,
      price: glasses.price,
      availability: glasses.availability,
      isActive: glasses.isActive,
      createdAt: glasses.createdAt,
      updatedAt: glasses.updatedAt,
      isFavorite,
    };
  }
}

export class PaginatedGlassesResponseDto {
  @ApiProperty({
    description: 'Array of glasses',
    type: [GlassesResponseDto],
  })
  data: GlassesResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    example: {
      total: 150,
      page: 1,
      limit: 20,
      totalPages: 8,
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
