/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';

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
  private readonly storage: Storage;
  private readonly bucketName: string;

  constructor(private configService: ConfigService) {
    const projectId = this.configService.get<string>('GCP_PROJECT_ID');
    const bucketName = this.configService.get<string>('GCS_BUCKET_NAME');
    const keyFilename = this.configService.get<string>('GCP_KEY_FILE');

    if (!bucketName) {
      throw new Error('GCS_BUCKET_NAME environment variable is required');
    }

    if (!projectId) {
      throw new Error('GCP_PROJECT_ID environment variable is required');
    }

    this.bucketName = bucketName;

    // Initialize Google Cloud Storage
    const storageOptions: {
      projectId: string;
      keyFilename?: string;
    } = {
      projectId,
    };

    // If key file is provided, use it for authentication
    if (keyFilename) {
      storageOptions.keyFilename = keyFilename;
    }
    // Otherwise, use default credentials (e.g., from environment or metadata server)

    this.storage = new Storage(storageOptions);

    this.logger.log(
      `GCS Service initialized for bucket: ${this.bucketName}, project: ${projectId}`,
    );
  }

  async generatePresignedUploadUrl(
    options: GeneratePresignedUrlOptions,
  ): Promise<PresignedUrlResponse> {
    if (!this.storage) {
      throw new Error(
        'GCS service not configured. Please set GCP environment variables.',
      );
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
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(key);

      // Generate presigned URL for upload (PUT)
      const [uploadUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'write',
        expires: Date.now() + expiresIn * 1000,
        contentType: fileType,
        extensionHeaders: {
          'x-goog-meta-original-filename': fileName,
          'x-goog-meta-upload-timestamp': timestamp.toString(),
        },
      });

      // Generate presigned URL for download (GET)
      const [downloadUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + expiresIn * 24 * 1000, // Download URL valid for longer
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
      throw new Error(
        `Failed to generate presigned URLs: ${(error as Error).message}`,
      );
    }
  }

  async generatePresignedDownloadUrl(
    key: string,
    expiresIn: number = 3600,
  ): Promise<string> {
    if (!this.storage) {
      throw new Error(
        'GCS service not configured. Please set GCP environment variables.',
      );
    }
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(key);

      const [downloadUrl] = await file.getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + expiresIn * 1000,
      });

      this.logger.log(`Generated download URL for key: ${key}`);
      return downloadUrl;
    } catch (error) {
      this.logger.error('Error generating download URL:', error);
      throw new Error(
        `Failed to generate download URL: ${(error as Error).message}`,
      );
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
   * Get GCS object public URL
   */
  getGCSObjectUrl(key: string): string {
    return `https://storage.googleapis.com/${this.bucketName}/${key}`;
  }
}
