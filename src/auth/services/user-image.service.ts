import { Injectable, Logger, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UserImage } from '../../database/entities/user-image.entity';
import { UploadUserImageDto, UserImageResponseDto } from '../dto/user-image.dto';

@Injectable()
export class UserImageService {
  private readonly logger = new Logger(UserImageService.name);

  constructor(
    @InjectRepository(UserImage)
    private readonly userImageRepository: Repository<UserImage>,
  ) {}

  /**
   * Upload a new user image
   */
  async uploadImage(
    userId: string,
    uploadDto: UploadUserImageDto,
  ): Promise<UserImageResponseDto> {
    this.logger.log(`Uploading new image for user ${userId}`);

    // If this should be the default, unset all other defaults first
    if (uploadDto.isDefault) {
      await this.userImageRepository.update(
        { userId, isDefault: true },
        { isDefault: false },
      );
    }

    // Check if user has no images yet, make this the default
    const existingCount = await this.userImageRepository.count({
      where: { userId },
    });

    const isFirstImage = existingCount === 0;

    const userImage = this.userImageRepository.create({
      userId,
      imageUrl: uploadDto.imageUrl,
      gcsKey: uploadDto.gcsKey,
      description: uploadDto.description,
      isDefault: uploadDto.isDefault || isFirstImage, // First image is always default
    });

    const saved = await this.userImageRepository.save(userImage);
    this.logger.log(`Image uploaded successfully: ${saved.id}`);

    return this.toResponseDto(saved);
  }

  /**
   * Get all images for a user
   */
  async getUserImages(userId: string): Promise<UserImageResponseDto[]> {
    const images = await this.userImageRepository.find({
      where: { userId },
      order: { isDefault: 'DESC', createdAt: 'DESC' },
    });

    return images.map((img) => this.toResponseDto(img));
  }

  /**
   * Get user's default image
   */
  async getDefaultImage(userId: string): Promise<UserImageResponseDto | null> {
    const defaultImage = await this.userImageRepository.findOne({
      where: { userId, isDefault: true },
    });

    return defaultImage ? this.toResponseDto(defaultImage) : null;
  }

  /**
   * Set an image as default
   */
  async setDefaultImage(
    userId: string,
    imageId: string,
  ): Promise<UserImageResponseDto> {
    // Check if image exists and belongs to user
    const image = await this.userImageRepository.findOne({
      where: { id: imageId, userId },
    });

    if (!image) {
      throw new NotFoundException(`Image ${imageId} not found`);
    }

    // Unset all other defaults
    await this.userImageRepository.update(
      { userId, isDefault: true },
      { isDefault: false },
    );

    // Set this one as default
    image.isDefault = true;
    const updated = await this.userImageRepository.save(image);

    this.logger.log(`Set image ${imageId} as default for user ${userId}`);

    return this.toResponseDto(updated);
  }

  /**
   * Delete a user image
   */
  async deleteImage(userId: string, imageId: string): Promise<void> {
    const image = await this.userImageRepository.findOne({
      where: { id: imageId, userId },
    });

    if (!image) {
      throw new NotFoundException(`Image ${imageId} not found`);
    }

    const wasDefault = image.isDefault;

    await this.userImageRepository.remove(image);
    this.logger.log(`Deleted image ${imageId} for user ${userId}`);

    // If deleted image was default, set another as default
    if (wasDefault) {
      const remainingImages = await this.userImageRepository.find({
        where: { userId },
        order: { createdAt: 'DESC' },
        take: 1,
      });

      if (remainingImages.length > 0) {
        remainingImages[0].isDefault = true;
        await this.userImageRepository.save(remainingImages[0]);
        this.logger.log(
          `Set image ${remainingImages[0].id} as new default for user ${userId}`,
        );
      }
    }
  }

  /**
   * Convert entity to DTO
   */
  private toResponseDto(image: UserImage): UserImageResponseDto {
    return {
      id: image.id,
      imageUrl: image.imageUrl,
      gcsKey: image.gcsKey,
      isDefault: image.isDefault,
      description: image.description,
      createdAt: image.createdAt,
      updatedAt: image.updatedAt,
    };
  }
}

