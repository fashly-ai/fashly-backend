import {
  Controller,
  Post,
  Get,
  Body,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  BadRequestException,
  NotFoundException,
  Res,
  StreamableFile,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiConsumes,
  ApiBody,
} from '@nestjs/swagger';
import fetch from 'node-fetch';
import { ComfyUIService } from './comfyui.service';
import { GlassTryOnHistoryService } from './glass-tryon-history.service';
import {
  Image2ImageDto,
  Image2ImageResponseDto,
  ComfyHealthResponseDto,
  ComfyQueueResponseDto,
} from './dto/image2image.dto';
import { ImageUploadDto } from './dto/image-upload.dto';
import { ProcessGlassDto } from './dto/process-glass.dto';
import { GlassTryOnHistoryResponseDto } from './dto/glass-tryon-history.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { Public } from '../auth/decorators/public.decorator';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../database/entities/user.entity';
import { Glasses } from '../database/entities/glasses.entity';

@ApiTags('comfyui')
@Controller('api/comfyui')
export class ComfyUIController {
  constructor(
    private readonly comfyUIService: ComfyUIService,
    private readonly glassTryOnHistoryService: GlassTryOnHistoryService,
    @InjectRepository(Glasses)
    private readonly glassesRepository: Repository<Glasses>,
  ) {}

