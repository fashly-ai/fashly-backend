# ASOS Category Crawling Guide

This guide explains how to use the updated ASOS crawling API with category support.

## Overview

The ASOS crawling API has been updated to support category classification when crawling clothing items. Each item will now be saved with a `category` field in the database, making it easier to organize and filter products.

## Database Changes

### Updated Entity Fields

The `Clothes` entity now includes:
- `category` (varchar 100, indexed) - Main category of the clothing item
- `subcategory` (varchar 100, nullable) - Subcategory (currently kept empty, ready for future use)

### Migration

A migration has been created to update the database schema:

```bash
# Run the migration to add the new fields
npm run migration:run
```

Migration file: `1766975145439-AddSubcategoryToClothes.ts`

## API Usage

### Endpoint

```
POST /crawling/asos-clothing
```

### Request Body

```json
{
  "baseUrl": "string (optional)",
  "maxPages": "number (optional, 1-100, default: 50)",
  "category": "string (optional, default: 'ASOS')"
}
```

### Parameters

1. **baseUrl** (optional)
   - The ASOS category page URL to crawl
   - Default: `https://www.asos.com/women/ctas/usa-online-fashion-13/cat/?cid=16661`
   - Example: `https://www.asos.com/women/dresses/cat/?cid=8799`

2. **maxPages** (optional)
   - Number of pages to crawl (1-100)
   - Default: 50
   - Recommended: 5-10 for testing

3. **category** (optional)
   - Category name to assign to crawled items
   - Default: 'ASOS'
   - Example: 'Dresses', 'Tops', 'Jeans'

### Example Requests

#### 1. Crawl Dresses Category

```bash
curl -X POST http://localhost:3000/crawling/asos-clothing \
  -H "Content-Type: application/json" \
  -d '{
    "baseUrl": "https://www.asos.com/women/dresses/cat/?cid=8799",
    "maxPages": 5,
    "category": "Dresses"
  }'
```

#### 2. Crawl Tops Category

```bash
curl -X POST http://localhost:3000/crawling/asos-clothing \
  -H "Content-Type: application/json" \
  -d '{
    "baseUrl": "https://www.asos.com/women/tops/cat/?cid=4169",
    "maxPages": 5,
    "category": "Tops"
  }'
```

#### 3. Crawl Jeans Category

```bash
curl -X POST http://localhost:3000/crawling/asos-clothing \
  -H "Content-Type: application/json" \
  -d '{
    "baseUrl": "https://www.asos.com/women/jeans/cat/?cid=3630",
    "maxPages": 5,
    "category": "Jeans"
  }'
```

## Available ASOS Categories

### Main Clothing Categories

| Category | Category ID (cid) | Example URL |
|----------|-------------------|-------------|
| Dresses | 8799 | `https://www.asos.com/women/dresses/cat/?cid=8799` |
| Tops | 4169 | `https://www.asos.com/women/tops/cat/?cid=4169` |
| Jeans | 3630 | `https://www.asos.com/women/jeans/cat/?cid=3630` |
| Coats & Jackets | 2641 | `https://www.asos.com/women/coats-jackets/cat/?cid=2641` |
| Shorts | 9263 | `https://www.asos.com/women/shorts/cat/?cid=9263` |
| Skirts | 2639 | `https://www.asos.com/women/skirts/cat/?cid=2639` |
| Trousers & Leggings | 2640 | `https://www.asos.com/women/trousers-leggings/cat/?cid=2640` |
| Jumpsuits & Playsuits | 7618 | `https://www.asos.com/women/jumpsuits-playsuits/cat/?cid=7618` |
| Swimwear & Beachwear | 2238 | `https://www.asos.com/women/swimwear-beachwear/cat/?cid=2238` |
| Activewear | 26091 | `https://www.asos.com/women/activewear/cat/?cid=26091` |
| Loungewear | 16230 | `https://www.asos.com/women/loungewear/cat/?cid=16230` |
| Lingerie & Nightwear | 6046 | `https://www.asos.com/women/lingerie-nightwear/cat/?cid=6046` |

### Partywear Categories

