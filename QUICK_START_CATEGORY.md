# Quick Start: ASOS Category Crawling

## 🚀 Get Started in 3 Steps

### Step 1: Run the Migration

```bash
npm run migration:run
```

This adds the `subcategory` field and indexes the `category` field in your database.

### Step 2: Start Your Server

```bash
npm run start:dev
```

### Step 3: Crawl with Categories

```bash
curl -X POST http://localhost:3000/crawling/asos-clothing \
  -H "Content-Type: application/json" \
  -d '{
    "baseUrl": "https://www.asos.com/women/dresses/cat/?cid=8799",
    "maxPages": 5,
    "category": "Dresses"
  }'
```

## 📋 Popular Categories

Copy and paste these curl commands:

### Dresses
```bash
curl -X POST http://localhost:3000/crawling/asos-clothing -H "Content-Type: application/json" -d '{"baseUrl": "https://www.asos.com/women/dresses/cat/?cid=8799", "maxPages": 5, "category": "Dresses"}'
```

### Tops
```bash
curl -X POST http://localhost:3000/crawling/asos-clothing -H "Content-Type: application/json" -d '{"baseUrl": "https://www.asos.com/women/tops/cat/?cid=4169", "maxPages": 5, "category": "Tops"}'
```

### Jeans
```bash
curl -X POST http://localhost:3000/crawling/asos-clothing -H "Content-Type: application/json" -d '{"baseUrl": "https://www.asos.com/women/jeans/cat/?cid=3630", "maxPages": 5, "category": "Jeans"}'
```

### Coats & Jackets
```bash
curl -X POST http://localhost:3000/crawling/asos-clothing -H "Content-Type: application/json" -d '{"baseUrl": "https://www.asos.com/women/coats-jackets/cat/?cid=2641", "maxPages": 5, "category": "Coats & Jackets"}'
```

## 🧪 Run All Tests

```bash
./test-asos-categories.sh
```

## 📊 Query Your Data

```sql
-- Count items by category
SELECT category, COUNT(*) as count 
FROM clothes 
WHERE is_active = true 
GROUP BY category;

-- Get all dresses
SELECT * FROM clothes WHERE category = 'Dresses' AND is_active = true;
```

## 📚 More Information

- **Full Guide**: [ASOS_CATEGORY_GUIDE.md](./ASOS_CATEGORY_GUIDE.md)
- **All Categories**: [asos-categories.md](./asos-categories.md)
- **Summary**: [CATEGORY_UPDATE_SUMMARY.md](./CATEGORY_UPDATE_SUMMARY.md)

## ✅ What Changed?

- ✅ Added `subcategory` field to clothes entity (ready for future use)
- ✅ Added index on `category` field for faster queries
- ✅ Updated ASOS crawling API to accept category parameter
- ✅ Created comprehensive documentation and test scripts

## 🎯 Usage Template

```bash
curl -X POST http://localhost:3000/crawling/asos-clothing \
  -H "Content-Type: application/json" \
  -d '{
    "baseUrl": "<YOUR_ASOS_CATEGORY_URL>",
    "maxPages": <NUMBER_OF_PAGES>,
    "category": "<CATEGORY_NAME>"
  }'
```

**That's it! You're ready to crawl ASOS by category! 🎉**


