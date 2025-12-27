import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  Body,
  ParseUUIDPipe,
  HttpCode,
  HttpStatus,
  UseGuards,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ClothesService } from './clothes.service';
import { ClothesQueryDto } from './dto/clothes-query.dto';
import {
  ClothesResponseDto,
  PaginatedClothesResponseDto,
} from './dto/clothes-response.dto';
import {
  ToggleClothesFavoriteDto,
  ClothesFavoriteResponseDto,
  UserClothesFavoritesQueryDto,
} from './dto/favorite.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { Public } from '../auth/decorators/public.decorator';
import { User } from '../database/entities/user.entity';

@ApiTags('clothes')
@Controller('api/clothes')
export class ClothesController {
  constructor(private readonly clothesService: ClothesService) {}

  @Public()
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get clothes with filtering, sorting, and search',
    description:
      'Retrieve clothes with advanced filtering by type (upper/lower), brand, color, category, season, and more. Includes favorite status for authenticated users.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved clothes',
    type: PaginatedClothesResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
  })
  async findAll(
    @Query() queryDto: ClothesQueryDto,
    @CurrentUser() user?: User,
  ): Promise<PaginatedClothesResponseDto> {
    const userId = user?.id || 'anonymous';
    return this.clothesService.findAll(queryDto, userId);
  }

  @Public()
  @Get('types/:clothingType')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get clothes by type',
    description: 'Retrieve all clothes of a specific type (upper or lower)',
  })
  @ApiParam({
    name: 'clothingType',
    enum: ['upper', 'lower'],
    description: 'Type of clothing',
    example: 'upper',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved clothes',
    type: [ClothesResponseDto],
  })
  async findByClothingType(
    @Param('clothingType') clothingType: 'upper' | 'lower',
    @CurrentUser() user?: User,
  ): Promise<ClothesResponseDto[]> {
    const userId = user?.id || 'anonymous';
    return this.clothesService.findByClothingType(clothingType, userId);
  }

  @Public()
  @Get('brands/:brand')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get clothes by brand',
    description: 'Retrieve all active clothes from a specific brand',
  })
  @ApiParam({
    name: 'brand',
    description: 'Brand name',
    example: 'Nike',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved clothes',
    type: [ClothesResponseDto],
  })
  async findByBrand(
    @Param('brand') brand: string,
    @CurrentUser() user?: User,
  ): Promise<ClothesResponseDto[]> {
    const userId = user?.id || 'anonymous';
    return this.clothesService.findByBrand(brand, userId);
  }

  @Public()
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get clothes by ID',
    description: 'Retrieve detailed information about specific clothes item',
  })
  @ApiParam({
    name: 'id',
    description: 'Clothes UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved clothes',
    type: ClothesResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Clothes not found',
  })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user?: User,
  ): Promise<ClothesResponseDto> {
    const userId = user?.id || 'anonymous';
    return this.clothesService.findById(id, userId);
  }

  @Post(':id/favorite')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Toggle clothes favorite status',
    description: 'Add or remove clothes from user favorites',
  })
  @ApiParam({
    name: 'id',
    description: 'Clothes UUID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Favorite status toggled successfully',
    type: ClothesFavoriteResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  @ApiResponse({
    status: 404,
    description: 'Clothes not found',
  })
  async toggleFavorite(
    @CurrentUser() user: User,
    @Param('id', ParseUUIDPipe) id: string,
    @Body() toggleFavoriteDto: ToggleClothesFavoriteDto,
  ): Promise<ClothesFavoriteResponseDto> {
    return this.clothesService.toggleFavorite(
      user.id,
      id,
      toggleFavoriteDto.isFavorite,
    );
  }

  @Get('favorites/my-favorites')
  @UseGuards(JwtAuthGuard)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get user favorite clothes',
    description: 'Retrieve all clothes marked as favorites by the authenticated user',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved favorite clothes',
    type: PaginatedClothesResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getUserFavorites(
    @CurrentUser() user: User,
    @Query() queryDto: UserClothesFavoritesQueryDto,
  ): Promise<PaginatedClothesResponseDto> {
    return this.clothesService.getUserFavorites(user.id, queryDto);
  }
}


