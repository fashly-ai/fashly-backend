#!/bin/bash

# ASOS Category Crawling Test Script
# This script provides example curl commands to test the ASOS crawling API with different categories

# Base API URL (change this if your server is running on a different port)
API_URL="http://localhost:3001"

# Number of pages to crawl per category (change this to crawl more pages)
MAX_PAGES=2

echo "========================================"
echo "ASOS Category Crawling Test - All Categories"
echo "========================================"
echo ""
echo "Crawling ${MAX_PAGES} pages per category..."
echo ""

# ========================================
# SHOP BY PRODUCT - Main Categories
# ========================================

# 1. Top Rated Clothing
echo "1/23: Crawling Top Rated Clothing..."
curl -X POST "${API_URL}/crawling/asos-clothing" \
  -H "Content-Type: application/json" \
  -d "{
    \"baseUrl\": \"https://www.asos.com/women/ctas/fashion-online-1/cat/?cid=13489\",
    \"maxPages\": ${MAX_PAGES},
    \"category\": \"Top Rated Clothing\"
  }"
echo -e "\n"

# 2. New In
echo "2/23: Crawling New In..."
curl -X POST "${API_URL}/crawling/asos-clothing" \
  -H "Content-Type: application/json" \
  -d "{
    \"baseUrl\": \"https://www.asos.com/women/new-in/new-in-clothing/cat/?cid=2623\",
    \"maxPages\": ${MAX_PAGES},
    \"category\": \"New In\"
  }"
echo -e "\n"

# 3. Tops
echo "3/23: Crawling Tops..."
curl -X POST "${API_URL}/crawling/asos-clothing" \
  -H "Content-Type: application/json" \
  -d "{
    \"baseUrl\": \"https://www.asos.com/women/tops/cat/?cid=4169\",
    \"maxPages\": ${MAX_PAGES},
    \"category\": \"Tops\"
  }"
echo -e "\n"

# 4. Dresses
echo "4/23: Crawling Dresses..."
curl -X POST "${API_URL}/crawling/asos-clothing" \
  -H "Content-Type: application/json" \
  -d "{
    \"baseUrl\": \"https://www.asos.com/women/dresses/cat/?cid=8799\",
    \"maxPages\": ${MAX_PAGES},
    \"category\": \"Dresses\"
  }"
echo -e "\n"

# 5. Jumpers & Cardigans
echo "5/23: Crawling Jumpers & Cardigans..."
curl -X POST "${API_URL}/crawling/asos-clothing" \
  -H "Content-Type: application/json" \
  -d "{
    \"baseUrl\": \"https://www.asos.com/women/jumpers-cardigans/cat/?cid=2637\",
    \"maxPages\": ${MAX_PAGES},
    \"category\": \"Jumpers & Cardigans\"
  }"
echo -e "\n"

# 6. Coats & Jackets
echo "6/23: Crawling Coats & Jackets..."
curl -X POST "${API_URL}/crawling/asos-clothing" \
  -H "Content-Type: application/json" \
  -d "{
    \"baseUrl\": \"https://www.asos.com/women/coats-jackets/cat/?cid=2641\",
    \"maxPages\": ${MAX_PAGES},
    \"category\": \"Coats & Jackets\"
  }"
echo -e "\n"

# 7. Jeans
echo "7/23: Crawling Jeans..."
curl -X POST "${API_URL}/crawling/asos-clothing" \
  -H "Content-Type: application/json" \
  -d "{
    \"baseUrl\": \"https://www.asos.com/women/jeans/cat/?cid=3630\",
    \"maxPages\": ${MAX_PAGES},
    \"category\": \"Jeans\"
  }"
echo -e "\n"

# 8. Loungewear
echo "8/23: Crawling Loungewear..."
curl -X POST "${API_URL}/crawling/asos-clothing" \
  -H "Content-Type: application/json" \
  -d "{
    \"baseUrl\": \"https://www.asos.com/women/loungewear/cat/?cid=21867\",
    \"maxPages\": ${MAX_PAGES},
    \"category\": \"Loungewear\"
  }"
echo -e "\n"

# 9. Activewear
echo "9/23: Crawling Activewear..."
curl -X POST "${API_URL}/crawling/asos-clothing" \
  -H "Content-Type: application/json" \
  -d "{
    \"baseUrl\": \"https://www.asos.com/women/sportswear/cat/?cid=26091\",
    \"maxPages\": ${MAX_PAGES},
    \"category\": \"Activewear\"
  }"
echo -e "\n"

# 10. Blouses
echo "10/23: Crawling Blouses..."
curl -X POST "${API_URL}/crawling/asos-clothing" \
  -H "Content-Type: application/json" \
  -d "{
    \"baseUrl\": \"https://www.asos.com/women/tops/blouses/cat/?cid=15199\",
    \"maxPages\": ${MAX_PAGES},
    \"category\": \"Blouses\"
  }"
echo -e "\n"

# 11. Hoodies & Sweatshirts
echo "11/23: Crawling Hoodies & Sweatshirts..."
curl -X POST "${API_URL}/crawling/asos-clothing" \
  -H "Content-Type: application/json" \
  -d "{
    \"baseUrl\": \"https://www.asos.com/women/hoodies-sweatshirts/cat/?cid=11321\",
    \"maxPages\": ${MAX_PAGES},
    \"category\": \"Hoodies & Sweatshirts\"
  }"
echo -e "\n"

