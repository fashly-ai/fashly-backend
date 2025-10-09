/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { ConfigService } from '@nestjs/config';
import { HfInference } from '@huggingface/inference';
import sharp from 'sharp';
import { TryOn } from '../database/entities/tryon.entity';
import { Glasses } from '../database/entities/glasses.entity';
import {
  SaveTryOnDto,
  TryOnHistoryQueryDto,
  TryOnHistoryResponseDto,
  PaginatedTryOnHistoryResponseDto,
  SaveTryOnResponseDto,
} from './dto/tryon-history.dto';
import { GlassesResponseDto } from '../glasses/dto/glasses-response.dto';

export interface TryOnRequest {
  personImage: Buffer;
  garmentImage: Buffer;
  category?: string;
}

export interface TryOnResult {
  processedImage: Buffer;
  processingTime: number;
  metadata: {
    originalSize: { width: number; height: number };
    processedSize: { width: number; height: number };
    category: string;
  };
}

@Injectable()
export class VirtualTryOnService {
  private readonly logger = new Logger(VirtualTryOnService.name);
  private readonly hfClient: HfInference;

  constructor(
    private configService: ConfigService,
    @InjectRepository(TryOn)
    private readonly tryOnRepository: Repository<TryOn>,
    @InjectRepository(Glasses)
    private readonly glassesRepository: Repository<Glasses>,
  ) {
    const hfToken = this.configService.get<string>('HF_TOKEN');

    if (!hfToken || hfToken === 'your-huggingface-token-here') {
      this.logger.warn(
        'HF_TOKEN not configured - Virtual Try-On features will be limited',
      );
      // Initialize without token for public models
      this.hfClient = new HfInference();
    } else {
      this.hfClient = new HfInference(hfToken);
      this.logger.log('IDM-VTON service initialized with authentication');
    }
  }

