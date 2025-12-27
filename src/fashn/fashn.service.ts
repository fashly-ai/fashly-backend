import { Injectable, Logger, BadRequestException, NotFoundException, Inject, forwardRef } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import Fashn from 'fashn';
import { FashnHistory } from '../database/entities/fashn-history.entity';
import { FashnJob, FashnJobStatus } from '../database/entities/fashn-job.entity';
import {
  FashnTryOnRequestDto,
  FashnTryOnResponseDto,
  FashnPredictionStatusResponseDto,
  FashnAsyncTryOnRequestDto,
  FashnAsyncTryOnResponseDto,
  FashnJobStatusResponseDto,
} from './dto/fashn-tryon.dto';
import {
  FashnHistoryQueryDto,
  FashnHistoryResponseDto,
  FashnHistoryItemDto,
  UpdateFashnSavedStatusDto,
} from './dto/fashn-history.dto';
import { FashnJobsGateway } from './fashn-jobs.gateway';
import { S3Service } from '../s3/s3.service';
import { UserImageService } from '../auth/services/user-image.service';

@Injectable()
export class FashnService {
  private readonly logger = new Logger(FashnService.name);
  private readonly fashnClient: Fashn;

  constructor(
    private readonly configService: ConfigService,
    @InjectRepository(FashnHistory)
    private readonly fashnHistoryRepository: Repository<FashnHistory>,
    @InjectRepository(FashnJob)
    private readonly fashnJobRepository: Repository<FashnJob>,
    @Inject(forwardRef(() => FashnJobsGateway))
    private readonly fashnJobsGateway: FashnJobsGateway,
    private readonly s3Service: S3Service,
    private readonly userImageService: UserImageService,
  ) {
    const apiKey = this.configService.get<string>('FASHN_API_KEY');
    
    if (!apiKey) {
      this.logger.error('FASHN_API_KEY is not configured in environment variables');
      throw new Error('FASHN API key is required. Please set FASHN_API_KEY in your environment.');
    }

    this.fashnClient = new Fashn({
      apiKey: apiKey,
    });

    this.logger.log('FASHN service initialized successfully');
  }

  /**
   * Generate virtual try-on using FASHN API with full body and upper/lower garments
   */
  async generateTryOn(
    userId: string,
    requestDto: FashnTryOnRequestDto,
  ): Promise<FashnTryOnResponseDto> {
    const startTime = Date.now();

    try {
      this.logger.log(`Starting FASHN try-on for user ${userId}`);
      this.logger.log(`Model image: ${requestDto.modelImageUrl}`);
      this.logger.log(`Upper garment: ${requestDto.upperGarmentUrl}`);
      this.logger.log(`Lower garment: ${requestDto.lowerGarmentUrl}`);

      // FASHN API only supports one garment at a time
      // First, try on the upper garment
      this.logger.log('Step 1: Trying on upper garment...');
      const upperResponse = await this.fashnClient.predictions.subscribe({
        model_name: 'tryon-v1.6',
        inputs: {
          model_image: requestDto.modelImageUrl,
          garment_image: requestDto.upperGarmentUrl,
          category: 'tops',
        },
      });

      if (upperResponse.status !== 'completed' || !upperResponse.output) {
        throw new BadRequestException(
          `Upper garment try-on failed: ${upperResponse.error?.message || 'Unknown error'}`,
        );
      }

      const upperResultUrl = Array.isArray(upperResponse.output)
        ? upperResponse.output[0]
        : upperResponse.output;

      this.logger.log(`Upper garment completed: ${upperResultUrl}`);

      // Second, try on the lower garment using the result from upper garment
      this.logger.log('Step 2: Trying on lower garment...');
      const lowerResponse = await this.fashnClient.predictions.subscribe({
        model_name: 'tryon-v1.6',
        inputs: {
          model_image: upperResultUrl,
          garment_image: requestDto.lowerGarmentUrl,
          category: 'bottoms',
        },
      });

      const processingTime = Date.now() - startTime;

      if (lowerResponse.status === 'completed' && lowerResponse.output) {
        this.logger.log(`FASHN full try-on completed successfully in ${processingTime}ms`);
        this.logger.log(`Final prediction ID: ${lowerResponse.id}`);

        // Extract output URL from final result
        const outputImageUrl = Array.isArray(lowerResponse.output)
          ? lowerResponse.output[0]
          : lowerResponse.output;

        const result: FashnTryOnResponseDto = {
          success: true,
          outputImageUrl: outputImageUrl as string,
          predictionId: lowerResponse.id,
          processingTime,
          model: 'tryon-v1.6',
          metadata: {
            status: lowerResponse.status,
            upperPredictionId: upperResponse.id,
            creditsUsed: (upperResponse.creditsUsed || 0) + (lowerResponse.creditsUsed || 0),
          },
        };

        // Save to history if requested
        if (requestDto.saveToHistory) {
          const historyRecord = await this.saveToHistory(
            userId,
            requestDto,
            result,
          );
          result.historyId = historyRecord.id;
          this.logger.log(`Saved to history with ID: ${historyRecord.id}`);
        }

        return result;
      } else {
        // Lower garment try-on failed
        this.logger.error(`Lower garment try-on failed: ${lowerResponse.error?.message || 'Unknown error'}`);
        throw new BadRequestException(
          `Lower garment try-on failed: ${lowerResponse.error?.message || 'Unknown error'}`,
        );
      }
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error(`FASHN try-on failed after ${processingTime}ms:`, error);

      if (error instanceof BadRequestException) {
        throw error;
      }

      if (error.message?.includes('API key')) {
        throw new BadRequestException('Invalid FASHN API key');
      }

      if (error.message?.includes('rate limit')) {
        throw new BadRequestException('FASHN API rate limit exceeded. Please try again later.');
      }

      throw new BadRequestException(
        `Failed to generate try-on: ${error.message || 'Unknown error'}`,
      );
    }
  }