# 12. Jumpsuits & Playsuits
echo "12/23: Crawling Jumpsuits & Playsuits..."
curl -X POST "${API_URL}/crawling/asos-clothing" \
  -H "Content-Type: application/json" \
  -d "{
    \"baseUrl\": \"https://www.asos.com/women/jumpsuits-playsuits/cat/?cid=7618\",
    \"maxPages\": ${MAX_PAGES},
    \"category\": \"Jumpsuits & Playsuits\"
  }"
echo -e "\n"

# 13. Shirts
echo "13/23: Crawling Shirts..."
curl -X POST "${API_URL}/crawling/asos-clothing" \
  -H "Content-Type: application/json" \
  -d "{
    \"baseUrl\": \"https://www.asos.com/women/tops/shirts/cat/?cid=15200\",
    \"maxPages\": ${MAX_PAGES},
    \"category\": \"Shirts\"
  }"
echo -e "\n"

# 14. Shorts
echo "14/23: Crawling Shorts..."
curl -X POST "${API_URL}/crawling/asos-clothing" \
  -H "Content-Type: application/json" \
  -d "{
    \"baseUrl\": \"https://www.asos.com/women/shorts/cat/?cid=9263\",
    \"maxPages\": ${MAX_PAGES},
    \"category\": \"Shorts\"
  }"
echo -e "\n"

# 15. Skirts
echo "15/23: Crawling Skirts..."
curl -X POST "${API_URL}/crawling/asos-clothing" \
  -H "Content-Type: application/json" \
  -d "{
    \"baseUrl\": \"https://www.asos.com/women/skirts/cat/?cid=2639\",
    \"maxPages\": ${MAX_PAGES},
    \"category\": \"Skirts\"
  }"
echo -e "\n"

# 16. Suits & Tailoring
echo "16/23: Crawling Suits & Tailoring..."
curl -X POST "${API_URL}/crawling/asos-clothing" \
  -H "Content-Type: application/json" \
  -d "{
    \"baseUrl\": \"https://www.asos.com/women/suits-separates/cat/?cid=13632\",
    \"maxPages\": ${MAX_PAGES},
    \"category\": \"Suits & Tailoring\"
  }"
echo -e "\n"

# 17. Waistcoats
echo "17/23: Crawling Waistcoats..."
curl -X POST "${API_URL}/crawling/asos-clothing" \
  -H "Content-Type: application/json" \
  -d "{
    \"baseUrl\": \"https://www.asos.com/women/suits-separates/waistcoats/cat/?cid=51642\",
    \"maxPages\": ${MAX_PAGES},
    \"category\": \"Waistcoats\"
  }"
echo -e "\n"

# ========================================
# SHOP PARTYWEAR Categories
# ========================================

# 18. Essentials (Partywear)
echo "18/23: Crawling Essentials (Partywear)..."
curl -X POST "${API_URL}/crawling/asos-clothing" \
  -H "Content-Type: application/json" \
  -d "{
    \"baseUrl\": \"https://www.asos.com/women/party-wear/cat/?cid=18761\",
    \"maxPages\": ${MAX_PAGES},
    \"category\": \"Essentials\",
    \"subcategory\": \"Partywear\"
  }"
echo -e "\n"

# 19. Sequin Edit (Partywear)
echo "19/23: Crawling Sequin Edit (Partywear)..."
curl -X POST "${API_URL}/crawling/asos-clothing" \
  -H "Content-Type: application/json" \
  -d "{
    \"baseUrl\": \"https://www.asos.com/women/ctas/fashion-online-10/cat/?cid=13508\",
    \"maxPages\": ${MAX_PAGES},
    \"category\": \"Sequin Edit\",
    \"subcategory\": \"Partywear\"
  }"
echo -e "\n"

# 20. Dresses (Partywear)
echo "20/23: Crawling Dresses (Partywear)..."
curl -X POST "${API_URL}/crawling/asos-clothing" \
  -H "Content-Type: application/json" \
  -d "{
    \"baseUrl\": \"https://www.asos.com/women/dresses/party-dresses/cat/?cid=11057\",
    \"maxPages\": ${MAX_PAGES},
    \"category\": \"Dresses\",
    \"subcategory\": \"Partywear\"
  }"
echo -e "\n"

# 21. Tops (Partywear)
echo "21/23: Crawling Tops (Partywear)..."
curl -X POST "${API_URL}/crawling/asos-clothing" \
  -H "Content-Type: application/json" \
  -d "{
    \"baseUrl\": \"https://www.asos.com/women/tops/party-tops/cat/?cid=51447\",
    \"maxPages\": ${MAX_PAGES},
    \"category\": \"Tops\",
    \"subcategory\": \"Partywear\"
  }"
echo -e "\n"

# 22. Shorts & Skirts (Partywear)
echo "22/23: Crawling Shorts & Skirts (Partywear)..."
curl -X POST "${API_URL}/crawling/asos-clothing" \
  -H "Content-Type: application/json" \
  -d "{
    \"baseUrl\": \"https://www.asos.com/women/ctas/france-online-fashion-5/cat/?cid=15345\",
    \"maxPages\": ${MAX_PAGES},
    \"category\": \"Shorts & Skirts\",
    \"subcategory\": \"Partywear\"
  }"
echo -e "\n"


echo "========================================"
echo "All 22 categories crawled!"
echo "========================================"
echo ""
echo "Summary:"
echo "- Total categories: 22"
echo "- Pages per category: ${MAX_PAGES}"
echo "- Expected total pages: $((22 * MAX_PAGES))"
echo ""
echo "Check your database for the crawled items!"
echo ""

