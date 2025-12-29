import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export class AsosCrawlDto {
  @ApiProperty({
    description: 'Base URL to crawl (ASOS clothing category page)',
    example: 'https://www.asos.com/women/ctas/usa-online-fashion-13/cat/?cid=16661',
    required: false,
  })
  @IsOptional()
  @IsString()
  baseUrl?: string;

  @ApiProperty({
    description: 'Maximum number of pages to crawl (1-100)',
    example: 10,
    default: 50,
    required: false,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(100)
  maxPages?: number;

  @ApiProperty({
    description: 'Category for the clothing items being crawled',
    example: 'Dresses',
    required: false,
  })
  @IsOptional()
  @IsString()
  category?: string;

  @ApiProperty({
    description: 'Subcategory for the clothing items being crawled',
    example: 'Partywear',
    required: false,
  })
  @IsOptional()
  @IsString()
  subcategory?: string;
}




