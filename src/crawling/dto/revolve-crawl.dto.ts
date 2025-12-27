import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max } from 'class-validator';

export class RevolveCrawlDto {
  @ApiProperty({
    description: 'Base URL to crawl (Revolve clothing page)',
    example: 'https://www.revolve.com/clothing/br/3699fc/',
    required: false,
  })
  @IsOptional()
  @IsString()
  baseUrl?: string;

  @ApiProperty({
    description: 'Maximum number of pages to crawl (1-121)',
    example: 5,
    default: 121,
    required: false,
    minimum: 1,
    maximum: 121,
  })
  @IsOptional()
  @IsNumber()
  @Min(1)
  @Max(121)
  maxPages?: number;
}

