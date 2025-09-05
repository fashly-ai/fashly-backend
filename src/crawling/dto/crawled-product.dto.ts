import { IsString, IsUrl, IsOptional } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CrawledProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'Mosh 02',
  })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Product page URL',
    example: 'https://www.gentlemonster.com/int/en/product/mosh-02',
  })
  @IsUrl()
  productUrl: string;

  @ApiProperty({
    description: 'Product image URL (primary image)',
    example:
      'https://cdn.gentlemonster.com/media/catalog/product/cache/1/image/1800x/040ec09b1e35df139433887a97daa66f/m/o/mosh-02_01.jpg',
  })
  @IsUrl()
  imageUrl: string;

  @ApiProperty({
    description: 'All product image URLs from the carousel',
    example: [
      'https://gm-prd-resource.gentlemonster.com/catalog/product/bulk/7c38d4d4-d5f1-43ba-bdd5-654bf7948a8e/11004655_D_45.jpg?width=1400',
      'https://gm-prd-resource.gentlemonster.com/catalog/product/bulk/6ad03e98-f428-43c6-9ed6-f12e7ae85eb0/11004655_LOOK_BOOK_FIRST.jpg?width=1400',
      'https://gm-prd-resource.gentlemonster.com/catalog/product/bulk/baa14485-61a3-434f-8c4c-40d861d8f877/11004655_FRONT.jpg?width=1400',
      'https://gm-prd-resource.gentlemonster.com/catalog/product/bulk/abc12345-61a3-434f-8c4c-40d861d8f877/11004655_SIDE.jpg?width=1400',
      'https://gm-prd-resource.gentlemonster.com/catalog/product/bulk/def67890-61a3-434f-8c4c-40d861d8f877/11004655_BACK.jpg?width=1400'
    ],
    required: false,
  })
  @IsOptional()
  allImages?: string[];

  @ApiProperty({
    description: 'Product price',
    example: '₫ 7,340,300',
    required: false,
  })
  @IsOptional()
  @IsString()
  price?: string;
}

export class CrawlingResultDto {
  @ApiProperty({
    description: 'Array of crawled products',
    type: [CrawledProductDto],
  })
  products: CrawledProductDto[];

  @ApiProperty({
    description: 'Total number of products found',
    example: 42,
  })
  totalCount: number;

  @ApiProperty({
    description: 'Crawling timestamp',
    example: '2024-01-01T12:00:00Z',
  })
  crawledAt: string;
}