  @Public()
  @Post('image2image')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Process image with ComfyUI image2image workflow',
    description:
      'Submit an image to ComfyUI for processing using the image2image workflow. Returns the processed image as base64.',
  })
  @ApiResponse({
    status: 200,
    description: 'Image processed successfully',
    type: Image2ImageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 500,
    description: 'ComfyUI processing failed',
  })
  @ApiResponse({
    status: 503,
    description: 'ComfyUI service unavailable',
  })
  async processImage2Image(
    @Body() dto: Image2ImageDto,
  ): Promise<Image2ImageResponseDto> {
    const startTime = Date.now();

    // Extract base64 data from data URL if present
    let imageBase64 = dto.image;
    if (imageBase64.startsWith('data:')) {
      imageBase64 = imageBase64.split(',')[1];
    }

    // Run the workflow
    const result = await this.comfyUIService.runImage2ImageWorkflow(
      imageBase64,
      dto.prompt,
      dto.negativePrompt,
      dto.seed,
    );

    const processingTime = Date.now() - startTime;

    // Convert buffer to base64
    const outputBase64 = `data:image/png;base64,${result.buffer.toString('base64')}`;

    return {
      promptId: result.promptId,
      filename: result.filename,
      imageBase64: outputBase64,
      size: result.buffer.length,
      processingTime,
    };
  }

  @Public()
  @Post('upload')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Process image with file upload',
    description:
      'Upload an image file directly for processing using the image2image workflow. Supports JPG, PNG, WebP formats.',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['image'],
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Image file to process',
        },
        prompt: {
          type: 'string',
          example:
            'photograph of victorian woman with wings, sky clouds, meadow grass',
          description: 'Positive prompt for image generation',
        },
        negativePrompt: {
          type: 'string',
          example: 'blurry, low quality, distorted',
          description: 'Negative prompt',
        },
        seed: {
          type: 'number',
          example: 42,
          description: 'Random seed for reproducibility',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Image processed successfully',
    type: Image2ImageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or missing image',
  })
  @ApiResponse({
    status: 500,
    description: 'ComfyUI processing failed',
  })
  async uploadAndProcessImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ImageUploadDto,
  ): Promise<Image2ImageResponseDto> {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    // Validate file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/avif',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed types: JPG, PNG, WebP, GIF, AVIF',
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException(
        'File size too large. Maximum size is 10MB',
      );
    }

    const startTime = Date.now();

    // Convert file buffer to base64
    const imageBase64 = file.buffer.toString('base64');

    // Set default values if not provided
    const prompt =
      dto.prompt || 'high quality photograph, professional, detailed';
    const negativePrompt =
      dto.negativePrompt || 'blurry, low quality, distorted';
    const seed =
      dto.seed !== undefined
        ? dto.seed
        : Math.floor(Math.random() * 2147483647);

    // Run the workflow
    const result = await this.comfyUIService.runImage2ImageWorkflow(
      imageBase64,
      prompt,
      negativePrompt,
      seed,
    );

    const processingTime = Date.now() - startTime;

    // Convert buffer to base64
    const outputBase64 = `data:image/png;base64,${result.buffer.toString('base64')}`;

    return {
      promptId: result.promptId,
      filename: result.filename,
      imageBase64: outputBase64,
      size: result.buffer.length,
      processingTime,
    };
  }

  @UseGuards(JwtAuthGuard)
  @Post('process-glass')
  @HttpCode(HttpStatus.OK)
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Process glass image with ComfyUI and save to history',
    description:
      'Fetch a glass by ID, extract the D_45 image from allImages, process it through ComfyUI using the image2image workflow, and automatically save to history with savedTryOn=false.',
  })
  @ApiResponse({
    status: 200,
    description: 'Glass image processed and saved to history successfully',
    type: GlassTryOnHistoryResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid glass ID or no D_45 image found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({
    status: 404,
    description: 'Glass not found',
  })
  @ApiResponse({
    status: 500,
    description: 'ComfyUI processing failed',
  })
  async processGlassImage(
    @Body() dto: ProcessGlassDto,
    @CurrentUser() user: User,
  ): Promise<GlassTryOnHistoryResponseDto> {
    const startTime = Date.now();

    // 1. Fetch the glass from database
    const glass = await this.glassesRepository.findOne({
      where: { id: dto.glassId },
    });

    if (!glass) {
      throw new NotFoundException(`Glass with ID ${dto.glassId} not found`);
    }

    // 2. Parse allImages and find the _D_45.jpg image
    let allImages: string[] = [];
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const parsed = glass.allImages ? JSON.parse(glass.allImages) : [];
      allImages = parsed as string[];
    } catch {
      throw new BadRequestException('Invalid allImages format in glass data');
    }

    const d45Image = allImages.find((url) => url.includes('_D_45.jpg'));
    if (!d45Image) {
      throw new BadRequestException(
        `No _D_45.jpg image found in glass ${glass.name}. Available images: ${allImages.length}`,
      );
    }

    // 3. Download the image from URL
    let imageBuffer: Buffer;
    try {
      const response = await fetch(d45Image);
      if (!response.ok) {
        throw new Error(
          `Failed to download image: ${response.status} ${response.statusText}`,
        );
      }
      imageBuffer = Buffer.from(await response.arrayBuffer());
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to download image from URL: ${errorMessage}`,
      );
    }

    // 4. Convert to base64
    const imageBase64 = imageBuffer.toString('base64');

    // 5. Set default values if not provided
    const prompt =
      dto.prompt || 'person wearing eyeglasses, professional photo, clear face';
    const negativePrompt =
      dto.negativePrompt || 'blurry, low quality, distorted, cropped face';
    const seed =
      dto.seed !== undefined
        ? dto.seed
        : Math.floor(Math.random() * 2147483647);

    // 6. Run the workflow
    const result = await this.comfyUIService.runImage2ImageWorkflow(
      imageBase64,
      prompt,
      negativePrompt,
      seed,
    );

    const processingTime = Date.now() - startTime;

    // 7. Convert buffer to base64
    const outputBase64 = `data:image/png;base64,${result.buffer.toString('base64')}`;

    // 8. Save to glass try-on history with savedTryOn = false and return the history record
    const historyResponse = await this.glassTryOnHistoryService.saveGlassTryOn(
      user.id,
      {
        promptId: result.promptId,
        glassId: dto.glassId,
        resultImageBase64: outputBase64,
        filename: result.filename,
        processingTime,
        imageSize: result.buffer.length,
        prompt,
        negativePrompt,
        seed,
      },
    );

    // Return the history record (which includes the id for later updating savedTryOn)
    return historyResponse.data;
  }

  @Public()
  @Post('upload-download')
  @HttpCode(HttpStatus.OK)
  @UseInterceptors(FileInterceptor('image'))
  @ApiConsumes('multipart/form-data')
  @ApiOperation({
    summary: 'Process image and download result',
    description:
      'Upload an image file for processing and directly download the result as an image file (not base64).',
  })
  @ApiBody({
    schema: {
      type: 'object',
      required: ['image'],
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'Image file to process',
        },
        prompt: {
          type: 'string',
          example:
            'photograph of victorian woman with wings, sky clouds, meadow grass',
          description: 'Positive prompt for image generation',
        },
        negativePrompt: {
          type: 'string',
          example: 'blurry, low quality, distorted',
          description: 'Negative prompt',
        },
        seed: {
          type: 'number',
          example: 42,
          description: 'Random seed for reproducibility',
        },
      },
    },
  })
  @ApiResponse({
    status: 200,
    description: 'Image file download',
    content: {
      'image/png': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file or missing image',
  })
  @ApiResponse({
    status: 500,
    description: 'ComfyUI processing failed',
  })
  async uploadAndDownloadImage(
    @UploadedFile() file: Express.Multer.File,
    @Body() dto: ImageUploadDto,
    @Res({ passthrough: true }) res: Response,
  ): Promise<StreamableFile> {
    if (!file) {
      throw new BadRequestException('Image file is required');
    }

    // Validate file type
    const allowedMimeTypes = [
      'image/jpeg',
      'image/png',
      'image/webp',
      'image/gif',
      'image/avif',
    ];
    if (!allowedMimeTypes.includes(file.mimetype)) {
      throw new BadRequestException(
        'Invalid file type. Allowed types: JPG, PNG, WebP, GIF, AVIF',
      );
    }

    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      throw new BadRequestException(
        'File size too large. Maximum size is 10MB',
      );
    }

    // Convert file buffer to base64
    const imageBase64 = file.buffer.toString('base64');

    // Set default values if not provided
    const prompt =
      dto.prompt || 'high quality photograph, professional, detailed';
    const negativePrompt =
      dto.negativePrompt || 'blurry, low quality, distorted';
    const seed =
      dto.seed !== undefined
        ? dto.seed
        : Math.floor(Math.random() * 2147483647);

    // Run the workflow
    const result = await this.comfyUIService.runImage2ImageWorkflow(
      imageBase64,
      prompt,
      negativePrompt,
      seed,
    );

    // Set response headers for file download
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': `attachment; filename="${result.filename}"`,
      'X-Prompt-Id': result.promptId,
      'X-Processing-Time': Date.now().toString(),
    });

    // Return the image buffer as a streamable file
    return new StreamableFile(result.buffer);
  }

  @Public()
  @Get('health')
  @ApiOperation({
    summary: 'Check ComfyUI service health',
    description: 'Check if the ComfyUI service is running and accessible',
  })
  @ApiResponse({
    status: 200,
    description: 'ComfyUI service status',
    type: ComfyHealthResponseDto,
  })
  async checkHealth(): Promise<ComfyHealthResponseDto> {
    const healthy = await this.comfyUIService.healthCheck();

    return {
      healthy,
      url: this.comfyUIService['comfyUrl'],
      timestamp: new Date().toISOString(),
    };
  }

  @Public()
  @Get('queue')
  @ApiOperation({
    summary: 'Get ComfyUI queue status',
    description: 'Get the current queue status and pending jobs',
  })
  @ApiResponse({
    status: 200,
    description: 'Queue status retrieved successfully',
    type: ComfyQueueResponseDto,
  })
  async getQueue(): Promise<ComfyQueueResponseDto> {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const queue = await this.comfyUIService.getQueue();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const runningLength: number = queue.queue_running?.length || 0;
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
    const pendingLength: number = queue.queue_pending?.length || 0;
    const queueLength: number = runningLength + pendingLength;

    return {
      queueLength,
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      queue,
    };
  }

  @ApiBearerAuth('JWT-auth')
  @UseGuards(JwtAuthGuard)
  @Get('stats')
  @ApiOperation({
    summary: 'Get ComfyUI system stats',
    description: 'Get system statistics from ComfyUI (requires authentication)',
  })
  @ApiResponse({
    status: 200,
    description: 'System stats retrieved successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getSystemStats(): Promise<any> {
    return this.comfyUIService.getSystemStats();
  }
}
