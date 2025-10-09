import {
  Controller,
  Post,
  Get,
  Delete,
  UseGuards,
  Body,
  Query,
  Param,
  ParseUUIDPipe,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { VirtualTryOnService } from './virtual-tryon.service';
import {
  SaveTryOnDto,
  TryOnHistoryQueryDto,
  PaginatedTryOnHistoryResponseDto,
  SaveTryOnResponseDto,
} from './dto/tryon-history.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { User } from '../database/entities/user.entity';

@ApiTags('try-on-history')
@Controller('api/tryon')
export class VirtualTryOnController {
  private readonly logger = new Logger(VirtualTryOnController.name);

  constructor(private readonly virtualTryOnService: VirtualTryOnService) {}

  // Removed complex virtual try-on endpoint - now just simple tracking

  @UseGuards(JwtAuthGuard)
  @Post('save')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Save glasses try-on to history',
    description:
      'Record that a user has tried on specific glasses. If the same glasses was already tried on, it updates the timestamp.',
  })
  @ApiResponse({
    status: 201,
    description: 'Try-on saved successfully',
    type: SaveTryOnResponseDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Bad request - invalid data',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({
    status: 404,
    description: 'Glasses not found',
  })
  saveTryOn(
    @Body() saveTryOnDto: SaveTryOnDto,
    @CurrentUser() user: User,
  ): Promise<SaveTryOnResponseDto> {
    return this.virtualTryOnService.saveTryOn(user.id, saveTryOnDto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('history')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get user try-on history',
    description:
      'Retrieve the list of glasses the authenticated user has tried on with pagination',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved try-on history',
    type: PaginatedTryOnHistoryResponseDto,
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  getTryOnHistory(
    @Query() queryDto: TryOnHistoryQueryDto,
    @CurrentUser() user: User,
  ): Promise<PaginatedTryOnHistoryResponseDto> {
    return this.virtualTryOnService.getUserTryOnHistory(user.id, queryDto);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('history/:id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete try-on from history',
    description:
      "Remove a specific glasses try-on record from the user's history",
  })
  @ApiResponse({
    status: 200,
    description: 'Try-on deleted successfully',
  })
  @ApiResponse({
    status: 401,
    description: 'Unauthorized - JWT token required',
  })
  @ApiResponse({
    status: 404,
    description: 'Try-on record not found',
  })
  async deleteTryOn(
    @Param('id', ParseUUIDPipe) id: string,
    @CurrentUser() user: User,
  ): Promise<{ message: string }> {
    await this.virtualTryOnService.deleteTryOn(user.id, id);
    return { message: 'Try-on deleted successfully' };
  }
}
