import {
  Controller,
  Post,
  Get,
  Delete,
  Patch,
  Body,
  Param,
  Query,
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
import { FashnService } from './fashn.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../database/entities/user.entity';
import {
  FashnTryOnRequestDto,
  FashnTryOnResponseDto,
  FashnPredictionStatusResponseDto,
  FashnAsyncTryOnRequestDto,
  FashnAsyncTryOnResponseDto,
  FashnJobStatusResponseDto,
} from './dto/fashn-tryon.dto';
import { FashnJobStatus } from '../database/entities/fashn-job.entity';
import {
  FashnHistoryQueryDto,
  FashnHistoryResponseDto,
  FashnHistoryItemDto,
  UpdateFashnSavedStatusDto,
} from './dto/fashn-history.dto';

@ApiTags('fashn')
@Controller('api/fashn')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth('JWT-auth')
export class FashnController {
  constructor(private readonly fashnService: FashnService) {}

  @Post('tryon')
  @ApiOperation({
    summary: 'Generate virtual try-on with full body and upper/lower garments',
    description:
      'Generate a virtual try-on using FASHN API. Provide URLs for the full body model image and upper/lower garment images.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Virtual try-on generated successfully',
    type: FashnTryOnResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request parameters or try-on generation failed',
  })
  @ApiResponse({
    status: HttpStatus.UNAUTHORIZED,
    description: 'User not authenticated',
  })
  async generateTryOn(
    @CurrentUser() user: User,
    @Body() requestDto: FashnTryOnRequestDto,
  ): Promise<FashnTryOnResponseDto> {
    return this.fashnService.generateTryOn(user.id, requestDto);
  }

  @Get('predictions/:predictionId')
  @ApiOperation({
    summary: 'Check the status of a FASHN prediction',
    description:
      'Get the current status of a FASHN prediction by its ID. Use this to check if a prediction is still processing.',
  })
  @ApiParam({
    name: 'predictionId',
    description: 'The FASHN prediction ID',
    example: 'pred_abc123xyz',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Prediction status retrieved successfully',
    type: FashnPredictionStatusResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Failed to retrieve prediction status',
  })
  async getPredictionStatus(
    @Param('predictionId') predictionId: string,
  ): Promise<FashnPredictionStatusResponseDto> {
    return this.fashnService.getPredictionStatus(predictionId);
  }

  @Get('history')
  @ApiOperation({
    summary: 'Get user FASHN try-on history',
    description:
      'Retrieve the authenticated user\'s FASHN virtual try-on history with pagination.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'History retrieved successfully',
    type: FashnHistoryResponseDto,
  })
  async getUserHistory(
    @CurrentUser() user: User,
    @Query() queryDto: FashnHistoryQueryDto,
  ): Promise<FashnHistoryResponseDto> {
    return this.fashnService.getUserHistory(user.id, queryDto);
  }

  @Get('history/:historyId')
  @ApiOperation({
    summary: 'Get a specific FASHN history record',
    description: 'Retrieve a specific FASHN try-on history record by its ID.',
  })
  @ApiParam({
    name: 'historyId',
    description: 'The history record ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'History record retrieved successfully',
    type: FashnHistoryItemDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'History record not found',
  })
  async getHistoryById(
    @CurrentUser() user: User,
    @Param('historyId') historyId: string,
  ): Promise<FashnHistoryItemDto> {
    return this.fashnService.getHistoryById(user.id, historyId);
  }

  @Patch('history/:historyId/saved')
  @ApiOperation({
    summary: 'Update saved status of a FASHN history record',
    description: 'Save or unsave a FASHN try-on history record.',
  })
  @ApiParam({
    name: 'historyId',
    description: 'The history record ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Saved status updated successfully',
    type: FashnHistoryItemDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'History record not found',
  })
  async updateSavedStatus(
    @CurrentUser() user: User,
    @Param('historyId') historyId: string,
    @Body() updateDto: UpdateFashnSavedStatusDto,
  ): Promise<FashnHistoryItemDto> {
    return this.fashnService.updateSavedStatus(user.id, historyId, updateDto);
  }

  @Delete('history/:historyId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete a FASHN history record',
    description: 'Delete a specific FASHN try-on history record.',
  })
  @ApiParam({
    name: 'historyId',
    description: 'The history record ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'History record deleted successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'History record not found',
  })
  async deleteHistory(
    @CurrentUser() user: User,
    @Param('historyId') historyId: string,
  ): Promise<void> {
    return this.fashnService.deleteHistory(user.id, historyId);
  }

  @Get('history/stats/count')
  @ApiOperation({
    summary: 'Get count of user FASHN history records',
    description: 'Get the total count of FASHN try-on history records for the authenticated user.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Count retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', example: 42 },
        saved: { type: 'number', example: 15 },
      },
    },
  })
  async getHistoryCount(
    @CurrentUser() user: User,
  ): Promise<{ total: number; saved: number }> {
    const [total, saved] = await Promise.all([
      this.fashnService.getHistoryCount(user.id, false),
      this.fashnService.getHistoryCount(user.id, true),
    ]);

    return { total, saved };
  }

  // ============================================
  // Async/Queue-based Try-On Endpoints
  // ============================================

  @Post('tryon/queue')
  @ApiOperation({
    summary: 'Queue a virtual try-on job for async processing',
    description:
      'Submit a try-on job that will be processed in the background. ' +
      'Returns immediately with a job ID. Poll GET /api/fashn/jobs/:jobId to check status. ' +
      'Supports both separate top+bottom garments OR a combined outfit image.',
  })
  @ApiResponse({
    status: HttpStatus.CREATED,
    description: 'Try-on job queued successfully',
    type: FashnAsyncTryOnResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Invalid request parameters',
  })
  async queueTryOn(
    @CurrentUser() user: User,
    @Body() requestDto: FashnAsyncTryOnRequestDto,
  ): Promise<FashnAsyncTryOnResponseDto> {
    return this.fashnService.queueTryOn(user.id, requestDto);
  }

  @Get('jobs/:jobId')
  @ApiOperation({
    summary: 'Get status of a queued try-on job',
    description:
      'Check the current status of a try-on job. ' +
      'Poll this endpoint until status is "completed" or "failed".',
  })
  @ApiParam({
    name: 'jobId',
    description: 'The job ID returned from POST /api/fashn/tryon/queue',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Job status retrieved successfully',
    type: FashnJobStatusResponseDto,
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Job not found',
  })
  async getJobStatus(
    @CurrentUser() user: User,
    @Param('jobId') jobId: string,
  ): Promise<FashnJobStatusResponseDto> {
    return this.fashnService.getJobStatus(user.id, jobId);
  }

  @Get('jobs')
  @ApiOperation({
    summary: 'Get all try-on jobs for the current user',
    description: 'Retrieve a list of all try-on jobs with optional status filter.',
  })
  @ApiResponse({
    status: HttpStatus.OK,
    description: 'Jobs retrieved successfully',
    type: [FashnJobStatusResponseDto],
  })
  async getUserJobs(
    @CurrentUser() user: User,
    @Query('status') status?: FashnJobStatus,
    @Query('limit') limit?: number,
  ): Promise<FashnJobStatusResponseDto[]> {
    return this.fashnService.getUserJobs(user.id, status, limit || 20);
  }

  @Delete('jobs/:jobId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Cancel a pending try-on job',
    description: 'Cancel a job that is still pending or processing.',
  })
  @ApiParam({
    name: 'jobId',
    description: 'The job ID to cancel',
  })
  @ApiResponse({
    status: HttpStatus.NO_CONTENT,
    description: 'Job cancelled successfully',
  })
  @ApiResponse({
    status: HttpStatus.NOT_FOUND,
    description: 'Job not found',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Cannot cancel completed or failed job',
  })
  async cancelJob(
    @CurrentUser() user: User,
    @Param('jobId') jobId: string,
  ): Promise<void> {
    return this.fashnService.cancelJob(user.id, jobId);
  }
}

