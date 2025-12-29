# ASOS Categories for Crawling

This file contains the ASOS category structure for crawling clothing items.

## SHOP BY PRODUCT

### Main Categories

1. **Top Rated Clothing**
   - Category: `Top Rated Clothing`
   
2. **New in**
   - Category: `New In`
   
3. **Tops**
   - Category: `Tops`
   
4. **Dresses**
   - Category: `Dresses`
   
5. **Jumpers & Cardigans**
   - Category: `Jumpers & Cardigans`
   
6. **Coats & Jackets**
   - Category: `Coats & Jackets`
   
7. **Trousers & Leggings**
   - Category: `Trousers & Leggings`
   
8. **Jeans**
   - Category: `Jeans`
   
9. **Loungewear**
   - Category: `Loungewear`
   
10. **Activewear**
    - Category: `Activewear`
    
11. **Blouses**
    - Category: `Blouses`
    
12. **Hoodies & Sweatshirts**
    - Category: `Hoodies & Sweatshirts`

### Additional Categories

13. **Jumpsuits & Playsuits**
    - Category: `Jumpsuits & Playsuits`
    
14. **Last chance to buy**
    - Category: `Last Chance to Buy`
    
15. **Lingerie & Nightwear**
    - Category: `Lingerie & Nightwear`
    
16. **Premium**
    - Category: `Premium`
    
17. **Shirts**
    - Category: `Shirts`
    
18. **Shorts**
    - Category: `Shorts`
    
19. **Skirts**
    - Category: `Skirts`
    
20. **Socks & Tights**
    - Category: `Socks & Tights`
    
21. **Suits & Tailoring**
    - Category: `Suits & Tailoring`
    
22. **Swimwear & Beachwear**
    - Category: `Swimwear & Beachwear`
    
23. **Waistcoats**
    - Category: `Waistcoats`

## SHOP PARTYWEAR

1. **Essentials**
   - Category: `Partywear - Essentials`
   
2. **Sequin edit**
   - Category: `Partywear - Sequin Edit`
   
3. **Dresses**
   - Category: `Partywear - Dresses`
   
4. **Tops**
   - Category: `Partywear - Tops`
   
5. **Shorts & Skirts**
   - Category: `Partywear - Shorts & Skirts`
   
6. **Shoes & Accessories**
   - Category: `Partywear - Shoes & Accessories`

## API Usage

To crawl a specific category, make a POST request to:

```bash
POST /crawling/asos-clothing
Content-Type: application/json

{
  "baseUrl": "<ASOS_CATEGORY_URL>",
  "maxPages": 10,
  "category": "Dresses"
}
```

### Example cURL Commands

```bash
# Crawl Dresses category
curl -X POST http://localhost:3000/crawling/asos-clothing \
  -H "Content-Type: application/json" \
  -d '{
    "baseUrl": "https://www.asos.com/women/dresses/cat/?cid=8799",
    "maxPages": 5,
    "category": "Dresses"
  }'

# Crawl Tops category
curl -X POST http://localhost:3000/crawling/asos-clothing \
  -H "Content-Type: application/json" \
  -d '{
    "baseUrl": "https://www.asos.com/women/tops/cat/?cid=4169",
    "maxPages": 5,
    "category": "Tops"
  }'

# Crawl Jeans category
curl -X POST http://localhost:3000/crawling/asos-clothing \
  -H "Content-Type: application/json" \
  -d '{
    "baseUrl": "https://www.asos.com/women/jeans/cat/?cid=3630",
    "maxPages": 5,
    "category": "Jeans"
  }'
```

## Notes

- The `category` field will be saved to the database with each clothing item
- The `subcategory` field is currently kept empty and can be populated in future updates
- Each category URL can be found by navigating to the ASOS website and inspecting the category page URL
- The `cid` parameter in the URL represents the category ID

