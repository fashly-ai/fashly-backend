import { Controller, Get, Post, Body, Param, Delete } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CrawlingService } from './crawling.service';
import { CrawlingResultDto } from './dto/crawled-product.dto';
import { RevolveCrawlDto } from './dto/revolve-crawl.dto';
import { AsosCrawlDto } from './dto/asos-crawl.dto';
import { Glasses } from '../database/entities/glasses.entity';
import { Public } from '../auth/decorators/public.decorator';

@ApiTags('crawling')
@Controller('crawling')
export class CrawlingController {
  constructor(private readonly crawlingService: CrawlingService) { }

  @Public()
  @Get('gentle-monster-glasses')
  @ApiOperation({
    summary: 'Crawl Gentle Monster glasses',
    description: 'Crawls all glasses from Gentle Monster website and returns product data including names, URLs, and image URLs',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully crawled products',
    type: CrawlingResultDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during crawling',
  })
  async crawlGentleMonsterGlasses(): Promise<CrawlingResultDto> {
    return this.crawlingService.crawlGentleMonsterGlasses();
  }


  @Public()
  @Get('gentle-monster-sunglasses')
  @ApiOperation({
    summary: 'Crawl Gentle Monster sunglasses',
    description: 'Crawls all sunglasses from Gentle Monster website and returns product data including names, URLs, and image URLs',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully crawled sunglasses products',
    type: CrawlingResultDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during crawling',
  })
  async crawlGentleMonsterSunglasses(): Promise<CrawlingResultDto> {
    return this.crawlingService.crawlGentleMonsterSunglasses();
  }

  @Public()
  @Post('custom')
  @ApiOperation({
    summary: 'Crawl with custom selectors',
    description: 'Crawl any website with custom CSS selectors for products, names, links, and images',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully crawled products',
    type: CrawlingResultDto,
  })
  async crawlWithCustomSelectors(
    @Body() body: {
      url: string;
      productSelector: string;
      nameSelector: string;
      linkSelector: string;
      imageSelector: string;
    }
  ): Promise<CrawlingResultDto> {
    const { url, productSelector, nameSelector, linkSelector, imageSelector } = body;
    return this.crawlingService.crawlWithCustomSelectors(
      url,
      productSelector,
      nameSelector,
      linkSelector,
      imageSelector,
    );
  }

  @Public()
  @Get('glasses')
  @ApiOperation({
    summary: 'Get all saved glasses',
    description: 'Retrieves all glasses saved in the database from previous crawling sessions',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved glasses',
    type: [Glasses],
  })
  async getAllGlasses(): Promise<Glasses[]> {
    return this.crawlingService.getAllGlasses();
  }

  @Public()
  @Get('glasses/brand/:brand')
  @ApiOperation({
    summary: 'Get glasses by brand',
    description: 'Retrieves glasses filtered by brand name',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved glasses by brand',
    type: [Glasses],
  })
  async getGlassesByBrand(@Param('brand') brand: string): Promise<Glasses[]> {
    return this.crawlingService.getGlassesByBrand(brand);
  }

  @Public()
  @Delete('glasses/:id')
  @ApiOperation({
    summary: 'Delete glasses',
    description: 'Soft delete glasses by setting isActive to false',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully deleted glasses',
  })
  async deleteGlasses(@Param('id') id: string): Promise<{ message: string }> {
    await this.crawlingService.deleteGlasses(id);
    return { message: 'Glasses deleted successfully' };
  }

  @Public()
  @Post('revolve-clothing')
  @ApiOperation({
    summary: 'Crawl Revolve clothing items',
    description: 'Crawls all clothing items from Revolve.com across multiple pages (default 121 pages)',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully crawled Revolve clothing products',
    type: CrawlingResultDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during crawling',
  })
  async crawlRevolveClothing(
    @Body() body: RevolveCrawlDto
  ): Promise<CrawlingResultDto> {
    const baseUrl = body?.baseUrl || 'https://www.revolve.com/clothing/br/3699fc/';
    const maxPages = body?.maxPages || 121;
    return this.crawlingService.crawlRevolveClothing(baseUrl, maxPages);
  }

  @Public()
  @Post('asos-clothing')
  @ApiOperation({
    summary: 'Crawl ASOS clothing items',
    description: 'Crawls all clothing items from ASOS.com across multiple pages (default 50 pages)',
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully crawled ASOS clothing products',
    type: CrawlingResultDto,
  })
  @ApiResponse({
    status: 500,
    description: 'Internal server error during crawling',
  })
  async crawlAsosClothing(@Body() body: AsosCrawlDto): Promise<CrawlingResultDto> {
    const baseUrl =
      body?.baseUrl ||
      'https://www.asos.com/women/ctas/usa-online-fashion-13/cat/?cid=16661';
    const maxPages = body?.maxPages || 50;
    const category = body?.category || 'ASOS';
    const subcategory = body?.subcategory || undefined;
    return this.crawlingService.crawlAsosClothing(
      baseUrl,
      maxPages,
      category,
      subcategory,
    );
  }
}