  /**
   * Check the status of a FASHN prediction
   */
  async getPredictionStatus(
    predictionId: string,
  ): Promise<FashnPredictionStatusResponseDto> {
    try {
      this.logger.log(`Checking status for prediction: ${predictionId}`);

      const prediction = await this.fashnClient.predictions.status(predictionId);

      const response: FashnPredictionStatusResponseDto = {
        status: prediction.status,
        predictionId: prediction.id,
      };

      if (prediction.status === 'completed' && prediction.output) {
        const outputImageUrl = Array.isArray(prediction.output)
          ? prediction.output[0]
          : prediction.output;
        response.outputImageUrl = outputImageUrl as string;
      }

      if (prediction.status === 'failed' && prediction.error) {
        response.error = prediction.error.message || 'Unknown error';
      }

      // Calculate progress if available (FASHN might provide this)
      if (prediction.status === 'processing') {
        response.progress = 50; // Default progress indicator
      } else if (prediction.status === 'completed') {
        response.progress = 100;
      } else if (prediction.status === 'in_queue' || prediction.status === 'starting') {
        response.progress = 0;
      }

      return response;
    } catch (error) {
      this.logger.error(`Error checking prediction status:`, error);
      throw new BadRequestException(
        `Failed to get prediction status: ${error.message}`,
      );
    }
  }

  /**
   * Save try-on result to history
   */
  private async saveToHistory(
    userId: string,
    request: FashnTryOnRequestDto,
    result: FashnTryOnResponseDto,
  ): Promise<FashnHistory> {
    const historyRecord = this.fashnHistoryRepository.create({
      userId,
      modelImageUrl: request.modelImageUrl,
      upperGarmentUrl: request.upperGarmentUrl,
      lowerGarmentUrl: request.lowerGarmentUrl,
      resultImageUrl: result.outputImageUrl,
      predictionId: result.predictionId,
      processingTime: result.processingTime,
      category: request.category,
      isSaved: true, // Auto-save all try-ons to favorites
      modelName: result.model,
      metadata: result.metadata,
    });

    return await this.fashnHistoryRepository.save(historyRecord);
  }

