import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Glasses } from '../database/entities/glasses.entity';
import { Favorite } from '../database/entities/favorite.entity';
import {
  GlassesQueryDto,
  GlassesSortBy,
  SortOrder,
} from './dto/glasses-query.dto';
import {
  GlassesResponseDto,
  PaginatedGlassesResponseDto,
} from './dto/glasses-response.dto';
import { FavoriteResponseDto, UserFavoritesQueryDto } from './dto/favorite.dto';

@Injectable()
export class GlassesService {
  constructor(
    @InjectRepository(Glasses)
    private readonly glassesRepository: Repository<Glasses>,
    @InjectRepository(Favorite)
    private readonly favoriteRepository: Repository<Favorite>,
  ) {}

  async findAll(
    queryDto: GlassesQueryDto,
    userId: string,
  ): Promise<PaginatedGlassesResponseDto> {
    const {
      search,
      brand,
      category,
      availability,
      isActive,
      minPrice,
      maxPrice,
      sortBy = GlassesSortBy.CREATED_AT,
      sortOrder = SortOrder.DESC,
      page = 1,
      limit = 20,
    } = queryDto;

    // Create query builder
    const queryBuilder = this.glassesRepository.createQueryBuilder('glasses');

    // Apply filters
    this.applyFilters(queryBuilder, {
      search,
      brand,
      category,
      availability,
      isActive,
      minPrice,
      maxPrice,
    });

    // Apply sorting
    this.applySorting(queryBuilder, sortBy, sortOrder);

    // Get total count for pagination
    const total = await queryBuilder.getCount();

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Execute query
    const glasses = await queryBuilder.getMany();

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // Get favorite status for the user (skip for anonymous users)
    let favoriteGlassesIds: string[] = [];
    if (userId && userId !== 'anonymous') {
      const favorites = await this.favoriteRepository.find({
        where: { userId },
        select: ['glassesId'],
      });
      favoriteGlassesIds = favorites.map((fav) => fav.glassesId).filter((id): id is string => id !== undefined);
    }

    // Transform to response DTOs
    const data = glasses.map((glass) =>
      GlassesResponseDto.fromEntity(
        glass,
        favoriteGlassesIds.includes(glass.id),
      ),
    );

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext,
        hasPrev,
      },
    };
  }

  async findById(id: string, userId: string): Promise<GlassesResponseDto> {
    const glasses = await this.glassesRepository.findOne({
      where: { id },
    });

    if (!glasses) {
      throw new NotFoundException(`Glasses with ID ${id} not found`);
    }

    // Check if favorited by user (skip for anonymous users)
    let isFavorite = false;
    if (userId && userId !== 'anonymous') {
      const favorite = await this.favoriteRepository.findOne({
        where: { userId, glassesId: id },
      });
      isFavorite = !!favorite;
    }

    return GlassesResponseDto.fromEntity(glasses, isFavorite);
  }

  async findByBrand(
    brand: string,
    userId: string,
  ): Promise<GlassesResponseDto[]> {
    const glasses = await this.glassesRepository.find({
      where: { brand, isActive: true },
      order: { createdAt: 'DESC' },
    });

    // Get favorite status for the user (skip for anonymous users)
    let favoriteGlassesIds: string[] = [];
    if (userId && userId !== 'anonymous') {
      const favorites = await this.favoriteRepository.find({
        where: { userId },
        select: ['glassesId'],
      });
      favoriteGlassesIds = favorites.map((fav) => fav.glassesId).filter((id): id is string => id !== undefined);
    }

    return glasses.map((glass) =>
      GlassesResponseDto.fromEntity(
        glass,
        favoriteGlassesIds.includes(glass.id),
      ),
    );
  }

  async findByCategory(
    category: string,
    userId: string,
  ): Promise<GlassesResponseDto[]> {
    const glasses = await this.glassesRepository.find({
      where: { category, isActive: true },
      order: { createdAt: 'DESC' },
    });

    // Get favorite status for the user (skip for anonymous users)
    let favoriteGlassesIds: string[] = [];
    if (userId && userId !== 'anonymous') {
      const favorites = await this.favoriteRepository.find({
        where: { userId },
        select: ['glassesId'],
      });
      favoriteGlassesIds = favorites.map((fav) => fav.glassesId).filter((id): id is string => id !== undefined);
    }

    return glasses.map((glass) =>
      GlassesResponseDto.fromEntity(
        glass,
        favoriteGlassesIds.includes(glass.id),
      ),
    );
  }

  async getAvailableBrands(): Promise<string[]> {
    const result = await this.glassesRepository
      .createQueryBuilder('glasses')
      .select('DISTINCT glasses.brand', 'brand')
      .where('glasses.brand IS NOT NULL')
      .andWhere("glasses.brand != ''")
      .andWhere('glasses.isActive = :isActive', { isActive: true })
      .orderBy('glasses.brand', 'ASC')
      .getRawMany();

    return result.map((item: { brand: string }) => item.brand).filter(Boolean);
  }

  async getAvailableCategories(): Promise<string[]> {
    const result = await this.glassesRepository
      .createQueryBuilder('glasses')
      .select('DISTINCT glasses.category', 'category')
      .where('glasses.category IS NOT NULL')
      .andWhere("glasses.category != ''")
      .andWhere('glasses.isActive = :isActive', { isActive: true })
      .orderBy('glasses.category', 'ASC')
      .getRawMany();

    return result
      .map((item: { category: string }) => item.category)
      .filter(Boolean);
  }

  private applyFilters(
    queryBuilder: SelectQueryBuilder<Glasses>,
    filters: {
      search?: string;
      brand?: string;
      category?: string;
      availability?: string;
      isActive?: boolean;
      minPrice?: number;
      maxPrice?: number;
    },
  ): void {
    const {
      search,
      brand,
      category,
      availability,
      isActive,
      minPrice,
      maxPrice,
    } = filters;

    // Search filter (searches in name, brand, and category)
    if (search) {
      queryBuilder.andWhere(
        '(LOWER(glasses.name) LIKE LOWER(:search) OR LOWER(glasses.brand) LIKE LOWER(:search) OR LOWER(glasses.category) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    // Brand filter
    if (brand) {
      queryBuilder.andWhere('LOWER(glasses.brand) = LOWER(:brand)', { brand });
    }

    // Category filter
    if (category) {
      queryBuilder.andWhere('LOWER(glasses.category) = LOWER(:category)', {
        category,
      });
    }

    // Availability filter
    if (availability) {
      queryBuilder.andWhere(
        'LOWER(glasses.availability) = LOWER(:availability)',
        { availability },
      );
    }

    // Active status filter
    if (isActive !== undefined) {
      queryBuilder.andWhere('glasses.isActive = :isActive', { isActive });
    }

    // Price range filters
    if (minPrice !== undefined || maxPrice !== undefined) {
      // Extract numeric value from price string (assuming format like "$150.00" or "150")
      if (minPrice !== undefined) {
        queryBuilder.andWhere(
          "CAST(REGEXP_REPLACE(glasses.price, '[^0-9.]', '', 'g') AS DECIMAL) >= :minPrice",
          { minPrice },
        );
      }
      if (maxPrice !== undefined) {
        queryBuilder.andWhere(
          "CAST(REGEXP_REPLACE(glasses.price, '[^0-9.]', '', 'g') AS DECIMAL) <= :maxPrice",
          { maxPrice },
        );
      }
    }
  }

  private applySorting(
    queryBuilder: SelectQueryBuilder<Glasses>,
    sortBy: GlassesSortBy,
    sortOrder: SortOrder,
  ): void {
    switch (sortBy) {
      case GlassesSortBy.NAME:
        queryBuilder.orderBy('glasses.name', sortOrder);
        break;
      case GlassesSortBy.BRAND:
        queryBuilder.orderBy('glasses.brand', sortOrder);
        break;
      case GlassesSortBy.PRICE:
        // Sort by numeric value extracted from price string
        queryBuilder.orderBy(
          "CAST(REGEXP_REPLACE(glasses.price, '[^0-9.]', '', 'g') AS DECIMAL)",
          sortOrder,
        );
        break;
      case GlassesSortBy.CREATED_AT:
        queryBuilder.orderBy('glasses.createdAt', sortOrder);
        break;
      case GlassesSortBy.UPDATED_AT:
        queryBuilder.orderBy('glasses.updatedAt', sortOrder);
        break;
      default:
        queryBuilder.orderBy('glasses.createdAt', sortOrder);
    }

    // Add secondary sort by ID for consistent pagination
    queryBuilder.addOrderBy('glasses.id', 'ASC');
  }

  // Favorite functionality
  async toggleFavorite(
    userId: string,
    glassesId: string,
  ): Promise<FavoriteResponseDto> {
    // Check if glasses exists
    const glasses = await this.glassesRepository.findOne({
      where: { id: glassesId },
    });

    if (!glasses) {
      throw new NotFoundException(`Glasses with ID ${glassesId} not found`);
    }

    // Check if already favorited
    const existingFavorite = await this.favoriteRepository.findOne({
      where: { userId, glassesId },
    });

    if (existingFavorite) {
      // Remove from favorites
      await this.favoriteRepository.remove(existingFavorite);
      return {
        success: true,
        isFavorite: false,
        action: 'removed',
        message: 'Glasses removed from favorites',
      };
    } else {
      // Add to favorites
      const favorite = this.favoriteRepository.create({
        userId,
        glassesId,
      });
      await this.favoriteRepository.save(favorite);
      return {
        success: true,
        isFavorite: true,
        action: 'added',
        message: 'Glasses added to favorites',
      };
    }
  }

  async getUserFavorites(
    userId: string,
    queryDto: UserFavoritesQueryDto,
  ): Promise<PaginatedGlassesResponseDto> {
    const { page = 1, limit = 20 } = queryDto;

    // Get user's favorites with glasses data
    const queryBuilder = this.favoriteRepository
      .createQueryBuilder('favorite')
      .leftJoinAndSelect('favorite.glasses', 'glasses')
      .where('favorite.userId = :userId', { userId })
      .andWhere('glasses.isActive = :isActive', { isActive: true })
      .orderBy('favorite.createdAt', 'DESC');

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Execute query
    const favorites = await queryBuilder.getMany();

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // Transform to response DTOs (all are favorites for this user)
    const data = favorites
      .filter((favorite) => favorite.glasses !== undefined)
      .map((favorite) =>
        GlassesResponseDto.fromEntity(favorite.glasses!, true),
      );

    return {
      data,
      pagination: {
        total,
        page,
        limit,
        totalPages,
        hasNext,
        hasPrev,
      },
    };
  }

  async isFavorite(userId: string, glassesId: string): Promise<boolean> {
    const favorite = await this.favoriteRepository.findOne({
      where: { userId, glassesId },
    });
    return !!favorite;
  }

  async getFavoriteCount(glassesId: string): Promise<number> {
    return this.favoriteRepository.count({
      where: { glassesId },
    });
  }
}
