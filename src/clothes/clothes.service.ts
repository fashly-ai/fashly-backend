import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { Clothes } from '../database/entities/clothes.entity';
import { Favorite } from '../database/entities/favorite.entity';
import { ClothesQueryDto } from './dto/clothes-query.dto';
import {
  ClothesResponseDto,
  PaginatedClothesResponseDto,
} from './dto/clothes-response.dto';
import {
  ClothesFavoriteResponseDto,
  UserClothesFavoritesQueryDto,
} from './dto/favorite.dto';

@Injectable()
export class ClothesService {
  constructor(
    @InjectRepository(Clothes)
    private readonly clothesRepository: Repository<Clothes>,
    @InjectRepository(Favorite)
    private readonly favoriteRepository: Repository<Favorite>,
  ) {}

  async findAll(
    queryDto: ClothesQueryDto,
    userId: string,
  ): Promise<PaginatedClothesResponseDto> {
    const {
      search,
      brand,
      clothingType,
      color,
      category,
      season,
      style,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
      page = 1,
      limit = 20,
    } = queryDto;

    // Create query builder
    const queryBuilder = this.clothesRepository.createQueryBuilder('clothes');

    // Apply filters
    queryBuilder.where('clothes.isActive = :isActive', { isActive: true });

    if (search) {
      queryBuilder.andWhere(
        '(LOWER(clothes.name) LIKE LOWER(:search) OR LOWER(clothes.brand) LIKE LOWER(:search))',
        { search: `%${search}%` },
      );
    }

    if (brand) {
      queryBuilder.andWhere('LOWER(clothes.brand) = LOWER(:brand)', { brand });
    }

    if (clothingType) {
      queryBuilder.andWhere('clothes.clothingType = :clothingType', { clothingType });
    }

    if (color) {
      queryBuilder.andWhere('LOWER(clothes.color) = LOWER(:color)', { color });
    }

    if (category) {
      queryBuilder.andWhere('LOWER(clothes.category) = LOWER(:category)', { category });
    }

    if (season) {
      queryBuilder.andWhere('LOWER(clothes.season) = LOWER(:season)', { season });
    }

    if (style) {
      queryBuilder.andWhere('LOWER(clothes.style) = LOWER(:style)', { style });
    }

    // Apply sorting
    const orderDirection = sortOrder === 'ASC' ? 'ASC' : 'DESC';
    queryBuilder.orderBy(`clothes.${sortBy}`, orderDirection);

    // Get total count for pagination
    const total = await queryBuilder.getCount();

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Execute query
    const clothes = await queryBuilder.getMany();

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // Get favorite status for the user (skip for anonymous users)
    let favoriteClothesIds: string[] = [];
    if (userId && userId !== 'anonymous') {
      const favorites = await this.favoriteRepository.find({
        where: { userId, itemType: 'clothes' },
        select: ['itemId'],
      });
      favoriteClothesIds = favorites.map((fav) => fav.itemId).filter((id): id is string => id !== undefined);
    }

    // Transform to response DTOs
    const data = clothes.map((item) =>
      ClothesResponseDto.fromEntity(item, favoriteClothesIds.includes(item.id)),
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

  async findById(id: string, userId: string): Promise<ClothesResponseDto> {
    const clothes = await this.clothesRepository.findOne({
      where: { id },
    });

    if (!clothes) {
      throw new NotFoundException(`Clothes with ID ${id} not found`);
    }

    // Check if favorited by user (skip for anonymous users)
    let isFavorite = false;
    if (userId && userId !== 'anonymous') {
      const favorite = await this.favoriteRepository.findOne({
        where: { userId, itemId: id, itemType: 'clothes' },
      });
      isFavorite = !!favorite;
    }

    return ClothesResponseDto.fromEntity(clothes, isFavorite);
  }

  async findByBrand(brand: string, userId: string): Promise<ClothesResponseDto[]> {
    const clothes = await this.clothesRepository.find({
      where: { brand, isActive: true },
      order: { createdAt: 'DESC' },
    });

    // Get favorite status for the user (skip for anonymous users)
    let favoriteClothesIds: string[] = [];
    if (userId && userId !== 'anonymous') {
      const favorites = await this.favoriteRepository.find({
        where: { userId, itemType: 'clothes' },
        select: ['itemId'],
      });
      favoriteClothesIds = favorites.map((fav) => fav.itemId).filter((id): id is string => id !== undefined);
    }

    return clothes.map((item) =>
      ClothesResponseDto.fromEntity(item, favoriteClothesIds.includes(item.id)),
    );
  }

  async findByClothingType(
    clothingType: 'upper' | 'lower',
    userId: string,
  ): Promise<ClothesResponseDto[]> {
    const clothes = await this.clothesRepository.find({
      where: { clothingType, isActive: true },
      order: { createdAt: 'DESC' },
    });

    // Get favorite status for the user (skip for anonymous users)
    let favoriteClothesIds: string[] = [];
    if (userId && userId !== 'anonymous') {
      const favorites = await this.favoriteRepository.find({
        where: { userId, itemType: 'clothes' },
        select: ['itemId'],
      });
      favoriteClothesIds = favorites.map((fav) => fav.itemId).filter((id): id is string => id !== undefined);
    }

    return clothes.map((item) =>
      ClothesResponseDto.fromEntity(item, favoriteClothesIds.includes(item.id)),
    );
  }

  async toggleFavorite(
    userId: string,
    clothesId: string,
    isFavorite: boolean,
  ): Promise<ClothesFavoriteResponseDto> {
    // Verify clothes exists
    const clothes = await this.clothesRepository.findOne({
      where: { id: clothesId },
    });

    if (!clothes) {
      throw new NotFoundException(`Clothes with ID ${clothesId} not found`);
    }

    if (isFavorite) {
      // Add to favorites
      const existingFavorite = await this.favoriteRepository.findOne({
        where: { userId, itemId: clothesId, itemType: 'clothes' },
      });

      if (!existingFavorite) {
        await this.favoriteRepository.save({
          userId,
          itemId: clothesId,
          itemType: 'clothes',
        });
      }

      return {
        success: true,
        action: 'added',
        message: 'Clothes added to favorites',
        data: ClothesResponseDto.fromEntity(clothes, true),
      };
    } else {
      // Remove from favorites
      await this.favoriteRepository.delete({
        userId,
        itemId: clothesId,
        itemType: 'clothes',
      });

      return {
        success: true,
        action: 'removed',
        message: 'Clothes removed from favorites',
        data: ClothesResponseDto.fromEntity(clothes, false),
      };
    }
  }

  async getUserFavorites(
    userId: string,
    queryDto: UserClothesFavoritesQueryDto,
  ): Promise<PaginatedClothesResponseDto> {
    const { clothingType, page = 1, limit = 20 } = queryDto;

    // Get user's favorite clothes IDs
    const favoriteQuery = this.favoriteRepository
      .createQueryBuilder('favorite')
      .where('favorite.userId = :userId', { userId })
      .andWhere('favorite.itemType = :itemType', { itemType: 'clothes' });

    const favorites = await favoriteQuery.getMany();
    const favoriteClothesIds = favorites.map((fav) => fav.itemId);

    if (favoriteClothesIds.length === 0) {
      return {
        data: [],
        pagination: {
          total: 0,
          page,
          limit,
          totalPages: 0,
          hasNext: false,
          hasPrev: false,
        },
      };
    }

    // Query clothes that match the favorite IDs
    const queryBuilder = this.clothesRepository
      .createQueryBuilder('clothes')
      .where('clothes.id IN (:...ids)', { ids: favoriteClothesIds })
      .andWhere('clothes.isActive = :isActive', { isActive: true });

    if (clothingType) {
      queryBuilder.andWhere('clothes.clothingType = :clothingType', { clothingType });
    }

    queryBuilder.orderBy('clothes.createdAt', 'DESC');

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Execute query
    const clothes = await queryBuilder.getMany();

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // All items in this query are favorites
    const data = clothes.map((item) => ClothesResponseDto.fromEntity(item, true));

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
}