  /**
   * Get user's FASHN try-on history
   */
  async getUserHistory(
    userId: string,
    queryDto: FashnHistoryQueryDto,
  ): Promise<FashnHistoryResponseDto> {
    const { page = 1, limit = 20, savedOnly } = queryDto;

    const queryBuilder = this.fashnHistoryRepository
      .createQueryBuilder('history')
      .where('history.userId = :userId', { userId });

    if (savedOnly) {
      queryBuilder.andWhere('history.isSaved = :isSaved', { isSaved: true });
    }

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

    // Transform to DTOs
    const data: FashnHistoryItemDto[] = history.map((item) => ({
      id: item.id,
      modelImageUrl: item.modelImageUrl,
      garmentUrls: item.garmentUrls,
      upperGarmentUrl: item.upperGarmentUrl,
      lowerGarmentUrl: item.lowerGarmentUrl,
      resultImageUrl: item.resultImageUrl,
      predictionId: item.predictionId,
      processingTime: item.processingTime,
      isSaved: item.isSaved,
      createdAt: item.createdAt,
      updatedAt: item.updatedAt,
    }));

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

  /**
   * Update saved status of a history record
   */
  async updateSavedStatus(
    userId: string,
    historyId: string,
    updateDto: UpdateFashnSavedStatusDto,
  ): Promise<FashnHistoryItemDto> {
    const history = await this.fashnHistoryRepository.findOne({
      where: { id: historyId, userId },
    });

    if (!history) {
      throw new NotFoundException(`History record with ID ${historyId} not found`);
    }

    history.isSaved = updateDto.isSaved;
    const updated = await this.fashnHistoryRepository.save(history);

    this.logger.log(
      `Updated saved status to ${updateDto.isSaved} for history ${historyId}`,
    );

    return {
      id: updated.id,
      modelImageUrl: updated.modelImageUrl,
      garmentUrls: updated.garmentUrls,
      upperGarmentUrl: updated.upperGarmentUrl,
      lowerGarmentUrl: updated.lowerGarmentUrl,
      resultImageUrl: updated.resultImageUrl,
      predictionId: updated.predictionId,
      processingTime: updated.processingTime,
      isSaved: updated.isSaved,
      createdAt: updated.createdAt,
      updatedAt: updated.updatedAt,
    };
  }

  /**
   * Delete a history record
   */
  async deleteHistory(userId: string, historyId: string): Promise<void> {
    const history = await this.fashnHistoryRepository.findOne({
      where: { id: historyId, userId },
    });

    if (!history) {
      throw new NotFoundException(`History record with ID ${historyId} not found`);
    }

    await this.fashnHistoryRepository.remove(history);
    this.logger.log(`Deleted history record ${historyId} for user ${userId}`);
  }

  /**
   * Get a specific history record
   */
  async getHistoryById(
    userId: string,
    historyId: string,
  ): Promise<FashnHistoryItemDto> {
    const history = await this.fashnHistoryRepository.findOne({
      where: { id: historyId, userId },
    });

    if (!history) {
      throw new NotFoundException(`History record with ID ${historyId} not found`);
    }

    return {
      id: history.id,
      modelImageUrl: history.modelImageUrl,
      garmentUrls: history.garmentUrls,
      upperGarmentUrl: history.upperGarmentUrl,
      lowerGarmentUrl: history.lowerGarmentUrl,
      resultImageUrl: history.resultImageUrl,
      predictionId: history.predictionId,
      processingTime: history.processingTime,
      isSaved: history.isSaved,
      createdAt: history.createdAt,
      updatedAt: history.updatedAt,
    };
  }

  /**
   * Get count of user's history records
   */
  async getHistoryCount(userId: string, savedOnly = false): Promise<number> {
    const where: { userId: string; isSaved?: boolean } = { userId };
    if (savedOnly) {
      where.isSaved = true;
    }
    return this.fashnHistoryRepository.count({ where });
  }

  // ============================================
  // Async/Queue-based Try-On Methods
  // ============================================

  /**
   * Queue a try-on job for async processing
   */
  async queueTryOn(
    userId: string,
    requestDto: FashnAsyncTryOnRequestDto,
  ): Promise<FashnAsyncTryOnResponseDto> {
    this.logger.log(`Queuing FASHN try-on job for user ${userId}`);

    // Validate: must have either garmentUrls array OR upper+lower OR outfit image
    const hasGarmentUrls = requestDto.garmentUrls && requestDto.garmentUrls.length > 0;
    const hasUpperLower = requestDto.upperGarmentUrl && requestDto.lowerGarmentUrl;
    const hasOutfit = !!requestDto.outfitImageUrl;

    if (!hasGarmentUrls && !hasUpperLower && !hasOutfit) {
      throw new BadRequestException(
        'Must provide either garmentUrls array, upperGarmentUrl + lowerGarmentUrl, or outfitImageUrl',
      );
    }

    // Get model image URL - use provided or user's default
    let modelImageUrl = requestDto.modelImageUrl;
    if (!modelImageUrl) {
      const defaultImage = await this.userImageService.getDefaultImage(userId);
      if (!defaultImage) {
        throw new BadRequestException(
          'No model image provided and user has no default image. Please upload a selfie first or provide modelImageUrl.',
        );
      }
      modelImageUrl = defaultImage.imageUrl;
      this.logger.log(`Using user's default image as model: ${modelImageUrl}`);
    }

    // Create job record
    const job = this.fashnJobRepository.create({
      userId,
      modelImageUrl,
      garmentUrls: requestDto.garmentUrls,
      upperGarmentUrl: requestDto.upperGarmentUrl,
      lowerGarmentUrl: requestDto.lowerGarmentUrl,
      outfitImageUrl: requestDto.outfitImageUrl,
      category: requestDto.category || 'auto',
      seed: requestDto.seed || Math.floor(Math.random() * 1000000),
      mode: requestDto.mode || 'quality',
      saveToHistory: requestDto.saveToHistory || false,
      status: FashnJobStatus.PENDING,
    });

    const savedJob = await this.fashnJobRepository.save(job);
    this.logger.log(`Created job ${savedJob.id} for user ${userId}`);

    // Start processing in background (non-blocking)
    this.processJobInBackground(savedJob.id).catch((error) => {
      this.logger.error(`Background job ${savedJob.id} failed:`, error);
    });

    return {
      jobId: savedJob.id,
      status: savedJob.status,
      message: 'Try-on job queued successfully. Use GET /api/fashn/jobs/:jobId to check status.',
      createdAt: savedJob.createdAt,
    };
  }

  /**
   * Process a job in the background
   */
  private async processJobInBackground(jobId: string): Promise<void> {
    const startTime = Date.now();
    let userId = '';

    try {
      const job = await this.fashnJobRepository.findOne({ where: { id: jobId } });
      if (!job) {
        this.logger.error(`Job ${jobId} not found`);
        return;
      }

      userId = job.userId;
      this.logger.log(`Starting background processing for job ${jobId}`);

      // Determine processing mode
      if (job.garmentUrls && job.garmentUrls.length > 0) {
        // New: Array of garment images mode (combine all into one)
        await this.processGarmentArrayJob(job, startTime);
      } else if (job.outfitImageUrl) {
        // Single outfit image mode
        await this.processOutfitJob(job, startTime);
      } else {
        // Legacy: Upper + Lower garment mode
        await this.processUpperLowerJob(job, startTime);
      }
    } catch (error) {
      await this.failJob(jobId, userId, error.message || 'Unknown error', Date.now() - startTime);
    }
  }

  /**
   * Process job with combined outfit image
   */
  private async processOutfitJob(job: FashnJob, startTime: number): Promise<void> {
    job.status = FashnJobStatus.PROCESSING_UPPER;
    await this.fashnJobRepository.save(job);

    // Emit processing status via WebSocket
    this.emitJobStatusUpdate(job, 25);

    this.logger.log(`Job ${job.id}: Processing outfit image with category "${job.category}"`);

    const response = await this.fashnClient.predictions.subscribe({
      model_name: 'tryon-v1.6',
      inputs: {
        model_image: job.modelImageUrl,
        garment_image: job.outfitImageUrl,
        category: job.category as 'auto' | 'tops' | 'bottoms' | 'one-pieces',
        seed: job.seed,
        mode: job.mode as 'performance' | 'balanced' | 'quality',
        output_format: 'png',
      },
    });

    const processingTime = Date.now() - startTime;

    if (response.status === 'completed' && response.output) {
      const fashnResultUrl = Array.isArray(response.output) ? response.output[0] : response.output;

      job.status = FashnJobStatus.COMPLETED;
      job.upperPredictionId = response.id;
      job.processingTime = processingTime;
      job.completedAt = new Date();
      job.metadata = {
        creditsUsed: response.creditsUsed || 1,
        category: job.category,
        mode: job.mode,
        originalFashnUrl: fashnResultUrl,
      };

      // Upload result to GCS and use GCS URL as the main result URL
      try {
        this.logger.log(`Uploading result image to GCS for job ${job.id}`);
        const { gcsUrl, key } = await this.s3Service.uploadFromUrl(
          fashnResultUrl as string,
          'fashn-results',
          `outfit_${job.id}.png`,
        );
        
        if (gcsUrl && key) {
          // Use GCS URL as the main result URL
          job.resultImageUrl = gcsUrl;
          job.metadata = {
            ...job.metadata,
            gcsKey: key,
          };
          this.logger.log(`Result uploaded to GCS: ${gcsUrl}`);
        } else {
          // Fallback to FASHN URL if GCS upload failed
          job.resultImageUrl = fashnResultUrl as string;
          this.logger.warn(`GCS upload failed, using FASHN URL`);
        }
      } catch (error) {
        this.logger.error(`Failed to upload to GCS, using FASHN URL:`, error);
        job.resultImageUrl = fashnResultUrl as string;
      }

      // Save to history if requested
      if (job.saveToHistory) {
        const historyEntity = this.fashnHistoryRepository.create({
          userId: job.userId,
          modelImageUrl: job.modelImageUrl,
          upperGarmentUrl: job.outfitImageUrl,
          lowerGarmentUrl: undefined,
          resultImageUrl: job.resultImageUrl,
          predictionId: response.id,
          processingTime: processingTime,
          isSaved: true,
          modelName: 'tryon-v1.6',
          metadata: job.metadata,
        });
        const historyRecord = await this.fashnHistoryRepository.save(historyEntity);
        job.historyId = historyRecord.id;
      }

      await this.fashnJobRepository.save(job);
      this.logger.log(`Job ${job.id} completed successfully in ${processingTime}ms`);

      // Emit completed status via WebSocket
      this.emitJobStatusUpdate(job, 100);
    } else {
      await this.failJob(job.id, job.userId, response.error?.message || 'Try-on failed', processingTime);
    }
  }

  /**
   * Process job with array of garment images (NEW MODE)
   * Combines all garment images into one and sends to FASHN API in auto mode
   */
  private async processGarmentArrayJob(job: FashnJob, startTime: number): Promise<void> {
    job.status = FashnJobStatus.PROCESSING_UPPER;
    await this.fashnJobRepository.save(job);

    // Emit processing status via WebSocket
    this.emitJobStatusUpdate(job, 25);

    this.logger.log(`Job ${job.id}: Combining ${job.garmentUrls.length} garment images`);

    let combinedGarmentUrl: string;
    let combinedGarmentKey: string;

    try {
      // Combine all garment images into one
      const combinedBuffer = await this.s3Service.combineMultipleGarmentImages(
        job.garmentUrls,
      );

      // Upload combined image to GCS
      const uploadResult = await this.s3Service.uploadBuffer(
        combinedBuffer,
        'fashn-combined-garments',
        `combined-garments-${Date.now()}.png`,
      );

      combinedGarmentUrl = uploadResult.gcsUrl;
      combinedGarmentKey = uploadResult.key;

      this.logger.log(`Job ${job.id}: Combined garment uploaded to ${combinedGarmentUrl}`);
    } catch (error) {
      this.logger.error(`Job ${job.id}: Error combining garments:`, error);
      await this.failJob(
        job.id,
        job.userId,
        `Failed to combine garment images: ${error.message}`,
        Date.now() - startTime,
      );
      return;
    }

    // Emit progress (50%)
    this.emitJobStatusUpdate(job, 50);

    this.logger.log(`Job ${job.id}: Processing combined garment with FASHN API (auto mode)`);

    // Call FASHN API with combined garment image
    const response = await this.fashnClient.predictions.subscribe({
      model_name: 'tryon-v1.6',
      inputs: {
        model_image: job.modelImageUrl,
        garment_image: combinedGarmentUrl,
        category: 'auto', // Always use auto mode for combined garments
        seed: job.seed,
        mode: job.mode as 'performance' | 'balanced' | 'quality',
        output_format: 'png',
      },
    });

    const processingTime = Date.now() - startTime;

    if (response.status === 'completed' && response.output) {
      const fashnResultUrl = Array.isArray(response.output) ? response.output[0] : response.output;

      // Upload result to GCS
      const { gcsUrl: gcsResultUrl } = await this.s3Service.uploadFromUrl(
        fashnResultUrl as string,
        'fashn-results',
      );

      job.status = FashnJobStatus.COMPLETED;
      job.upperPredictionId = response.id;
      job.processingTime = processingTime;
      job.completedAt = new Date();
      job.metadata = {
        creditsUsed: response.creditsUsed || 1,
        fashnApiCalls: 1,
        combinedGarmentUrl,
        combinedGarmentKey,
        garmentCount: job.garmentUrls.length,
        originalFashnUrl: fashnResultUrl,
      };
      job.resultImageUrl = gcsResultUrl;

      // Save to history if requested
      if (job.saveToHistory) {
        const historyEntity = this.fashnHistoryRepository.create({
          userId: job.userId,
          modelImageUrl: job.modelImageUrl,
          garmentUrls: job.garmentUrls,
          upperGarmentUrl: undefined,
          lowerGarmentUrl: undefined,
          resultImageUrl: job.resultImageUrl,
          predictionId: response.id,
          processingTime: processingTime,
          category: 'auto',
          isSaved: true,
          modelName: 'tryon-v1.6',
          metadata: job.metadata,
        });
        const historyRecord = await this.fashnHistoryRepository.save(historyEntity);
        job.historyId = historyRecord.id;
      }

      await this.fashnJobRepository.save(job);
      this.logger.log(
        `Job ${job.id} completed successfully in ${processingTime}ms (combined ${job.garmentUrls.length} garments)`,
      );

      // Emit completed status via WebSocket
      this.emitJobStatusUpdate(job, 100);
    } else {
      await this.failJob(
        job.id,
        job.userId,
        response.error?.message || 'Try-on failed',
        processingTime,
      );
    }
  }

  /**
   * Process job with separate upper and lower garments
   * NEW: Combines garments into single image and processes with FASHN once
   */
  private async processUpperLowerJob(job: FashnJob, startTime: number): Promise<void> {
    // Step 1: Combine garment images
    job.status = FashnJobStatus.PROCESSING_UPPER;
    await this.fashnJobRepository.save(job);

    // Emit processing status via WebSocket
    this.emitJobStatusUpdate(job, 25);

    this.logger.log(`Job ${job.id}: Step 1 - Combining upper and lower garment images`);

    let combinedGarmentUrl: string;
    let combinedGarmentKey: string;

    try {
      // Combine the two garment images into one
      const combinedBuffer = await this.s3Service.combineGarmentImages(
        job.upperGarmentUrl,
        job.lowerGarmentUrl,
      );

      // Upload combined image to GCS
      const { gcsUrl, key } = await this.s3Service.uploadBuffer(
        combinedBuffer,
        'garment-combinations',
        `outfit_${job.id}.png`,
      );

      combinedGarmentUrl = gcsUrl;
      combinedGarmentKey = key;

      this.logger.log(`Job ${job.id}: Combined garment uploaded to: ${combinedGarmentUrl}`);
    } catch (error) {
      await this.failJob(
        job.id,
        job.userId,
        `Failed to combine garment images: ${error.message || 'Unknown error'}`,
        Date.now() - startTime,
      );
      return;
    }

    // Step 2: Process with FASHN using combined garment (single API call)
    job.status = FashnJobStatus.PROCESSING_LOWER;
    await this.fashnJobRepository.save(job);

    // Emit processing status via WebSocket
    this.emitJobStatusUpdate(job, 50);

    this.logger.log(`Job ${job.id}: Step 2 - Processing combined outfit with FASHN`);

    const lowerResponse = await this.fashnClient.predictions.subscribe({
      model_name: 'tryon-v1.6',
      inputs: {
        model_image: job.modelImageUrl,
        garment_image: combinedGarmentUrl,
        category: 'auto', // Let FASHN auto-detect the garment type
        seed: job.seed,
        mode: job.mode as 'performance' | 'balanced' | 'quality',
        output_format: 'png',
      },
    });

    const processingTime = Date.now() - startTime;

    if (lowerResponse.status === 'completed' && lowerResponse.output) {
      const fashnResultUrl = Array.isArray(lowerResponse.output)
        ? lowerResponse.output[0]
        : lowerResponse.output;

      job.status = FashnJobStatus.COMPLETED;
      job.lowerPredictionId = lowerResponse.id;
      job.processingTime = processingTime;
      job.completedAt = new Date();
      job.metadata = {
        predictionId: lowerResponse.id,
        creditsUsed: lowerResponse.creditsUsed || 1,
        mode: job.mode,
        category: 'auto',
        originalFashnUrl: fashnResultUrl,
        combinedGarmentUrl,
        combinedGarmentKey,
        approach: 'combined-single-call',
      };

      // Upload result to GCS and use GCS URL as the main result URL
      try {
        this.logger.log(`Uploading result image to GCS for job ${job.id}`);
        const { gcsUrl, key } = await this.s3Service.uploadFromUrl(
          fashnResultUrl as string,
          'fashn-results',
          `combined_${job.id}.png`,
        );
        
        if (gcsUrl && key) {
          // Use GCS URL as the main result URL
          job.resultImageUrl = gcsUrl;
          job.metadata = {
            ...job.metadata,
            gcsKey: key,
          };
          this.logger.log(`Result uploaded to GCS: ${gcsUrl}`);
        } else {
          // Fallback to FASHN URL if GCS upload failed
          job.resultImageUrl = fashnResultUrl as string;
          this.logger.warn(`GCS upload failed, using FASHN URL`);
        }
      } catch (error) {
        this.logger.error(`Failed to upload to GCS, using FASHN URL:`, error);
        job.resultImageUrl = fashnResultUrl as string;
      }

      // Save to history if requested
      if (job.saveToHistory) {
        const historyEntity = this.fashnHistoryRepository.create({
          userId: job.userId,
          modelImageUrl: job.modelImageUrl,
          upperGarmentUrl: job.upperGarmentUrl,
          lowerGarmentUrl: job.lowerGarmentUrl,
          resultImageUrl: job.resultImageUrl,
          predictionId: lowerResponse.id,
          processingTime: processingTime,
          isSaved: true,
          modelName: 'tryon-v1.6',
          metadata: job.metadata,
        });
        const historyRecord = await this.fashnHistoryRepository.save(historyEntity);
        job.historyId = historyRecord.id;
      }

      await this.fashnJobRepository.save(job);
      this.logger.log(`Job ${job.id} completed successfully in ${processingTime}ms`);

      // Emit completed status via WebSocket
      this.emitJobStatusUpdate(job, 100);
    } else {
      await this.failJob(
        job.id,
        job.userId,
        `Lower garment try-on failed: ${lowerResponse.error?.message || 'Unknown error'}`,
        processingTime,
      );
    }
  }

  /**
   * Mark a job as failed
   */
  private async failJob(jobId: string, userId: string, errorMessage: string, processingTime: number): Promise<void> {
    this.logger.error(`Job ${jobId} failed: ${errorMessage}`);

    await this.fashnJobRepository.update(jobId, {
      status: FashnJobStatus.FAILED,
      errorMessage,
      processingTime,
      completedAt: new Date(),
    });

    // Emit failed status via WebSocket
    this.fashnJobsGateway.emitJobFailed({
      jobId,
      userId,
      status: FashnJobStatus.FAILED,
      progress: 0,
      errorMessage,
      processingTime,
      completedAt: new Date(),
    });
  }

  /**
   * Helper method to emit job status updates via WebSocket
   */
  private emitJobStatusUpdate(job: FashnJob, progress: number): void {
    this.fashnJobsGateway.emitJobUpdate({
      jobId: job.id,
      userId: job.userId,
      status: job.status,
      progress,
      resultImageUrl: job.resultImageUrl,
      upperResultUrl: job.upperResultUrl,
      processingTime: job.processingTime,
      errorMessage: job.errorMessage,
      historyId: job.historyId,
      completedAt: job.completedAt,
      metadata: job.metadata,
    });
  }

  /**
   * Get job status
   */
  async getJobStatus(userId: string, jobId: string): Promise<FashnJobStatusResponseDto> {
    const job = await this.fashnJobRepository.findOne({
      where: { id: jobId, userId },
    });

    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    // Calculate progress based on status
    let progress = 0;
    switch (job.status) {
      case FashnJobStatus.PENDING:
        progress = 0;
        break;
      case FashnJobStatus.PROCESSING_UPPER:
        progress = 25;
        break;
      case FashnJobStatus.PROCESSING_LOWER:
        progress = 75;
        break;
      case FashnJobStatus.COMPLETED:
        progress = 100;
        break;
      case FashnJobStatus.FAILED:
        progress = 0;
        break;
    }

    return {
      jobId: job.id,
      status: job.status,
      progress,
      resultImageUrl: job.resultImageUrl,
      upperResultUrl: job.upperResultUrl,
      processingTime: job.processingTime,
      errorMessage: job.errorMessage,
      historyId: job.historyId,
      garmentUrls: job.garmentUrls,
      upperGarmentUrl: job.upperGarmentUrl,
      lowerGarmentUrl: job.lowerGarmentUrl,
      modelImageUrl: job.modelImageUrl,
      createdAt: job.createdAt,
      completedAt: job.completedAt,
      metadata: job.metadata,
    };
  }

  /**
   * Get all jobs for a user
   */
  async getUserJobs(
    userId: string,
    status?: FashnJobStatus,
    limit = 20,
  ): Promise<FashnJobStatusResponseDto[]> {
    const where: { userId: string; status?: FashnJobStatus } = { userId };
    if (status) {
      where.status = status;
    }

    const jobs = await this.fashnJobRepository.find({
      where,
      order: { createdAt: 'DESC' },
      take: limit,
    });

    return jobs.map((job) => {
      let progress = 0;
      switch (job.status) {
        case FashnJobStatus.PENDING:
          progress = 0;
          break;
        case FashnJobStatus.PROCESSING_UPPER:
          progress = 25;
          break;
        case FashnJobStatus.PROCESSING_LOWER:
          progress = 75;
          break;
        case FashnJobStatus.COMPLETED:
          progress = 100;
          break;
        case FashnJobStatus.FAILED:
          progress = 0;
          break;
      }

      return {
        jobId: job.id,
        status: job.status,
        progress,
        resultImageUrl: job.resultImageUrl,
        upperResultUrl: job.upperResultUrl,
        processingTime: job.processingTime,
        errorMessage: job.errorMessage,
        historyId: job.historyId,
        createdAt: job.createdAt,
        completedAt: job.completedAt,
        metadata: job.metadata,
      };
    });
  }

  /**
   * Cancel a pending job
   */
  async cancelJob(userId: string, jobId: string): Promise<void> {
    const job = await this.fashnJobRepository.findOne({
      where: { id: jobId, userId },
    });

    if (!job) {
      throw new NotFoundException(`Job ${jobId} not found`);
    }

    if (job.status === FashnJobStatus.COMPLETED || job.status === FashnJobStatus.FAILED) {
      throw new BadRequestException(`Cannot cancel job with status: ${job.status}`);
    }

    job.status = FashnJobStatus.FAILED;
    job.errorMessage = 'Job cancelled by user';
    job.completedAt = new Date();
    await this.fashnJobRepository.save(job);

    this.logger.log(`Job ${jobId} cancelled by user ${userId}`);
  }
}

