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
import { GlassesService } from './glasses.service';
import { GlassesQueryDto } from './dto/glasses-query.dto';
import {
  GlassesResponseDto,
  PaginatedGlassesResponseDto,
} from './dto/glasses-response.dto';
import {
  ToggleFavoriteDto,
  FavoriteResponseDto,
  UserFavoritesQueryDto,
} from './dto/favorite.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../database/entities/user.entity';

@ApiTags('glasses')
@Controller('api/glasses')
export class GlassesController {
  constructor(private readonly glassesService: GlassesService) {}

  @UseGuards(JwtAuthGuard)
  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get glasses with filtering, sorting, and search',
    description:
      'Retrieve glasses with advanced filtering, sorting, search, and pagination capabilities. Includes favorite status for each glasses.',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved glasses',
    type: PaginatedGlassesResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid query parameters',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  async findAll(
    @Query() queryDto: GlassesQueryDto,
    @CurrentUser() user: User,
  ): Promise<PaginatedGlassesResponseDto> {
    return this.glassesService.findAll(queryDto, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('brands')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get available brands',
    description: 'Retrieve a list of all available glasses brands',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved brands',
    schema: {
      type: 'array',
      items: { type: 'string' },
      example: ['Ray-Ban', 'Oakley', 'Gucci', 'Prada'],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  async getAvailableBrands(): Promise<string[]> {
    return this.glassesService.getAvailableBrands();
  }

  @UseGuards(JwtAuthGuard)
  @Get('categories')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get available categories',
    description: 'Retrieve a list of all available glasses categories',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved categories',
    schema: {
      type: 'array',
      items: { type: 'string' },
      example: ['Sunglasses', 'Prescription Glasses', 'Reading Glasses'],
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  async getAvailableCategories(): Promise<string[]> {
    return this.glassesService.getAvailableCategories();
  }

  @UseGuards(JwtAuthGuard)
  @Get('brand/:brand')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get glasses by brand',
    description:
      'Retrieve all glasses from a specific brand with favorite status',
  })
  @ApiParam({
    name: 'brand',
    description: 'Brand name',
    example: 'Ray-Ban',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved glasses by brand',
    type: [GlassesResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({
    status: 404,
    description: 'Brand not found',
  })
  async findByBrand(
    @Param('brand') brand: string,
    @CurrentUser() user: User,
  ): Promise<GlassesResponseDto[]> {
    return this.glassesService.findByBrand(brand, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get('category/:category')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get glasses by category',
    description:
      'Retrieve all glasses from a specific category with favorite status',
  })
  @ApiParam({
    name: 'category',
    description: 'Category name',
    example: 'Sunglasses',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved glasses by category',
    type: [GlassesResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({
    status: 404,
    description: 'Category not found',
  })
  async findByCategory(
    @Param('category') category: string,
    @CurrentUser() user: User,
  ): Promise<GlassesResponseDto[]> {
    return this.glassesService.findByCategory(category, user.id);
  }

  @UseGuards(JwtAuthGuard)
  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get glasses by ID',
    description:
      'Retrieve a specific glasses item by its unique identifier with favorite status',
  })
  @ApiParam({
    name: 'id',
    description: 'Glasses unique identifier (UUID)',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved glasses',
    type: GlassesResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid UUID format',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({
    status: 404,
    description: 'Glasses not found',
  })
  async findById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<GlassesResponseDto> {
    return this.glassesService.findById(id, user.id);
  }

  // Favorite endpoints
  @UseGuards(JwtAuthGuard)
  @Post('favorites/toggle')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Toggle favorite status for glasses',
    description: 'Add or remove glasses from user favorites',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully toggled favorite status',
    type: FavoriteResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({
    status: 404,
    description: 'Glasses not found',
  })
  async toggleFavorite(
    @Body() toggleFavoriteDto: ToggleFavoriteDto,
    @CurrentUser() user: User,
  ): Promise<FavoriteResponseDto> {
    return this.glassesService.toggleFavorite(
      user.id,
      toggleFavoriteDto.glassesId,
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('favorites/my')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get user favorites',
    description: 'Retrieve all glasses favorited by the current user',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved user favorites',
    type: PaginatedGlassesResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  async getUserFavorites(
    @Query() queryDto: UserFavoritesQueryDto,
    @CurrentUser() user: User,
  ): Promise<PaginatedGlassesResponseDto> {
    return this.glassesService.getUserFavorites(user.id, queryDto);
  }
}