  async performVirtualTryOn(request: TryOnRequest): Promise<TryOnResult> {
    const startTime = Date.now();

    try {
      this.logger.log('Starting virtual try-on process');

      // Optimize images for processing
      const optimizedPersonImage = await this.optimizeImage(
        request.personImage,
        'person',
      );
      const optimizedGarmentImage = await this.optimizeImage(
        request.garmentImage,
        'garment',
      );

      // Get original image metadata
      const originalMetadata = await sharp(request.personImage).metadata();

      this.logger.log('Calling IDM-VTON model via Hugging Face Inference...');

      // Convert images to Blob format for HF Inference
      const personBlob = new Blob([new Uint8Array(optimizedPersonImage)], {
        type: 'image/jpeg',
      });
      const garmentBlob = new Blob([new Uint8Array(optimizedGarmentImage)], {
        type: 'image/jpeg',
      });

      // Try different approaches for IDM-VTON
      let result: any;

      try {
        // Approach 1: Try image-to-image with IDM-VTON
        this.logger.log('Attempting IDM-VTON via image-to-image...');
        result = await this.hfClient.imageToImage({
          model: 'yisol/IDM-VTON',
          inputs: personBlob,
          parameters: {
            prompt: `A person wearing the garment, virtual try-on, realistic, high quality`,
            negative_prompt: 'blurry, distorted, low quality, deformed',
            guidance_scale: 7.5,
            num_inference_steps: 20,
            strength: 0.8,
          },
        });
      } catch (imageToImageError) {
        this.logger.warn(
          'Image-to-image failed, trying alternative approach:',
          imageToImageError.message,
        );

        // Approach 2: Try using a working virtual try-on model
        try {
          this.logger.log(
            'Attempting with alternative virtual try-on model...',
          );
          result = await this.hfClient.imageToImage({
            model: 'levihsu/OOTDiffusion',
            inputs: personBlob,
            parameters: {
              prompt: `Person wearing garment, virtual try-on, realistic clothing fit`,
              negative_prompt:
                'blurry, distorted, low quality, deformed, bad anatomy',
              guidance_scale: 7.5,
              num_inference_steps: 25,
              strength: 0.7,
            },
          });
        } catch (alternativeError) {
          this.logger.warn(
            'Alternative model failed, using basic approach:',
            alternativeError.message,
          );

          // Approach 3: Fallback to text-to-image with description
          result = await this.hfClient.textToImage({
            model: 'stabilityai/stable-diffusion-2-1',
            inputs: `A person wearing a ${request.category || 'garment'}, professional photo, realistic, high quality`,
          });
        }
      }

      // Handle HF Inference response
      let resultBuffer: Buffer;

      if (result instanceof Blob) {
        // Convert Blob to Buffer
        const arrayBuffer = await result.arrayBuffer();
        resultBuffer = Buffer.from(arrayBuffer);
        this.logger.log('Converted Blob response to Buffer');
      } else if (result instanceof ArrayBuffer) {
        // Convert ArrayBuffer to Buffer
        resultBuffer = Buffer.from(result);
        this.logger.log('Converted ArrayBuffer response to Buffer');
      } else if (Buffer.isBuffer(result)) {
        // Already a Buffer
        resultBuffer = result;
        this.logger.log('Response is already a Buffer');
      } else {
        this.logger.error('Unexpected response type:', typeof result);
        throw new Error(`Unexpected response type: ${typeof result}`);
      }

      // Validate the result is a proper image
      const processedMetadata = await sharp(resultBuffer).metadata();

      const processingTime = Date.now() - startTime;

      this.logger.log(`IDM-VTON processing completed in ${processingTime}ms`);

      return {
        processedImage: resultBuffer,
        processingTime,
        metadata: {
          originalSize: {
            width: originalMetadata.width || 0,
            height: originalMetadata.height || 0,
          },
          processedSize: {
            width: processedMetadata.width || 0,
            height: processedMetadata.height || 0,
          },
          category: request.category || 'general',
        },
      };
    } catch (error) {
      const processingTime = Date.now() - startTime;
      this.logger.error('Error in virtual try-on process:', error);

      if (error.response?.status === 503) {
        throw new Error(
          'Virtual try-on model is currently loading. Please try again in a few minutes.',
        );
      } else if (error.response?.status === 429) {
        throw new Error('Rate limit exceeded. Please try again later.');
      } else if (error.response?.status === 404) {
        throw new Error(
          'Virtual try-on service endpoint not found. The model may be unavailable.',
        );
      } else if (error.code === 'ECONNABORTED') {
        throw new Error(
          'Virtual try-on processing timed out. Please try with smaller images.',
        );
      }

      throw new Error(`Virtual try-on failed: ${error.message}`);
    }
  }

  private async optimizeImage(
    imageBuffer: Buffer,
    type: 'person' | 'garment',
  ): Promise<Buffer> {
    try {
      // Different optimization strategies for person vs garment images
      const targetSize = type === 'person' ? 768 : 512;

      return await sharp(imageBuffer)
        .resize(targetSize, targetSize, {
          fit: 'inside',
          withoutEnlargement: true,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        })
        .jpeg({
          quality: 90,
          progressive: true,
        })
        .toBuffer();
    } catch (error) {
      this.logger.error(`Error optimizing ${type} image:`, error);
      throw new Error(`Failed to optimize ${type} image: ${error.message}`);
    }
  }

