import {
  Controller,
  Post,
  UploadedFiles,
  UseInterceptors,
  BadRequestException,
  InternalServerErrorException,
  HttpStatus,
  Res,
  Body,
  Logger,
} from '@nestjs/common';
import { FilesInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiConsumes,
  ApiBody,
  ApiProduces,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { VirtualTryOnService } from './virtual-tryon.service';
import { VirtualTryOnDto } from './dto/virtual-tryon.dto';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('virtual-tryon')
@Controller('api/virtual-tryon')
export class VirtualTryOnController {
  private readonly logger = new Logger(VirtualTryOnController.name);

  constructor(private readonly virtualTryOnService: VirtualTryOnService) {}

  @Public()
  @Post('try-on')
  @ApiOperation({
    summary: 'Virtual try-on for garments using IDM-VTON',
    description: 'Upload a person image and garment image to see how the garment looks on the person using IDM-VTON AI model. No authentication required.',
  })
  @ApiConsumes('multipart/form-data')
  @ApiProduces('image/jpeg')
  @ApiBody({
    description: 'Person image and garment image files',
          schema: {
        type: 'object',
        properties: {
          images: {
            type: 'array',
            items: {
              type: 'string',
              format: 'binary',
            },
            description: 'Upload 2 images: 1st = person photo, 2nd = garment photo (JPEG, PNG, WebP)',
            minItems: 2,
            maxItems: 2,
          },
          category: {
            type: 'string',
            enum: ['tops', 'bottoms', 'dresses', 'outerwear', 'general'],
            description: 'Category of the garment',
            default: 'general',
          },
          options: {
            type: 'string',
            description: 'Additional processing options (JSON string)',
            example: '{"preserve_background": true, "fit_adjustment": "normal"}',
          },
        },
        required: ['images'],
      },
  })
  @ApiResponse({
    status: 200,
    description: 'Virtual try-on completed successfully',
    content: {
      'image/jpeg': {
        schema: {
          type: 'string',
          format: 'binary',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid images or missing files',
  })

  @ApiResponse({
    status: 500,
    description: 'Internal server error - processing failed',
  })
  @UseInterceptors(
    FilesInterceptor('images', 2, {
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit per file
        files: 2, // Exactly 2 files required
      },
      fileFilter: (req, file, callback) => {
        if (!file.mimetype.match(/\/(jpg|jpeg|png|webp)$/)) {
          return callback(
            new BadRequestException('Only image files are allowed'),
            false,
          );
        }
        callback(null, true);
      },
    }),
  )
  async virtualTryOn(
    @UploadedFiles() files: Express.Multer.File[],
    @Body() virtualTryOnDto: VirtualTryOnDto,
    @Res() res: Response,
  ) {
    // Validate file uploads
    if (!files || files.length !== 2) {
      throw new BadRequestException('Exactly 2 images are required: first image = person, second image = garment');
    }

    // Simple order-based assignment: first file = person, second file = garment
    const [personImage, garmentImage] = files;
    
    this.logger.log(`Processing virtual try-on: person image (${personImage.originalname}), garment image (${garmentImage.originalname})`);

    try {
      // Validate images
      const validation = await this.virtualTryOnService.validateImages(
        personImage.buffer,
        garmentImage.buffer,
      );

      if (!validation.isValid) {
        throw new BadRequestException(validation.error);
      }

      // Perform virtual try-on
      const result = await this.virtualTryOnService.performVirtualTryOn({
        personImage: personImage.buffer,
        garmentImage: garmentImage.buffer,
        category: virtualTryOnDto.category,
      });

      // Set response headers
      res.set({
        'Content-Type': 'image/jpeg',
        'Content-Length': result.processedImage.length.toString(),
        'Content-Disposition': 'attachment; filename="virtual-tryon-result.jpg"',
        'X-Processing-Time': result.processingTime.toString(),
        'X-Original-Size': `${result.metadata.originalSize.width}x${result.metadata.originalSize.height}`,
        'X-Processed-Size': `${result.metadata.processedSize.width}x${result.metadata.processedSize.height}`,
        'X-Category': result.metadata.category,
      });

      // Log successful processing
      this.logger.log(`Virtual try-on completed in ${result.processingTime}ms`);

      // Send the processed image
      res.status(HttpStatus.OK).send(result.processedImage);
    } catch (error) {
      this.logger.error('Virtual try-on failed:', error);
      
      if (error instanceof BadRequestException) {
        throw error;
      }
      
      throw new InternalServerErrorException(
        `Virtual try-on processing failed: ${error.message}`,
      );
    }
  }
}
