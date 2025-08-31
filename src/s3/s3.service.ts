/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

export interface PresignedUrlResponse {
  uploadUrl: string;
  downloadUrl: string;
  key: string;
  bucket: string;
  expiresIn: number;
}

export interface GeneratePresignedUrlOptions {
  fileName: string;
  fileType: string;
  folder?: string;
  expiresIn?: number; // seconds
}

@Injectable()
export class S3Service {
  private readonly logger = new Logger(S3Service.name);
  private readonly s3Client: S3Client;
  private readonly bucketName: string;

  constructor(private configService: ConfigService) {
    const region = this.configService.get<string>('AWS_REGION', 'us-east-1');
    const bucketName = this.configService.get<string>('AWS_S3_BUCKET');
    const accessKeyId = this.configService.get<string>('AWS_ACCESS_KEY_ID');
    const secretAccessKey = this.configService.get<string>(
      'AWS_SECRET_ACCESS_KEY',
    );

    if (!bucketName) {
      throw new Error('AWS_S3_BUCKET environment variable is required');
    }

    if (!accessKeyId || !secretAccessKey) {
      throw new Error(
        'AWS_ACCESS_KEY_ID and AWS_SECRET_ACCESS_KEY environment variables are required',
      );
    }

    this.bucketName = bucketName;

    this.s3Client = new S3Client({
      region,
      credentials: {
        accessKeyId,
        secretAccessKey,
      },
    });

    this.logger.log(
      `S3 Service initialized for bucket: ${this.bucketName}, region: ${region}`,
    );
  }

  async generatePresignedUploadUrl(
    options: GeneratePresignedUrlOptions,
  ): Promise<PresignedUrlResponse> {
    if (!this.s3Client) {
      throw new Error('S3 service not configured. Please set AWS environment variables.');
    }
    const {
      fileName,
      fileType,
      folder = 'uploads',
      expiresIn = 3600,
    } = options;

    // Generate unique key with timestamp and random string
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 8);
    const sanitizedFileName = fileName.replace(/[^a-zA-Z0-9.-]/g, '_');
    const key = `${folder}/${timestamp}_${randomString}_${sanitizedFileName}`;

    try {
      // Generate presigned URL for upload (PUT)
      const putCommand = new PutObjectCommand({
        Bucket: this.bucketName,
        Key: key,
        ContentType: fileType,
        Metadata: {
          'original-filename': fileName,
          'upload-timestamp': timestamp.toString(),
        },
      });

      const uploadUrl = await getSignedUrl(this.s3Client, putCommand, {
        expiresIn,
      });

      // Generate presigned URL for download (GET)
      const getCommand = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const downloadUrl = await getSignedUrl(this.s3Client, getCommand, {
        expiresIn: expiresIn * 24, // Download URL valid for longer
      });

      this.logger.log(`Generated presigned URLs for key: ${key}`);

      return {
        uploadUrl,
        downloadUrl,
        key,
        bucket: this.bucketName,
        expiresIn,
      };
    } catch (error) {
      this.logger.error('Error generating presigned URLs:', error);
      throw new Error(`Failed to generate presigned URLs: ${error.message}`);
    }
  }

  async generatePresignedDownloadUrl(
    key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    if (!this.s3Client) {
      throw new Error('S3 service not configured. Please set AWS environment variables.');
    }
    try {
      const command = new GetObjectCommand({
        Bucket: this.bucketName,
        Key: key,
      });

      const downloadUrl = await getSignedUrl(this.s3Client, command, {
        expiresIn,
      });

      this.logger.log(`Generated download URL for key: ${key}`);
      return downloadUrl;
    } catch (error) {
      this.logger.error('Error generating download URL:', error);
      throw new Error(`Failed to generate download URL: ${error.message}`);
    }
  }

  /**
   * Validate file type and size constraints
   */
  validateFile(
    fileType: string,
    fileSize?: number,
  ): { isValid: boolean; error?: string } {
    // Allowed file types
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'application/pdf',
      'text/plain',
      'application/json',
    ];

    if (!allowedTypes.includes(fileType)) {
      return {
        isValid: false,
        error: `File type ${fileType} not allowed. Allowed types: ${allowedTypes.join(', ')}`,
      };
    }

    // Max file size: 10MB
    const maxSize = 10 * 1024 * 1024; // 10MB in bytes
    if (fileSize && fileSize > maxSize) {
      return {
        isValid: false,
        error: `File size ${fileSize} bytes exceeds maximum allowed size of ${maxSize} bytes (10MB)`,
      };
    }

    return { isValid: true };
  }

  /**
   * Get S3 object information
   */
  getS3ObjectUrl(key: string): string {
    return `https://${this.bucketName}.s3.amazonaws.com/${key}`;
  }
}
