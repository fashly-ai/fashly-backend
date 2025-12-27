import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  ParseUUIDPipe,
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
import { GlassTryOnHistoryService } from './glass-tryon-history.service';
import {
  SaveGlassTryOnDto,
  UpdateSavedStatusDto,
  GlassTryOnHistoryQueryDto,
  GlassTryOnHistoryResponseDto,
  PaginatedGlassTryOnHistoryResponseDto,
  SaveGlassTryOnResponseDto,
} from './dto/glass-tryon-history.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../database/entities/user.entity';

@ApiTags('glass-tryon-history')
@Controller('api/glass-tryon-history')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class GlassTryOnHistoryController {
  constructor(
    private readonly glassTryOnHistoryService: GlassTryOnHistoryService,
  ) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Save glass try-on result to history',
    description:
      'Save the ComfyUI glass try-on result including the image and parameters',
  })
  @ApiResponse({
    status: 201,
    description: 'Glass try-on saved successfully',
    type: SaveGlassTryOnResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({
    status: 404,
    description: 'Glass not found',
  })
  async saveGlassTryOn(
    @Body() saveDto: SaveGlassTryOnDto,
    @CurrentUser() user: User,
  ): Promise<SaveGlassTryOnResponseDto> {
    return this.glassTryOnHistoryService.saveGlassTryOn(user.id, saveDto);
  }

  @Get()
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get glass try-on history',
    description:
      'Retrieve the authenticated user\'s glass try-on history with optional filtering',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved history',
    type: PaginatedGlassTryOnHistoryResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  async getHistory(
    @Query() queryDto: GlassTryOnHistoryQueryDto,
    @CurrentUser() user: User,
  ): Promise<PaginatedGlassTryOnHistoryResponseDto> {
    return this.glassTryOnHistoryService.getHistory(user.id, queryDto);
  }

  @Get(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Get glass try-on history by ID',
    description: 'Retrieve a specific glass try-on history record',
  })
  @ApiParam({
    name: 'id',
    description: 'History record ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved history record',
    type: GlassTryOnHistoryResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({
    status: 404,
    description: 'History record not found',
  })
  async getHistoryById(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<GlassTryOnHistoryResponseDto> {
    return this.glassTryOnHistoryService.getHistoryById(user.id, id);
  }

  @Put(':id/saved-status')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Update saved status of glass try-on',
    description: 'Mark a glass try-on as saved or unsaved',
  })
  @ApiParam({
    name: 'id',
    description: 'History record ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'Saved status updated successfully',
    type: GlassTryOnHistoryResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({
    status: 404,
    description: 'History record not found',
  })
  async updateSavedStatus(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateDto: UpdateSavedStatusDto,
    @CurrentUser() user: User,
  ): Promise<GlassTryOnHistoryResponseDto> {
    return this.glassTryOnHistoryService.updateSavedStatus(
      user.id,
      id,
      updateDto,
    );
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Delete glass try-on from history',
    description: 'Remove a glass try-on record from history',
  })
  @ApiParam({
    name: 'id',
    description: 'History record ID (UUID)',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiResponse({
    status: 200,
    description: 'History record deleted successfully',
    schema: {
      type: 'object',
      properties: {
        message: {
          type: 'string',
          example: 'Glass try-on history deleted successfully',
        },
      },
    },
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({
    status: 404,
    description: 'History record not found',
  })
  async deleteHistory(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    await this.glassTryOnHistoryService.deleteHistory(user.id, id);
    return { message: 'Glass try-on history deleted successfully' };
  }
}

