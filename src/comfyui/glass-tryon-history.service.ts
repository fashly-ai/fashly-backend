import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { GlassTryOnHistory } from '../database/entities/glass-tryon-history.entity';
import { Glasses } from '../database/entities/glasses.entity';
import {
  SaveGlassTryOnDto,
  UpdateSavedStatusDto,
  GlassTryOnHistoryQueryDto,
  GlassTryOnHistoryResponseDto,
  PaginatedGlassTryOnHistoryResponseDto,
  SaveGlassTryOnResponseDto,
} from './dto/glass-tryon-history.dto';
import { GlassesResponseDto } from '../glasses/dto/glasses-response.dto';

@Injectable()
export class GlassTryOnHistoryService {
  private readonly logger = new Logger(GlassTryOnHistoryService.name);

  constructor(
    @InjectRepository(GlassTryOnHistory)
    private readonly glassTryOnHistoryRepository: Repository<GlassTryOnHistory>,
    @InjectRepository(Glasses)
    private readonly glassesRepository: Repository<Glasses>,
  ) {}

  async saveGlassTryOn(
    userId: string,
    saveDto: SaveGlassTryOnDto,
  ): Promise<SaveGlassTryOnResponseDto> {
    // Verify glass exists
    const glass = await this.glassesRepository.findOne({
      where: { id: saveDto.glassId },
    });

    if (!glass) {
      throw new NotFoundException(`Glass with ID ${saveDto.glassId} not found`);
    }

    // Create new try-on history record
    const glassTryOn = this.glassTryOnHistoryRepository.create({
      userId,
      glassesId: saveDto.glassId,
      prompt: saveDto.prompt,
      negativePrompt: saveDto.negativePrompt,
      seed: saveDto.seed,
      resultImageUrl: saveDto.resultImageBase64,
      promptId: saveDto.promptId,
      filename: saveDto.filename,
      processingTime: saveDto.processingTime,
      imageSize: saveDto.imageSize,
      savedTryOn: false, // Initially not saved
    });

    const saved = await this.glassTryOnHistoryRepository.save(glassTryOn);
    this.logger.log(
      `Glass try-on saved for user ${userId}, glass ${saveDto.glassId}`,
    );

    // Transform to response DTO
    const glassesResponse = GlassesResponseDto.fromEntity(glass);
    const historyResponse = GlassTryOnHistoryResponseDto.fromEntity(
      saved,
      glassesResponse,
    );

    return {
      success: true,
      action: 'saved',
      message: 'Glass try-on saved successfully',
      data: historyResponse,
    };
  }

  async getHistory(
    userId: string,
    queryDto: GlassTryOnHistoryQueryDto,
  ): Promise<PaginatedGlassTryOnHistoryResponseDto> {
    const { savedTryOn, page = 1, limit = 20 } = queryDto;

    // Build query
    const queryBuilder = this.glassTryOnHistoryRepository
      .createQueryBuilder('history')
      .leftJoinAndSelect('history.glasses', 'glasses')
      .where('history.userId = :userId', { userId })
      .andWhere('glasses.isActive = :isActive', { isActive: true });

    // Filter by saved status if provided
    if (savedTryOn !== undefined) {
      queryBuilder.andWhere('history.savedTryOn = :savedTryOn', { savedTryOn });
    }

    // Order by most recent first
    queryBuilder.orderBy('history.createdAt', 'DESC');

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Execute query
    const history = await queryBuilder.getMany();

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // Transform to response DTOs
    const data = history.map((item) => {
      const glassesResponse = GlassesResponseDto.fromEntity(item.glasses);
      return GlassTryOnHistoryResponseDto.fromEntity(item, glassesResponse);
    });

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

  async updateSavedStatus(
    userId: string,
    historyId: string,
    updateDto: UpdateSavedStatusDto,
  ): Promise<GlassTryOnHistoryResponseDto> {
    // Find the history record
    const history = await this.glassTryOnHistoryRepository.findOne({
      where: { id: historyId, userId },
      relations: ['glasses'],
    });

    if (!history) {
      throw new NotFoundException(
        `Glass try-on history with ID ${historyId} not found`,
      );
    }

    // Update saved status
    history.savedTryOn = updateDto.savedTryOn;
    const updated = await this.glassTryOnHistoryRepository.save(history);

    this.logger.log(
      `Updated saved status to ${updateDto.savedTryOn} for history ${historyId}`,
    );

    // Transform to response DTO
    const glassesResponse = GlassesResponseDto.fromEntity(updated.glasses);
    return GlassTryOnHistoryResponseDto.fromEntity(updated, glassesResponse);
  }

  async deleteHistory(userId: string, historyId: string): Promise<void> {
    const history = await this.glassTryOnHistoryRepository.findOne({
      where: { id: historyId, userId },
    });

    if (!history) {
      throw new NotFoundException(
        `Glass try-on history with ID ${historyId} not found`,
      );
    }

    await this.glassTryOnHistoryRepository.remove(history);
    this.logger.log(
      `Deleted glass try-on history ${historyId} for user ${userId}`,
    );
  }

  async getHistoryById(
    userId: string,
    historyId: string,
  ): Promise<GlassTryOnHistoryResponseDto> {
    const history = await this.glassTryOnHistoryRepository.findOne({
      where: { id: historyId, userId },
      relations: ['glasses'],
    });

    if (!history) {
      throw new NotFoundException(
        `Glass try-on history with ID ${historyId} not found`,
      );
    }

    const glassesResponse = GlassesResponseDto.fromEntity(history.glasses);
    return GlassTryOnHistoryResponseDto.fromEntity(history, glassesResponse);
  }

  async getHistoryCount(userId: string, savedOnly = false): Promise<number> {
    const where: { userId: string; savedTryOn?: boolean } = { userId };
    if (savedOnly) {
      where.savedTryOn = true;
    }
    return this.glassTryOnHistoryRepository.count({ where });
  }
}