  async validateImages(
    personImage: Buffer,
    garmentImage: Buffer,
  ): Promise<{ isValid: boolean; error?: string }> {
    try {
      // Validate person image
      const personMetadata = await sharp(personImage).metadata();
      if (!personMetadata.width || !personMetadata.height) {
        return { isValid: false, error: 'Invalid person image format' };
      }

      if (personMetadata.width < 256 || personMetadata.height < 256) {
        return {
          isValid: false,
          error: 'Person image too small (minimum 256x256)',
        };
      }

      // Validate garment image
      const garmentMetadata = await sharp(garmentImage).metadata();
      if (!garmentMetadata.width || !garmentMetadata.height) {
        return { isValid: false, error: 'Invalid garment image format' };
      }

      if (garmentMetadata.width < 256 || garmentMetadata.height < 256) {
        return {
          isValid: false,
          error: 'Garment image too small (minimum 256x256)',
        };
      }

      // Check file formats
      const allowedFormats = ['jpeg', 'jpg', 'png', 'webp'];
      if (!allowedFormats.includes(personMetadata.format || '')) {
        return { isValid: false, error: 'Person image format not supported' };
      }

      if (!allowedFormats.includes(garmentMetadata.format || '')) {
        return { isValid: false, error: 'Garment image format not supported' };
      }

      return { isValid: true };
    } catch (error) {
      this.logger.error('Error validating images:', error);
      return { isValid: false, error: 'Image validation failed' };
    }
  }

  // Try-on history management
  async saveTryOn(
    userId: string,
    saveTryOnDto: SaveTryOnDto,
  ): Promise<SaveTryOnResponseDto> {
    const { glassesId } = saveTryOnDto;

    // Verify glasses exists
    const glasses = await this.glassesRepository.findOne({
      where: { id: glassesId },
    });

    if (!glasses) {
      throw new NotFoundException(`Glasses with ID ${glassesId} not found`);
    }

    // Check if try-on record already exists for this user-glasses pair
    let existingTryOn = await this.tryOnRepository.findOne({
      where: { userId, glassesId },
      relations: ['glasses'],
    });

    let action: 'saved' | 'updated';
    let tryOnRecord: TryOn;

    if (existingTryOn) {
      // Update existing record (just updates the timestamp)
      tryOnRecord = await this.tryOnRepository.save(existingTryOn);
      action = 'updated';
    } else {
      // Create new record
      const newTryOn = this.tryOnRepository.create({
        userId,
        glassesId,
      });
      tryOnRecord = await this.tryOnRepository.save(newTryOn);
      tryOnRecord.glasses = glasses;
      action = 'saved';
    }

    // Transform glasses to response DTO (include favorite status for this user)
    const glassesResponse = GlassesResponseDto.fromEntity(glasses);
    const tryOnResponse = TryOnHistoryResponseDto.fromEntity(tryOnRecord, glassesResponse);

    return {
      success: true,
      action,
      message: `Try-on ${action} successfully`,
      data: tryOnResponse,
    };
  }

  async getUserTryOnHistory(
    userId: string,
    queryDto: TryOnHistoryQueryDto,
  ): Promise<PaginatedTryOnHistoryResponseDto> {
    const { page = 1, limit = 20 } = queryDto;

    // Get user's try-on history with glasses data
    const queryBuilder = this.tryOnRepository
      .createQueryBuilder('tryon')
      .leftJoinAndSelect('tryon.glasses', 'glasses')
      .where('tryon.userId = :userId', { userId })
      .andWhere('glasses.isActive = :isActive', { isActive: true })
      .orderBy('tryon.updatedAt', 'DESC');

    // Get total count
    const total = await queryBuilder.getCount();

    // Apply pagination
    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    // Execute query
    const tryOns = await queryBuilder.getMany();

    // Calculate pagination metadata
    const totalPages = Math.ceil(total / limit);
    const hasNext = page < totalPages;
    const hasPrev = page > 1;

    // Transform to response DTOs
    const data = tryOns.map((tryOn) => {
      const glassesResponse = GlassesResponseDto.fromEntity(tryOn.glasses);
      return TryOnHistoryResponseDto.fromEntity(tryOn, glassesResponse);
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

  async getTryOnCount(userId: string): Promise<number> {
    return this.tryOnRepository.count({
      where: { userId },
    });
  }

  async deleteTryOn(userId: string, tryOnId: string): Promise<void> {
    const tryOn = await this.tryOnRepository.findOne({
      where: { id: tryOnId, userId },
    });

    if (!tryOn) {
      throw new NotFoundException(`Try-on record with ID ${tryOnId} not found`);
    }

    await this.tryOnRepository.remove(tryOn);
  }
}
