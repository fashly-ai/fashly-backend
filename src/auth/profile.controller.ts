import {
  Controller,
  Get,
  Put,
  Post,
  Delete,
  Body,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ProfileService } from './services/profile.service';
import { UpdateProfileDto, ProfileResponseDto, UpdateProfileResponseDto } from './dto/profile.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../database/entities/user.entity';

@ApiTags('profile')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('api/profile')
export class ProfileController {
  constructor(private readonly profileService: ProfileService) {}

  @Get()
  @ApiOperation({
    summary: 'Get user profile',
    description: 'Get the current user\'s complete profile information',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile retrieved successfully',
    type: ProfileResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - valid JWT token required',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getProfile(@CurrentUser() user: User): Promise<ProfileResponseDto> {
    return this.profileService.getProfile(user.id);
  }

  @Put()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update user profile',
    description: 'Update the current user\'s profile information',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile updated successfully',
    type: UpdateProfileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - valid JWT token required',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  @ApiResponse({
    status: 409,
    description: 'Email address already in use',
  })
  async updateProfile(
    @CurrentUser() user: User,
    @Body() updateProfileDto: UpdateProfileDto,
  ): Promise<UpdateProfileResponseDto> {
    return this.profileService.updateProfile(user.id, updateProfileDto);
  }

  @Post('image')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update profile image',
    description: 'Update the current user\'s profile image URL',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile image updated successfully',
    type: UpdateProfileResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid image URL',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - valid JWT token required',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async updateProfileImage(
    @CurrentUser() user: User,
    @Body() body: { imageUrl: string },
  ): Promise<UpdateProfileResponseDto> {
    return this.profileService.updateProfileImage(user.id, body.imageUrl);
  }

  @Get('completion')
  @ApiOperation({
    summary: 'Get profile completion status',
    description: 'Get the current user\'s profile completion status and missing fields',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile completion status retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        isCompleted: { type: 'boolean', example: false },
        completionPercentage: { type: 'number', example: 60 },
        missingFields: { 
          type: 'array', 
          items: { type: 'string' },
          example: ['height', 'profileImageUrl']
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - valid JWT token required',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async getProfileCompletion(@CurrentUser() user: User) {
    return this.profileService.getProfileCompletionStatus(user.id);
  }

  @Delete()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete user profile',
    description: 'Soft delete the current user\'s profile (deactivate account)',
  })
  @ApiResponse({
    status: 200,
    description: 'Profile deleted successfully',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean', example: true },
        message: { type: 'string', example: 'Profile deleted successfully' },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - valid JWT token required',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  async deleteProfile(@CurrentUser() user: User) {
    return this.profileService.deleteProfile(user.id);
  }
}
