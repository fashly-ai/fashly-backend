import {
  Controller,
  Get,
  Post,
  Delete,
  Patch,
  Body,
  Param,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
  ApiParam,
} from '@nestjs/swagger';
import { UserImageService } from './services/user-image.service';
import {
  UploadUserImageDto,
  UserImageResponseDto,
  SetDefaultImageDto,
} from './dto/user-image.dto';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { CurrentUser } from './decorators/current-user.decorator';
import { User } from '../database/entities/user.entity';

@ApiTags('user-images')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('api/user-images')
export class UserImagesController {
  constructor(private readonly userImageService: UserImageService) {}

  @Post()
  @ApiOperation({
    summary: 'Upload a new user image',
    description: 'Add a new selfie/model image for the user. First image is automatically set as default.',
  })
  @ApiResponse({
    status: 201,
    description: 'Image uploaded successfully',
    type: UserImageResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async uploadImage(
    @CurrentUser() user: User,
    @Body() uploadDto: UploadUserImageDto,
  ): Promise<UserImageResponseDto> {
    return this.userImageService.uploadImage(user.id, uploadDto);
  }

  @Get()
  @ApiOperation({
    summary: 'Get all user images',
    description: 'Get all selfie/model images for the current user, ordered by default first, then by upload date.',
  })
  @ApiResponse({
    status: 200,
    description: 'Images retrieved successfully',
    type: [UserImageResponseDto],
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getUserImages(
    @CurrentUser() user: User,
  ): Promise<UserImageResponseDto[]> {
    return this.userImageService.getUserImages(user.id);
  }

  @Get('default')
  @ApiOperation({
    summary: 'Get default user image',
    description: 'Get the default selfie/model image for the current user.',
  })
  @ApiResponse({
    status: 200,
    description: 'Default image retrieved successfully',
    type: UserImageResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'No default image found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async getDefaultImage(
    @CurrentUser() user: User,
  ): Promise<UserImageResponseDto | null> {
    return this.userImageService.getDefaultImage(user.id);
  }

  @Patch('default')
  @ApiOperation({
    summary: 'Set an image as default',
    description: 'Set a specific image as the default selfie/model image for try-on.',
  })
  @ApiResponse({
    status: 200,
    description: 'Default image updated successfully',
    type: UserImageResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Image not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async setDefaultImage(
    @CurrentUser() user: User,
    @Body() setDefaultDto: SetDefaultImageDto,
  ): Promise<UserImageResponseDto> {
    return this.userImageService.setDefaultImage(user.id, setDefaultDto.imageId);
  }

  @Delete(':imageId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a user image',
    description: 'Delete a specific user image. If it was the default, another image will be set as default automatically.',
  })
  @ApiParam({
    name: 'imageId',
    description: 'The ID of the image to delete',
    example: 'uuid-string',
  })
  @ApiResponse({
    status: 204,
    description: 'Image deleted successfully',
  })
  @ApiResponse({
    status: 404,
    description: 'Image not found',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized',
  })
  async deleteImage(
    @CurrentUser() user: User,
    @Param('imageId') imageId: string,
  ): Promise<void> {
    return this.userImageService.deleteImage(user.id, imageId);
  }
}

