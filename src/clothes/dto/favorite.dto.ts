import { IsBoolean, IsOptional, IsNumber, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { ClothesResponseDto } from './clothes-response.dto';

export class ToggleClothesFavoriteDto {
  @ApiProperty({
    description: 'Whether to favorite (true) or unfavorite (false)',
    example: true,
  })
  @IsBoolean()
  isFavorite: boolean;
}

export class ClothesFavoriteResponseDto {
  @ApiProperty({ description: 'Success status', example: true })
  success: boolean;

  @ApiProperty({
    description: 'Action performed',
    enum: ['added', 'removed'],
    example: 'added',
  })
  action: 'added' | 'removed';

  @ApiProperty({ description: 'Response message', example: 'Clothes added to favorites' })
  message: string;

  @ApiProperty({
    description: 'Clothes data with favorite status',
    type: ClothesResponseDto,
  })
  data: ClothesResponseDto;
}

export class UserClothesFavoritesQueryDto {
  @ApiPropertyOptional({
    description: 'Filter by clothing type',
    enum: ['upper', 'lower'],
    example: 'upper',
  })
  @IsOptional()
  clothingType?: 'upper' | 'lower';

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


