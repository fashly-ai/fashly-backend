import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Storage } from '@google-cloud/storage';
import axios from 'axios';
import sharp from 'sharp';

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
      this.logger.warn(
        'GCS_BUCKET_NAME not configured - GCS features will be disabled',
      );
      return;
    }

    if (!projectId) {
      this.logger.warn(
        'GCP_PROJECT_ID not configured - GCS features will be disabled',
      );
      return;
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
      this.logger.log(`Using GCP key file: ${keyFilename}`);
    } else {
      this.logger.warn(
        'GCP_KEY_FILE not configured - using default credentials',
      );
    }

    this.storage = new Storage(storageOptions);

    this.logger.log(
      `GCS Service initialized for bucket: ${this.bucketName}, project: ${projectId}`,
    );
  }

  async generatePresignedUploadUrl(
    options: GeneratePresignedUrlOptions,
  ): Promise<PresignedUrlResponse> {
    if (!this.storage || !this.bucketName) {
      throw new Error(
        'GCS service not configured. Please set GCP_PROJECT_ID and GCS_BUCKET_NAME environment variables.',
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
    if (!this.storage || !this.bucketName) {
      throw new Error(
        'GCS service not configured. Please set GCP_PROJECT_ID and GCS_BUCKET_NAME environment variables.',
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
      'image/avif',
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

  /**
   * Upload a buffer to GCS
   */
  async uploadBuffer(
    buffer: Buffer,
    folder: string = 'garment-combinations',
    fileName?: string,
  ): Promise<{ gcsUrl: string; key: string }> {
    if (!this.storage || !this.bucketName) {
      this.logger.warn('GCS service not configured - skipping upload');
      return { gcsUrl: '', key: '' };
    }

    try {
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const name = fileName || `combined_${timestamp}_${randomString}.png`;
      const key = `${folder}/${name}`;

      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(key);

      await file.save(buffer, {
        metadata: {
          contentType: 'image/png',
          metadata: {
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      const gcsUrl = this.getGCSObjectUrl(key);
      this.logger.log(`Buffer uploaded successfully to: ${gcsUrl}`);

      return { gcsUrl, key };
    } catch (error) {
      this.logger.error('Error uploading buffer to GCS:', error);
      throw new Error(
        `Failed to upload buffer: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Combine two garment images (top and bottom) into a single vertical image
   */
  async combineGarmentImages(
    topImageUrl: string,
    bottomImageUrl: string,
  ): Promise<Buffer> {
    try {
      this.logger.log(
        `Combining images: top=${topImageUrl}, bottom=${bottomImageUrl}`,
      );

      // Download both images
      const [topResponse, bottomResponse] = await Promise.all([
        axios.get<ArrayBuffer>(topImageUrl, { responseType: 'arraybuffer' }),
        axios.get<ArrayBuffer>(bottomImageUrl, { responseType: 'arraybuffer' }),
      ]);

      const topBuffer = Buffer.from(topResponse.data);
      const bottomBuffer = Buffer.from(bottomResponse.data);

      // Get metadata of both images
      const topMetadata = await sharp(topBuffer).metadata();
      const bottomMetadata = await sharp(bottomBuffer).metadata();

      // Calculate dimensions for combined image
      const maxWidth = Math.max(topMetadata.width || 0, bottomMetadata.width || 0);
      const totalHeight = (topMetadata.height || 0) + (bottomMetadata.height || 0);

      // Resize images to same width if needed
      const topResized = await sharp(topBuffer)
        .resize(maxWidth, topMetadata.height, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .toBuffer();

      const bottomResized = await sharp(bottomBuffer)
        .resize(maxWidth, bottomMetadata.height, { fit: 'contain', background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .toBuffer();

      // Combine images vertically
      const combinedImage = await sharp({
        create: {
          width: maxWidth,
          height: totalHeight,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
      })
        .composite([
          { input: topResized, top: 0, left: 0 },
          { input: bottomResized, top: topMetadata.height || 0, left: 0 },
        ])
        .png()
        .toBuffer();

      this.logger.log(
        `Successfully combined images: ${maxWidth}x${totalHeight}`,
      );

      return combinedImage;
    } catch (error) {
      this.logger.error('Error combining garment images:', error);
      throw new Error(
        `Failed to combine images: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Combine multiple garment images vertically into a single image
   * Supports any number of images (1 or more)
   */
  async combineMultipleGarmentImages(imageUrls: string[]): Promise<Buffer> {
    this.logger.log(`Combining ${imageUrls.length} garment images...`);

    if (imageUrls.length === 0) {
      throw new Error('No images provided to combine');
    }

    if (imageUrls.length === 1) {
      // If only one image, just download and return it
      this.logger.log('Only one image, downloading directly...');
      const response = await axios.get(imageUrls[0], {
        responseType: 'arraybuffer',
      });
      return Buffer.from(response.data);
    }

    try {
      // Download all images in parallel
      this.logger.log(`Downloading ${imageUrls.length} images...`);
      const responses = await Promise.all(
        imageUrls.map((url) =>
          axios.get(url, { responseType: 'arraybuffer' }),
        ),
      );

      const imageBuffers = responses.map((response) =>
        Buffer.from(response.data),
      );

      // Get metadata for all images
      const metadatas = await Promise.all(
        imageBuffers.map((buffer) => sharp(buffer).metadata()),
      );

      // Determine target width (use the largest width)
      const maxWidth = Math.max(...metadatas.map((m) => m.width || 0));
      this.logger.log(`Target width: ${maxWidth}px`);

      // Resize all images to the same width while maintaining aspect ratio
      const resizedBuffers = await Promise.all(
        imageBuffers.map((buffer, index) =>
          sharp(buffer)
            .resize(maxWidth, metadatas[index].height, {
              fit: 'contain',
              background: { r: 255, g: 255, b: 255, alpha: 1 },
            })
            .toBuffer(),
        ),
      );

      // Get heights after resize
      const resizedMetadatas = await Promise.all(
        resizedBuffers.map((buffer) => sharp(buffer).metadata()),
      );

      const totalHeight = resizedMetadatas.reduce(
        (sum, meta) => sum + (meta.height || 0),
        0,
      );
      this.logger.log(`Total height: ${totalHeight}px`);

      // Create composite array with proper positioning
      let currentTop = 0;
      const compositeInputs = resizedBuffers.map((buffer, index) => {
        const input = {
          input: buffer,
          top: currentTop,
          left: 0,
        };
        currentTop += resizedMetadatas[index].height || 0;
        return input;
      });

      // Create a blank canvas and composite all images
      const combinedImage = await sharp({
        create: {
          width: maxWidth,
          height: totalHeight,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 1 },
        },
      })
        .composite(compositeInputs)
        .png()
        .toBuffer();

      this.logger.log(
        `Successfully combined ${imageUrls.length} images: ${maxWidth}x${totalHeight}`,
      );

      return combinedImage;
    } catch (error) {
      this.logger.error('Error combining multiple garment images:', error);
      throw new Error(
        `Failed to combine multiple images: ${(error as Error).message}`,
      );
    }
  }

  /**
   * Upload an image from a URL to GCS
   * Downloads the image and uploads it to Google Cloud Storage
   */
  async uploadFromUrl(
    imageUrl: string,
    folder: string = 'fashn-results',
    customFileName?: string,
  ): Promise<{ gcsUrl: string; key: string }> {
    if (!this.storage || !this.bucketName) {
      this.logger.warn('GCS service not configured - skipping upload');
      return { gcsUrl: imageUrl, key: '' }; // Return original URL if GCS not configured
    }

    try {
      this.logger.log(`Downloading image from: ${imageUrl}`);

      // Download the image
      const response = await axios.get<ArrayBuffer>(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30 second timeout
      });

      const buffer = Buffer.from(response.data);
      const contentType =
        (response.headers['content-type'] as string) || 'image/png';

      // Generate unique key
      const timestamp = Date.now();
      const randomString = Math.random().toString(36).substring(2, 8);
      const extension =
        contentType.includes('jpeg') || contentType.includes('jpg')
          ? 'jpg'
          : contentType.includes('png')
            ? 'png'
            : contentType.includes('webp')
              ? 'webp'
              : 'png';

      const fileName =
        customFileName || `result_${timestamp}_${randomString}.${extension}`;
      const key = `${folder}/${fileName}`;

      // Upload to GCS
      const bucket = this.storage.bucket(this.bucketName);
      const file = bucket.file(key);

      await file.save(buffer, {
        metadata: {
          contentType,
          metadata: {
            originalUrl: imageUrl,
            uploadedAt: new Date().toISOString(),
          },
        },
      });

      // Note: With uniform bucket-level access, file permissions are managed at bucket level
      // To make files publicly accessible, configure bucket IAM permissions in GCP Console

      const gcsUrl = this.getGCSObjectUrl(key);
      this.logger.log(`Image uploaded successfully to: ${gcsUrl}`);

      return { gcsUrl, key };
    } catch (error) {
      this.logger.error(`Error uploading image from URL:`, error);
      // Return original URL if upload fails
      return { gcsUrl: imageUrl, key: '' };
    }
  }
}