| Category | Category ID (cid) | Example URL |
|----------|-------------------|-------------|
| Partywear - Dresses | 8857 | `https://www.asos.com/women/dresses/party-dresses/cat/?cid=8857` |
| Partywear - Tops | 4169 | `https://www.asos.com/women/tops/going-out-tops/cat/?cid=11318` |

## Testing

### Quick Test Script

A test script is provided with example curl commands for different categories:

```bash
# Run the test script
./test-asos-categories.sh
```

This will test crawling multiple categories with 2 pages each.

### Manual Testing

1. Start your NestJS server:
```bash
npm run start:dev
```

2. Run a curl command from the examples above

3. Check the database to verify that items were saved with the correct category:
```sql
SELECT id, name, brand, category, subcategory FROM clothes WHERE category = 'Dresses' LIMIT 10;
```

## Response Format

The API returns a `CrawlingResultDto` object:

```json
{
  "products": [
    {
      "name": "Product Name",
      "productUrl": "https://www.asos.com/...",
      "imageUrl": "https://images.asos-media.com/...",
      "price": "$50.00",
      "allImages": ["image1.jpg", "image2.jpg"]
    }
  ],
  "totalCount": 96,
  "crawledAt": "2025-12-29T10:30:00.000Z"
}
```

## Database Schema

### Clothes Table

```sql
CREATE TABLE clothes (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  brand VARCHAR(100) NOT NULL,
  clothing_type VARCHAR(50) NOT NULL,  -- 'upper' or 'lower'
  category VARCHAR(100),                -- NEW: Category name
  subcategory VARCHAR(100),             -- NEW: Subcategory (currently empty)
  description TEXT,
  price DECIMAL(10,2),
  currency VARCHAR(10),
  image_url TEXT NOT NULL,
  thumbnail_url TEXT,
  additional_images TEXT[],
  color VARCHAR(50),
  sizes TEXT[],
  material VARCHAR(100),
  season VARCHAR(50),
  style VARCHAR(50),
  tags TEXT[],
  product_url TEXT,
  sku VARCHAR(100),
  is_active BOOLEAN DEFAULT true,
  in_stock BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);

-- Indexes
CREATE INDEX idx_clothes_clothing_type ON clothes(is_active, clothing_type);
CREATE INDEX idx_clothes_brand ON clothes(brand, is_active);
CREATE INDEX idx_clothes_category ON clothes(category);  -- NEW
CREATE INDEX idx_is_active ON clothes(is_active);
```

## Query Examples

### Find all items in a specific category

```sql
SELECT * FROM clothes WHERE category = 'Dresses' AND is_active = true;
```

### Count items by category

```sql
SELECT category, COUNT(*) as count 
FROM clothes 
WHERE is_active = true 
GROUP BY category 
ORDER BY count DESC;
```

### Find items by category and brand

```sql
SELECT * FROM clothes 
WHERE category = 'Tops' 
  AND brand LIKE 'ASOS%' 
  AND is_active = true
ORDER BY created_at DESC;
```

## Future Enhancements

### Subcategory Support

The `subcategory` field is ready for future use. You can extend the API to support subcategories:

```json
{
  "baseUrl": "https://www.asos.com/women/dresses/party-dresses/cat/?cid=8857",
  "maxPages": 5,
  "category": "Dresses",
  "subcategory": "Party Dresses"  // Future feature
}
```

## Troubleshooting

### Issue: Migration fails

**Solution**: Check if the database is running and accessible:
```bash
# Check database connection
npm run start:dev
```

### Issue: Category not being saved

**Solution**: Make sure you're running the latest migration:
```bash
npm run migration:run
```

### Issue: No products found

**Solution**: 
1. Check if the ASOS URL is correct
2. Try reducing the number of pages
3. Check the server logs for error messages

## Best Practices

1. **Start with small page counts** (2-5) when testing new categories
2. **Use descriptive category names** that match ASOS's categorization
3. **Monitor the crawling process** to avoid rate limiting
4. **Run migrations** before deploying to production
5. **Keep the subcategory field empty** for now unless you have a specific use case

## Additional Resources

- [ASOS Categories List](./asos-categories.md) - Complete list of all ASOS categories
- [Test Script](./test-asos-categories.sh) - Automated testing script
- [API Reference](./API_REFERENCE.md) - Full API documentation


