import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsNotEmpty } from 'class-validator';

export class ToggleFavoriteDto {
  @ApiProperty({
    description: 'ID of the glasses to toggle favorite status',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @IsUUID()
  @IsNotEmpty()
  glassesId: string;
}

export class FavoriteResponseDto {
  @ApiProperty({
    description: 'Whether the action was successful',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Current favorite status after the action',
    example: true,
  })
  isFavorite: boolean;

  @ApiProperty({
    description: 'Action performed',
    example: 'added',
    enum: ['added', 'removed'],
  })
  action: 'added' | 'removed';

  @ApiProperty({
    description: 'Message describing the result',
    example: 'Glasses added to favorites',
  })
  message: string;
}

export class UserFavoritesQueryDto {
  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
    required: false,
  })
  page?: number = 1;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
    default: 20,
    required: false,
  })
  limit?: number = 20;
}
