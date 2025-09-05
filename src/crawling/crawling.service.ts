import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import puppeteer, { Browser, Page } from 'puppeteer';
import {
  CrawledProductDto,
  CrawlingResultDto,
} from './dto/crawled-product.dto';
import { Glasses } from '../database/entities/glasses.entity';

@Injectable()
export class CrawlingService {
  private readonly logger = new Logger(CrawlingService.name);

  constructor(
    @InjectRepository(Glasses)
    private readonly glassesRepository: Repository<Glasses>,
  ) {}

  async crawlGentleMonsterGlasses(): Promise<CrawlingResultDto> {
    this.logger.log('Starting Gentle Monster glasses crawling...');

    let browser: Browser | undefined;
    let page: Page;

    try {
      // Launch browser
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
        ],
      });
      page = await browser.newPage();

      // Set user agent
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      );

      // Set viewport
      await page.setViewport({ width: 1920, height: 1080 });

      // Navigate to the glasses page with hardcoded limit=1000 to load all products
      const url = 'https://www.gentlemonster.com/us/en/category/glasses/view-all?limit=1000';
      this.logger.log(`Navigating to: ${url}`);

      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Handle cookie consent popup
      try {
        // Wait for cookie popup to appear and click "ACCEPT ALL"
        const acceptButton = await page.waitForSelector('button', { timeout: 5000 });
        
        // Find and click the ACCEPT ALL button by text content
        const acceptClicked = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const acceptButton = buttons.find(btn => 
            btn.textContent?.includes('ACCEPT ALL') || 
            btn.textContent?.includes('Accept All') ||
            btn.textContent?.includes('Accept all')
          );
          
          if (acceptButton) {
            acceptButton.click();
            return true;
          }
          return false;
        });
        
        if (acceptClicked) {
          this.logger.log('Clicked ACCEPT ALL for cookies');
          
          // Wait a bit for the popup to close
          await new Promise(resolve => setTimeout(resolve, 2000));
          
          // Check if there's a SAVE button and click it
          try {
            const saveClicked = await page.evaluate(() => {
              const buttons = Array.from(document.querySelectorAll('button'));
              const saveButton = buttons.find(btn => 
                btn.textContent?.includes('SAVE') || 
                btn.textContent?.includes('Save')
              );
              
              if (saveButton) {
                saveButton.click();
                return true;
              }
              return false;
            });
            
            if (saveClicked) {
              this.logger.log('Clicked SAVE for cookie preferences');
              await new Promise(resolve => setTimeout(resolve, 2000));
            }
          } catch (saveError) {
            this.logger.log('No SAVE button found or already closed');
          }
        }
      } catch (cookieError) {
        this.logger.log('No cookie popup found or already handled');
      }

      // Wait for products to load with additional time after cookie handling
      await page.waitForSelector('.product.visible', { timeout: 20000 });
      
      // Wait additional time for all products to load dynamically
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Handle "Load More" button pagination
      this.logger.log('Checking for "Load More" button to load all products...');
      let loadMoreAttempts = 0;
      const maxLoadMoreAttempts = 20; // Safety limit
      
      while (loadMoreAttempts < maxLoadMoreAttempts) {
        // Check if there's a "More" button and click it
        const moreButtonClicked = await page.evaluate(() => {
          // Look for the "More" button with various selectors
          const moreButtons = Array.from(document.querySelectorAll('button'));
          const moreButton = moreButtons.find(btn => 
            btn.textContent?.includes('More') ||
            btn.textContent?.includes('Load More') ||
            btn.textContent?.includes('Show More') ||
            btn.querySelector('span')?.textContent?.includes('More')
          );
          
          if (moreButton && !moreButton.disabled) {
            console.log('Found and clicking More button');
            moreButton.click();
            return true;
          }
          return false;
        });
        
        if (!moreButtonClicked) {
          this.logger.log('No more "Load More" button found or button is disabled');
          break;
        }
        
        this.logger.log(`Clicked "Load More" button (attempt ${loadMoreAttempts + 1})`);
        loadMoreAttempts++;
        
        // Wait for new products to load
        await new Promise(resolve => setTimeout(resolve, 3000));
        
        // Check the current count
        const currentCount = await page.evaluate(() => {
          return document.querySelectorAll('a[href*="/item/"]').length;
        });
        
        this.logger.log(`After load more attempt ${loadMoreAttempts}: Found ${currentCount} products`);
      }
      
      this.logger.log(`Finished loading more products. Made ${loadMoreAttempts} load more attempts`);

      // Add comprehensive debugging to see how many products are found with different selectors
      const debugInfo = await page.evaluate(() => {
        const selectors = [
          '.product.visible',
          '.product',
          '[class*="product"]',
          '.item',
          '[data-product]',
          '.product-item',
          '.listing-item',
          '[class*="item"]'
        ];
        
        const results = {};
        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          results[selector] = elements.length;
        });
        
        // Also check for common e-commerce patterns
        const commonPatterns = {
          'divs_with_links': document.querySelectorAll('div a[href*="/item/"]').length,
          'total_links_to_items': document.querySelectorAll('a[href*="/item/"]').length,
          'images_with_gentlemonster': document.querySelectorAll('img[src*="gentlemonster"]').length,
          'page_scroll_height': document.body.scrollHeight,
          'page_client_height': document.documentElement.clientHeight,
        };
        
        return { selectors: results, patterns: commonPatterns };
      });
      
      this.logger.log('Debug info:', JSON.stringify(debugInfo, null, 2));
      
      const productCount = debugInfo.selectors['.product.visible'] || 0;
      this.logger.log(`Found ${productCount} product elements with .product.visible selector`);

      // Trigger all swiper carousels to load all images
      this.logger.log('Triggering swiper carousels to load all images...');
      await page.evaluate(() => {
        const swipers = document.querySelectorAll('.swiper-container, .swiper');
        console.log(`Found ${swipers.length} swiper containers`);
        
        swipers.forEach((swiper, swiperIndex) => {
          const nextButton = swiper.querySelector('.swiper-button-next');
          const prevButton = swiper.querySelector('.swiper-button-prev');
          
          if (nextButton) {
            // Click next button multiple times to cycle through all slides
            for (let i = 0; i < 8; i++) {
              try {
                (nextButton as HTMLElement).click();
                // Small delay between clicks
                setTimeout(() => {}, 100);
              } catch (e) {
                // Ignore click errors
              }
            }
            
            // Click prev button to go back to start
            if (prevButton) {
              for (let i = 0; i < 8; i++) {
                try {
                  (prevButton as HTMLElement).click();
                  setTimeout(() => {}, 100);
                } catch (e) {
                  // Ignore click errors
                }
              }
            }
          }
        });
      });
      
      // Wait for images to load after swiper interactions
      await new Promise(resolve => setTimeout(resolve, 3000));

      // Extract product data with multiple selector strategies
      let products = await page.evaluate(() => {
        // First strategy: Find all links to item pages and work backwards to find product containers
        const itemLinks = Array.from(document.querySelectorAll('a[href*="/item/"]'));
        console.log(`Found ${itemLinks.length} item links on the page`);
        
        let productElements: HTMLElement[] = [];
        let usedSelector = '';
        
        if (itemLinks.length > 8) {
          // Use the item links to find their parent product containers
          const linkBasedElements = itemLinks.map(link => {
            // Try to find the closest product container
            let parent = link.parentElement;
            while (parent && parent !== document.body) {
              if (parent.classList.contains('product') || 
                  parent.classList.contains('item') ||
                  parent.querySelector('img[src*="gentlemonster"]')) {
                return parent;
              }
              parent = parent.parentElement;
            }
            return link.closest('div'); // Fallback to closest div
          }).filter((el): el is HTMLElement => el !== null);
          
          productElements = linkBasedElements;
          usedSelector = 'item-link-based';
          console.log(`Using item-link-based strategy - found ${productElements.length} product containers`);
        } else {
          // Fallback to original selector strategy
          const selectors = [
            '.product.visible',
            '.product',
            '[class*="product"]',
            '.item',
            '[data-product]',
            '.product-item',
            '.listing-item'
          ];
          
          // Find the selector that returns the most elements
          for (const selector of selectors) {
            const elements = Array.from(document.querySelectorAll(selector)) as HTMLElement[];
            if (elements.length > productElements.length) {
              productElements = elements;
              usedSelector = selector;
            }
          }
          
          console.log(`Using selector "${usedSelector}" - found ${productElements.length} elements`);
        }
        
        const results: Array<{
          name: string;
          productUrl: string;
          imageUrl: string;
          price?: string;
          allImages?: string[];
        }> = [];

        console.log(`Processing ${productElements.length} product elements...`);

        productElements.forEach((element, index) => {
          try {
            // Extract product name with multiple fallback selectors
            const nameSelectors = [
              'em.__className_bbeda3',
              'em',
              '.product-name',
              '.item-name',
              'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
              '[class*="name"]',
              '[class*="title"]'
            ];
            
            let name = '';
            for (const selector of nameSelectors) {
              const nameElement = element.querySelector(selector);
              if (nameElement?.textContent?.trim()) {
                name = nameElement.textContent.trim();
                break;
              }
            }

            // Extract product URL with multiple fallback selectors
            const linkSelectors = [
              'a[href*="/item/"]',
              'a[href*="/product/"]',
              'a[href*="gentlemonster.com"]',
              'a'
            ];
              
            let productUrl = '';
            for (const selector of linkSelectors) {
              const linkElement = element.querySelector(selector);
              const href = linkElement?.getAttribute('href');
              if (href && (href.includes('/item/') || href.includes('/product/') || href.includes('gentlemonster'))) {
                productUrl = href;
                break;
              }
            }

            // Make URL absolute if it's relative
            if (productUrl && !productUrl.startsWith('http')) {
              productUrl = `https://www.gentlemonster.com${productUrl}`;
            }

            // Extract image URLs from the swiper carousel (keep it simple)
            const allImages: string[] = [];
            const swiperSlides = element.querySelectorAll('.swiper-slide img');
            
            swiperSlides.forEach(img => {
              const src = img.getAttribute('src') || img.getAttribute('data-src');
              if (src && src.includes('gentlemonster') && !src.includes('PACKAGE')) {
                allImages.push(src);
              }
            });
            
            // Use the first good image, or fallback to any gentlemonster image
            let imageUrl = allImages[0] || '';
            if (!imageUrl) {
              // Fallback to any gentlemonster image even if it's a package image
              const anyImg = element.querySelector('img[src*="gentlemonster"]');
              imageUrl = anyImg?.getAttribute('src') || '';
            }

            // Extract price with multiple fallback selectors
            const priceSelectors = [
              'p.__className_bbeda3',
              'p',
              '.price',
              '.item-price',
              '[class*="price"]'
            ];
            
            let price = '';
            for (const selector of priceSelectors) {
              const priceElement = element.querySelector(selector);
              if (priceElement?.textContent?.trim()) {
                price = priceElement.textContent.trim();
                break;
              }
            }

            // Log what we found for debugging
            console.log(`Product ${index + 1}:`, {
              name: name || 'NO NAME',
              productUrl: productUrl || 'NO URL', 
              imageUrl: imageUrl || 'NO IMAGE',
              price: price || 'NO PRICE'
            });

            // Only add if we have all required data
            if (name && productUrl && imageUrl) {
              results.push({
                name: name,
                productUrl: productUrl,
                imageUrl: imageUrl,
                price: price,
                allImages: allImages.length > 0 ? allImages : undefined,
              });
            } else {
              console.log(`Skipping product ${index + 1} - missing required data`);
            }
          } catch (error) {
            console.log('Error processing product element:', error);
          }
        });

        // Remove duplicates based on product URL
        const uniqueResults: Array<{
          name: string;
          productUrl: string;
          imageUrl: string;
          price?: string;
          allImages?: string[];
        }> = [];
        const seenUrls = new Set<string>();
        
        results.forEach(product => {
          if (!seenUrls.has(product.productUrl)) {
            seenUrls.add(product.productUrl);
            uniqueResults.push(product);
          }
        });
        
        console.log(`After deduplication: ${uniqueResults.length} unique products from ${results.length} total`);
        return uniqueResults;
      });

      // Fallback for alternative product structure if initial attempt yields no results
      if (products.length === 0) {
        this.logger.warn(
          'No products found with primary selectors, trying alternative selectors...',
        );
        const alternativeProducts: Array<{
          name: string;
          productUrl: string;
          imageUrl: string;
          price?: string;
        }> = await page.evaluate(() => {
          const altProductElements = document.querySelectorAll(
            '.product-list-item, .item-card',
          );
          const altResults: Array<{
            name: string;
            productUrl: string;
            imageUrl: string;
            price?: string;
          }> = [];

          altProductElements.forEach((element) => {
            try {
              const name =
                element.querySelector('.item-name')?.textContent?.trim() ||
                element.querySelector('.product-name')?.textContent?.trim() ||
                '';
              let productUrl =
                element.querySelector('a')?.getAttribute('href') || '';
              const imageUrl =
                element.querySelector('img')?.getAttribute('src') ||
                element.querySelector('img')?.getAttribute('data-src') ||
                '';
              const price =
                element.querySelector('.item-price')?.textContent?.trim() || '';

              if (productUrl && !productUrl.startsWith('http')) {
                productUrl = `https://www.gentlemonster.com${productUrl}`;
              }

              if (name && productUrl && imageUrl) {
                altResults.push({
                  name: name,
                  productUrl: productUrl,
                  imageUrl: imageUrl,
                  price: price,
                });
              }
            } catch (error) {
              console.log('Error processing alternative product element:', error);
            }
          });
          return altResults;
        });
        products.push(...alternativeProducts);
      }

      await browser.close();

      // Save products to database
      const savedProducts = await this.saveProductsToDatabase(products);

      const result: CrawlingResultDto = {
        products: products,
        totalCount: products.length,
        crawledAt: new Date().toISOString(),
      };

      this.logger.log(
        `Crawling completed successfully. Found ${products.length} products, saved ${savedProducts.length} to database.`,
      );
      return result;
    } catch (error) {
      this.logger.error('Error during crawling:', error);

      if (browser) {
        await browser.close();
      }

      throw new Error(
        `Failed to crawl Gentle Monster: ${(error as Error).message}`,
      );
    }
  }

  async crawlGentleMonsterSunglasses(): Promise<CrawlingResultDto> {
    this.logger.log('Starting Gentle Monster sunglasses crawling...');

    let browser: Browser | undefined;
    let page: Page;

    try {
      // Launch browser
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
        ],
      });
      page = await browser.newPage();

      // Set user agent
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      );

      // Set viewport
      await page.setViewport({ width: 1920, height: 1080 });

      // Navigate to the sunglasses page with hardcoded limit=1000 to load all products
      const url = 'https://www.gentlemonster.com/us/en/category/sunglasses/view-all?limit=1000';
      this.logger.log(`Navigating to: ${url}`);

      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000,
      });

      // Handle cookie consent popup
      try {
        // Wait for cookie popup to appear and click "ACCEPT ALL"
        const acceptButton = await page.waitForSelector('button', { timeout: 5000 });
        
        // Find and click the ACCEPT ALL button by text content
        const acceptClicked = await page.evaluate(() => {
          const buttons = Array.from(document.querySelectorAll('button'));
          const acceptButton = buttons.find(btn => 
            btn.textContent?.includes('ACCEPT ALL') || 
            btn.textContent?.includes('Accept All') ||
            btn.textContent?.includes('ACCEPT') ||
            btn.getAttribute('data-testid')?.includes('accept')
          );
          if (acceptButton) {
            (acceptButton as HTMLElement).click();
            return true;
          }
          return false;
        });

        if (acceptClicked) {
          this.logger.log('Clicked ACCEPT ALL for cookies');
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      } catch (cookieError) {
        this.logger.log('No cookie popup found or already accepted');
      }

      // Handle "Load More" button to get all products
      this.logger.log('Handling Load More button to get all products...');
      let loadMoreClicks = 0;
      const maxLoadMoreClicks = 20; // Safety limit

      while (loadMoreClicks < maxLoadMoreClicks) {
        try {
          // Look for "More" button
          const moreButtonExists = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            return buttons.some(btn => 
              btn.textContent?.includes('More') || 
              btn.textContent?.includes('Load More') ||
              btn.classList.contains('btn-more')
            );
          });

          if (!moreButtonExists) {
            this.logger.log('No more "Load More" button found, all products loaded');
            break;
          }

          // Click the "More" button
          const clicked = await page.evaluate(() => {
            const buttons = Array.from(document.querySelectorAll('button'));
            const moreButton = buttons.find(btn => 
              btn.textContent?.includes('More') || 
              btn.textContent?.includes('Load More') ||
              btn.classList.contains('btn-more')
            );
            if (moreButton && !(moreButton as HTMLButtonElement).disabled) {
              (moreButton as HTMLElement).click();
              return true;
            }
            return false;
          });

          if (clicked) {
            loadMoreClicks++;
            this.logger.log(`Clicked "Load More" button (${loadMoreClicks}/${maxLoadMoreClicks})`);
            // Wait for new products to load
            await new Promise(resolve => setTimeout(resolve, 3000));
          } else {
            this.logger.log('Could not click "Load More" button, might be disabled or not found');
            break;
          }
        } catch (error) {
          this.logger.log(`Error clicking "Load More" button: ${(error as Error).message}`);
          break;
        }
      }

      // Wait for products to load
      await page.waitForSelector('.product.visible', { timeout: 20000 });
      
      // Wait additional time for all products to load dynamically
      await new Promise(resolve => setTimeout(resolve, 3000));
      
      // Add debugging to see how many products are found
      const debugInfo = await page.evaluate(() => {
        const selectors = [
          '.product.visible',
          '.product',
          '[class*="product"]',
          '.item',
          '[data-product]',
          '.product-item',
          '.listing-item',
          '[class*="item"]'
        ];
        
        const results = {};
        selectors.forEach(selector => {
          const elements = document.querySelectorAll(selector);
          results[selector] = elements.length;
        });
        
        return { selectors: results };
      });
      
      const productCount = debugInfo.selectors['.product.visible'] || 0;
      this.logger.log(`Found ${productCount} sunglasses product elements`);

      // Extract product data using the same logic as glasses
      let products = await page.evaluate(() => {
        // Find all links to item pages and work backwards to find product containers
        const itemLinks = Array.from(document.querySelectorAll('a[href*="/item/"]'));
        console.log(`Found ${itemLinks.length} item links on the page`);
        
        let productElements: HTMLElement[] = [];
        
        if (itemLinks.length > 8) {
          // Use the item links to find their parent product containers
          const linkBasedElements = itemLinks.map(link => {
            // Try to find the closest product container
            let parent = link.parentElement;
            while (parent && parent !== document.body) {
              if (parent.classList.contains('product') || 
                  parent.classList.contains('item') ||
                  parent.querySelector('img[src*="gentlemonster"]')) {
                return parent as HTMLElement;
              }
              parent = parent.parentElement;
            }
            return link.closest('div') as HTMLElement;
          }).filter((el): el is HTMLElement => el !== null);
          
          productElements = linkBasedElements;
        } else {
          // Fallback to traditional selectors
          const selectors = [
            '.product.visible',
            '.product',
            '[class*="product"]',
            '.item',
            '[data-product]',
            '.product-item',
            '.listing-item'
          ];
          
          for (const selector of selectors) {
            const elements = Array.from(document.querySelectorAll(selector)) as HTMLElement[];
            if (elements.length > productElements.length) {
              productElements = elements;
            }
          }
        }
        
        console.log(`Processing ${productElements.length} sunglasses product elements...`);

        const results: Array<{
          name: string;
          productUrl: string;
          imageUrl: string;
          price?: string;
          allImages?: string[];
        }> = [];

        productElements.forEach((element, index) => {
          try {
            // Extract product name
            const nameSelectors = [
              'em.__className_bbeda3',
              'em[class*="__className"]',
              '.product-name',
              '.item-name',
              'h3',
              'h4',
              '.name',
              'em'
            ];
            
            let name = '';
            for (const selector of nameSelectors) {
              const nameElement = element.querySelector(selector);
              if (nameElement?.textContent?.trim()) {
                name = nameElement.textContent.trim();
                break;
              }
            }

            // Extract product URL
            const linkElement = element.querySelector('a[href*="/item/"]');
            let productUrl = linkElement?.getAttribute('href') || '';
            if (productUrl && !productUrl.startsWith('http')) {
              productUrl = `https://www.gentlemonster.com${productUrl}`;
            }

            // Extract image URL
            const imageSelectors = [
              '.swiper-slide img',
              'img',
              '[class*="image"] img',
              '[class*="photo"] img'
            ];
            
            let imageUrl = '';
            for (const selector of imageSelectors) {
              const imgElement = element.querySelector(selector);
              const src = imgElement?.getAttribute('src') || imgElement?.getAttribute('data-src');
              if (src && src.includes('gentlemonster')) {
                imageUrl = src;
                break;
              }
            }
            if (imageUrl && !imageUrl.startsWith('http')) {
              imageUrl = `https://www.gentlemonster.com${imageUrl}`;
            }

            // Extract price
            const priceSelectors = [
              'p.__className_bbeda3',
              'p[class*="__className"]',
              '.price',
              '.product-price',
              '.item-price',
              'p'
            ];
            
            let price = '';
            for (const selector of priceSelectors) {
              const priceElement = element.querySelector(selector);
              const priceText = priceElement?.textContent?.trim();
              if (priceText && (priceText.includes('$') || priceText.includes('₫'))) {
                price = priceText;
                break;
              }
            }

            // Extract all images from carousel
            const allImages: string[] = [];
            const swiperSlides = element.querySelectorAll('.swiper-slide img');
            swiperSlides.forEach(img => {
              const src = img.getAttribute('src') || img.getAttribute('data-src');
              if (src && src.includes('gentlemonster') && !src.includes('PACKAGE')) {
                allImages.push(src);
              }
            });

            if (name && productUrl && imageUrl) {
              results.push({
                name: name,
                productUrl: productUrl,
                imageUrl: imageUrl,
                price: price,
                allImages: allImages.length > 0 ? allImages : undefined,
              });
            }
          } catch (error) {
            console.log('Error processing sunglasses product element:', error);
          }
        });

        // Remove duplicates
        const uniqueResults: Array<{
          name: string;
          productUrl: string;
          imageUrl: string;
          price?: string;
          allImages?: string[];
        }> = [];
        const seenUrls = new Set<string>();
        
        results.forEach(product => {
          if (!seenUrls.has(product.productUrl)) {
            seenUrls.add(product.productUrl);
            uniqueResults.push(product);
          }
        });
        
        console.log(`After deduplication: ${uniqueResults.length} unique sunglasses products`);
        return uniqueResults;
      });

      await browser.close();

      // Save products to database with "Sunglasses" category
      const savedProducts = await this.saveProductsToDatabase(products, 'Sunglasses');

      const result: CrawlingResultDto = {
        products: products,
        totalCount: products.length,
        crawledAt: new Date().toISOString(),
      };

      this.logger.log(
        `Sunglasses crawling completed successfully. Found ${products.length} products, saved ${savedProducts.length} to database.`,
      );
      return result;
    } catch (error) {
      this.logger.error(
        `Failed to crawl Gentle Monster Sunglasses: ${(error as Error).message}`,
      );
      throw new Error(`Failed to crawl Gentle Monster Sunglasses: ${(error as Error).message}`);
    } finally {
      if (browser) {
        await browser.close();
      }
    }
  }

  async crawlWithCustomSelectors(
    url: string,
    productSelector: string,
    nameSelector: string,
    linkSelector: string,
    imageSelector: string,
    priceSelector?: string,
  ): Promise<CrawlingResultDto> {
    this.logger.log(`Starting custom crawling for: ${url}`);

    let browser: Browser | undefined;
    let page: Page;

    try {
      browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--single-process',
          '--disable-gpu',
        ],
      });
      page = await browser.newPage();
      await page.setUserAgent(
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
      );
      await page.setViewport({ width: 1920, height: 1080 });
      await page.goto(url, { waitUntil: 'networkidle2', timeout: 30000 });

      const products = await page.evaluate(
        (
          prodSelector,
          nmSelector,
          lnkSelector,
          imgSelector,
          prcSelector,
        ) => {
          const productElements = document.querySelectorAll(prodSelector);
          const results: Array<{
            name: string;
            productUrl: string;
            imageUrl: string;
            price?: string;
          }> = [];

          productElements.forEach((element) => {
            try {
              const name =
                element.querySelector(nmSelector)?.textContent?.trim() || '';
              let productUrl =
                element.querySelector(lnkSelector)?.getAttribute('href') || '';
              const imageUrl =
                element.querySelector(imgSelector)?.getAttribute('src') ||
                element.querySelector(imgSelector)?.getAttribute('data-src') ||
                '';
              const price = prcSelector
                ? element.querySelector(prcSelector)?.textContent?.trim() || ''
                : '';

              if (productUrl && !productUrl.startsWith('http')) {
                productUrl = new URL(productUrl, url).href;
              }

              if (name && productUrl && imageUrl) {
                results.push({
                  name: name,
                  productUrl: productUrl,
                  imageUrl: imageUrl,
                  price: price,
                });
              }
            } catch (error) {
              console.log('Error processing custom product element:', error);
            }
          });
          return results;
        },
        productSelector,
        nameSelector,
        linkSelector,
        imageSelector,
        priceSelector,
      );

      await browser.close();

      const savedProducts = await this.saveProductsToDatabase(products);

      const result: CrawlingResultDto = {
        products: products,
        totalCount: products.length,
        crawledAt: new Date().toISOString(),
      };

      this.logger.log(
        `Custom crawling completed successfully. Found ${products.length} products, saved ${savedProducts.length} to database.`,
      );
      return result;
    } catch (error) {
      this.logger.error('Error during custom crawling:', error);

      if (browser) {
        await browser.close();
      }

      throw new Error(`Failed to crawl ${url}: ${(error as Error).message}`);
    }
  }

  private async saveProductsToDatabase(
    products: CrawledProductDto[],
    category: string = 'Glasses',
  ): Promise<Glasses[]> {
    this.logger.log(`Saving ${products.length} products to database...`);

    const savedProducts: Glasses[] = [];

    for (const product of products) {
      try {
        // Check if product already exists by URL
        const existingGlasses = await this.glassesRepository.findOne({
          where: { productUrl: product.productUrl },
        });

        if (existingGlasses) {
          // Update existing product
          existingGlasses.name = product.name;
          existingGlasses.imageUrl = product.imageUrl;
          if (product.allImages) {
            existingGlasses.setAllImagesArray(product.allImages);
          }
          existingGlasses.brand = 'Gentle Monster';
          existingGlasses.category = 'Glasses';
          existingGlasses.price = product.price;
          existingGlasses.updatedAt = new Date();

          const updated = await this.glassesRepository.save(existingGlasses);
          savedProducts.push(updated);
          this.logger.debug(`Updated existing product: ${product.name}`);
        } else {
          // Create new product
          const newGlasses = this.glassesRepository.create({
            name: product.name,
            productUrl: product.productUrl,
            imageUrl: product.imageUrl,
            brand: 'Gentle Monster',
            category: 'Glasses',
            price: product.price,
            isActive: true,
          });
          
          if (product.allImages) {
            newGlasses.setAllImagesArray(product.allImages);
          }

          const saved = await this.glassesRepository.save(newGlasses);
          savedProducts.push(saved);
          this.logger.debug(`Created new product: ${product.name}`);
        }
      } catch (error) {
        this.logger.error(`Error saving product ${product.name}:`, error);
      }
    }

    this.logger.log(
      `Successfully saved ${savedProducts.length} products to database`,
    );
    return savedProducts;
  }

  async getAllGlasses(): Promise<Glasses[]> {
    return this.glassesRepository.find({
      where: { isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async getAllGlassesWithParsedImages(): Promise<Array<any>> {
    const glasses = await this.getAllGlasses();
    return glasses.map(glass => ({
      ...glass,
      allImagesArray: glass.getAllImagesArray(),
    }));
  }

  async getGlassesByBrand(brand: string): Promise<Glasses[]> {
    return this.glassesRepository.find({
      where: { brand, isActive: true },
      order: { createdAt: 'DESC' },
    });
  }

  async deleteGlasses(id: string): Promise<void> {
    await this.glassesRepository.update(id, { isActive: false });
  }
} 