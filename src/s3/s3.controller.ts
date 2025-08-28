import {
  Controller,
  Post,
  Body,
  HttpCode,
  HttpStatus,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { S3Service } from './s3.service';
import { GeneratePresignedUrlDto } from './dto/generate-presigned-url.dto';
import { GenerateDownloadUrlDto } from './dto/generate-download-url.dto';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../database/entities/user.entity';

@ApiTags('s3')
@ApiBearerAuth()
@Controller('api/s3')
export class S3Controller {
  constructor(private readonly s3Service: S3Service) {}

  @Post('presigned-upload-url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate presigned URL for file upload',
    description:
      'Generate a presigned URL that allows direct file upload to S3. The URL expires after the specified time.',
  })
  @ApiResponse({
    status: 200,
    description: 'Presigned URLs generated successfully',
    schema: {
      type: 'object',
      properties: {
        uploadUrl: {
          type: 'string',
          description: 'Presigned URL for uploading the file to S3',
        },
        downloadUrl: {
          type: 'string',
          description: 'Presigned URL for downloading the file from S3',
        },
        key: {
          type: 'string',
          description: 'S3 object key/path where the file will be stored',
        },
        bucket: {
          type: 'string',
          description: 'S3 bucket name',
        },
        expiresIn: {
          type: 'number',
          description: 'URL expiration time in seconds',
        },
      },
    },
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid file type or size',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - valid JWT token required',
  })
  async generatePresignedUploadUrl(
    @Body() generatePresignedUrlDto: GeneratePresignedUrlDto,
    @CurrentUser() user: User,
  ) {
    const { fileName, fileType, folder, expiresIn, fileSize } =
      generatePresignedUrlDto;

    // Validate file
    const validation = this.s3Service.validateFile(fileType, fileSize);
    if (!validation.isValid) {
      throw new BadRequestException(validation.error);
    }

    // Generate user-specific folder if not provided
    const userFolder = folder || `user-${user.id}`;

    const result = await this.s3Service.generatePresignedUploadUrl({
      fileName,
      fileType,
      folder: userFolder,
      expiresIn,
    });

    return {
      ...result,
      user: {
        id: user.id,
        email: user.email,
      },
      instructions: {
        upload:
          'Use the uploadUrl with a PUT request to upload your file directly to S3',
        download:
          'Use the downloadUrl to access the uploaded file (valid for 24 hours)',
        contentType: 'Make sure to set Content-Type header when uploading',
      },
    };
  }

  @Post('presigned-download-url')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Generate presigned URL for file download',
    description:
      'Generate a presigned URL for downloading a specific file from S3.',
  })
  @ApiResponse({
    status: 200,
    description: 'Download URL generated successfully',
    schema: {
      type: 'object',
      properties: {
        downloadUrl: {
          type: 'string',
          description: 'Presigned URL for downloading the file',
        },
        key: {
          type: 'string',
          description: 'S3 object key',
        },
        expiresIn: {
          type: 'number',
          description: 'URL expiration time in seconds',
        },
        publicUrl: {
          type: 'string',
          description:
            'Public S3 URL (may not be accessible if bucket is private)',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - valid JWT token required',
  })
  async generatePresignedDownloadUrl(
    @Body() generateDownloadUrlDto: GenerateDownloadUrlDto,
    @CurrentUser() user: User,
  ) {
    const { key, expiresIn = 3600 } = generateDownloadUrlDto;

    const downloadUrl = await this.s3Service.generatePresignedDownloadUrl(
      key,
      expiresIn,
    );
    const publicUrl = this.s3Service.getS3ObjectUrl(key);

    return {
      downloadUrl,
      key,
      expiresIn,
      publicUrl,
      user: {
        id: user.id,
        email: user.email,
      },
    };
  }
}
