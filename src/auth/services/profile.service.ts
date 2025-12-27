import { Injectable, Logger, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from '../../database/entities/user.entity';
import { UpdateProfileDto, ProfileResponseDto, UpdateProfileResponseDto } from '../dto/profile.dto';
import { UserImageService } from './user-image.service';

@Injectable()
export class ProfileService {
  private readonly logger = new Logger(ProfileService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    private readonly userImageService: UserImageService,
  ) {}

  /**
   * Get user profile by ID
   */
  async getProfile(userId: string): Promise<ProfileResponseDto> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Get default image from user images
    const defaultImage = await this.userImageService.getDefaultImage(userId);
    const profileResponse = this.mapUserToProfileResponse(user);
    
    // Override profileImageUrl with default image if it exists
    if (defaultImage) {
      profileResponse.profileImageUrl = defaultImage.imageUrl;
    }

    return profileResponse;
  }

  /**
   * Update user profile
   */
  async updateProfile(
    userId: string,
    updateProfileDto: UpdateProfileDto,
  ): Promise<UpdateProfileResponseDto> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId, isActive: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      // Check if email is being changed and if it's already taken
      if (updateProfileDto.email && updateProfileDto.email !== user.email) {
        const existingUser = await this.userRepository.findOne({
          where: { email: updateProfileDto.email },
        });

        if (existingUser && existingUser.id !== userId) {
          throw new ConflictException('Email address is already in use');
        }
      }

      // Update user fields
      Object.assign(user, updateProfileDto);

      // Convert date string to Date object if provided
      if (updateProfileDto.dateOfBirth) {
        user.dateOfBirth = new Date(updateProfileDto.dateOfBirth);
      }

      // Check if profile is now completed
      user.profileCompleted = this.isProfileCompleted(user);

      // Save updated user
      const updatedUser = await this.userRepository.save(user);

      this.logger.log(`Profile updated for user ${userId}`);

      return {
        success: true,
        message: 'Profile updated successfully',
        profile: this.mapUserToProfileResponse(updatedUser),
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof ConflictException) {
        throw error;
      }

      this.logger.error(`Failed to update profile for user ${userId}:`, error);
      throw new Error('Failed to update profile');
    }
  }

  /**
   * Upload profile image
   */
  async updateProfileImage(
    userId: string,
    imageUrl: string,
  ): Promise<UpdateProfileResponseDto> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId, isActive: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      user.profileImageUrl = imageUrl;
      user.profileCompleted = this.isProfileCompleted(user);

      const updatedUser = await this.userRepository.save(user);

      this.logger.log(`Profile image updated for user ${userId}`);

      return {
        success: true,
        message: 'Profile image updated successfully',
        profile: this.mapUserToProfileResponse(updatedUser),
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`Failed to update profile image for user ${userId}:`, error);
      throw new Error('Failed to update profile image');
    }
  }

  /**
   * Get profile completion status
   */
  async getProfileCompletionStatus(userId: string): Promise<{
    isCompleted: boolean;
    completionPercentage: number;
    missingFields: string[];
  }> {
    const user = await this.userRepository.findOne({
      where: { id: userId, isActive: true },
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const requiredFields = [
      'firstName',
      'lastName',
      'height',
      'weight',
      'profileImageUrl',
    ];

    const missingFields: string[] = [];
    let completedFields = 0;

    requiredFields.forEach(field => {
      if (user[field as keyof User]) {
        completedFields++;
      } else {
        missingFields.push(field);
      }
    });

    const completionPercentage = Math.round((completedFields / requiredFields.length) * 100);
    const isCompleted = completionPercentage === 100;

    return {
      isCompleted,
      completionPercentage,
      missingFields,
    };
  }

  /**
   * Delete user profile (soft delete)
   */
  async deleteProfile(userId: string): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.userRepository.findOne({
        where: { id: userId, isActive: true },
      });

      if (!user) {
        throw new NotFoundException('User not found');
      }

      user.isActive = false;
      await this.userRepository.save(user);

      this.logger.log(`Profile deleted (soft delete) for user ${userId}`);

      return {
        success: true,
        message: 'Profile deleted successfully',
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`Failed to delete profile for user ${userId}:`, error);
      throw new Error('Failed to delete profile');
    }
  }

  /**
   * Map User entity to ProfileResponseDto
   */
  private mapUserToProfileResponse(user: User): ProfileResponseDto {
    return {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      fullName: user.fullName,
      height: user.height,
      weight: user.weight,
      weightUnit: user.weightUnit as any,
      profileImageUrl: user.profileImageUrl,
      phoneNumber: user.phoneNumber,
      dateOfBirth: user.dateOfBirth?.toISOString().split('T')[0], // Format as YYYY-MM-DD
      gender: user.gender as any,
      bio: user.bio,
      location: user.location,
      profileCompleted: user.profileCompleted,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * Check if profile is completed based on required fields
   */
  private isProfileCompleted(user: User): boolean {
    const requiredFields = [
      user.firstName,
      user.lastName,
      user.height,
      user.weight,
      user.profileImageUrl,
    ];

    return requiredFields.every(field => field !== null && field !== undefined && field !== '');
  }
}
