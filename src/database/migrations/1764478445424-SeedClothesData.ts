import { MigrationInterface, QueryRunner } from 'typeorm';

export class SeedClothesData1764478445424 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      INSERT INTO clothes (name, brand, "clothingType", description, price, currency, "imageUrl", color, sizes, material, category, season, style, tags, "isActive", "inStock")
      VALUES
      -- Upper Clothes
      ('Classic White T-Shirt', 'Nike', 'upper', 'Comfortable cotton t-shirt perfect for everyday wear', 29.99, 'USD', 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab', 'white', 'S,M,L,XL,XXL', '100% Cotton', 'casual', 'all-season', 'classic', 'basic,essential,comfortable', true, true),
      ('Black Hoodie', 'Adidas', 'upper', 'Warm and cozy hoodie with front pocket', 59.99, 'USD', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7', 'black', 'S,M,L,XL', '80% Cotton, 20% Polyester', 'casual', 'winter', 'sporty', 'warm,comfortable,trendy', true, true),
      ('Blue Denim Jacket', 'Levi''s', 'upper', 'Classic denim jacket with button closure', 89.99, 'USD', 'https://images.unsplash.com/photo-1551028719-00167b16eac5', 'blue', 'S,M,L,XL', '100% Denim', 'casual', 'spring', 'classic', 'timeless,versatile,denim', true, true),
      ('Red Sports Jersey', 'Puma', 'upper', 'Breathable sports jersey for active lifestyle', 39.99, 'USD', 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990', 'red', 'S,M,L,XL,XXL', 'Polyester', 'sports', 'summer', 'athletic', 'breathable,sporty,performance', true, true),
      ('Gray Sweatshirt', 'Champion', 'upper', 'Comfortable sweatshirt for casual wear', 49.99, 'USD', 'https://images.unsplash.com/photo-1556821840-3a63f95609a7', 'gray', 'M,L,XL,XXL', '70% Cotton, 30% Polyester', 'casual', 'fall', 'relaxed', 'comfortable,casual,soft', true, true),
      ('White Button-Up Shirt', 'Calvin Klein', 'upper', 'Elegant button-up shirt for formal occasions', 79.99, 'USD', 'https://images.unsplash.com/photo-1602810318383-e386cc2a3ccf', 'white', 'S,M,L,XL', '100% Cotton', 'formal', 'all-season', 'elegant', 'professional,formal,crisp', true, true),
      ('Green Polo Shirt', 'Lacoste', 'upper', 'Classic polo shirt with embroidered logo', 69.99, 'USD', 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990', 'green', 'S,M,L,XL', 'Pique Cotton', 'casual', 'summer', 'preppy', 'casual,classic,logo', true, true),
      ('Black Leather Jacket', 'Zara', 'upper', 'Stylish leather jacket with zipper details', 199.99, 'USD', 'https://images.unsplash.com/photo-1551028719-00167b16eac5', 'black', 'S,M,L,XL', 'Genuine Leather', 'formal', 'winter', 'edgy', 'stylish,leather,premium', true, true),
      ('Navy Sweater', 'H&M', 'upper', 'Cozy knit sweater for cold days', 44.99, 'USD', 'https://images.unsplash.com/photo-1620799139834-6b8f844fbe94', 'navy', 'S,M,L,XL', 'Wool Blend', 'casual', 'winter', 'cozy', 'warm,knit,comfortable', true, true),
      ('Yellow Tank Top', 'Under Armour', 'upper', 'Lightweight tank top for workouts', 24.99, 'USD', 'https://images.unsplash.com/photo-1618354691373-d851c5c3a990', 'yellow', 'S,M,L,XL', 'Polyester', 'sports', 'summer', 'athletic', 'lightweight,breathable,bright', true, true),
      
      -- Lower Clothes
      ('Blue Jeans', 'Levi''s', 'lower', 'Classic blue denim jeans with straight fit', 79.99, 'USD', 'https://images.unsplash.com/photo-1542272604-787c3835535d', 'blue', '28,30,32,34,36,38', '100% Denim', 'casual', 'all-season', 'classic', 'denim,versatile,essential', true, true),
      ('Black Chinos', 'Dockers', 'lower', 'Comfortable chino pants for casual and formal wear', 59.99, 'USD', 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80', 'black', '28,30,32,34,36,38', '97% Cotton, 3% Elastane', 'casual', 'all-season', 'smart-casual', 'versatile,comfortable,modern', true, true),
      ('Gray Sweatpants', 'Champion', 'lower', 'Cozy sweatpants perfect for lounging', 39.99, 'USD', 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633', 'gray', 'S,M,L,XL,XXL', '80% Cotton, 20% Polyester', 'casual', 'winter', 'relaxed', 'comfortable,soft,casual', true, true),
      ('Khaki Cargo Pants', 'Carhartt', 'lower', 'Durable cargo pants with multiple pockets', 69.99, 'USD', 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80', 'khaki', '30,32,34,36,38', '100% Cotton', 'casual', 'all-season', 'utility', 'functional,durable,practical', true, true),
      ('Black Shorts', 'Nike', 'lower', 'Athletic shorts for sports and training', 29.99, 'USD', 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b', 'black', 'S,M,L,XL,XXL', 'Polyester', 'sports', 'summer', 'athletic', 'breathable,sporty,lightweight', true, true),
      ('Navy Dress Pants', 'Hugo Boss', 'lower', 'Elegant dress pants for formal occasions', 129.99, 'USD', 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80', 'navy', '28,30,32,34,36,38', 'Wool Blend', 'formal', 'all-season', 'elegant', 'professional,formal,tailored', true, true),
      ('Blue Track Pants', 'Adidas', 'lower', 'Comfortable track pants with side stripes', 49.99, 'USD', 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633', 'blue', 'S,M,L,XL', 'Polyester', 'sports', 'all-season', 'athletic', 'comfortable,sporty,casual', true, true),
      ('Beige Linen Pants', 'Uniqlo', 'lower', 'Breathable linen pants for summer', 54.99, 'USD', 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80', 'beige', '28,30,32,34,36', '100% Linen', 'casual', 'summer', 'breezy', 'breathable,light,comfortable', true, true),
      ('Black Joggers', 'Puma', 'lower', 'Modern joggers with elastic waistband', 44.99, 'USD', 'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633', 'black', 'S,M,L,XL,XXL', '65% Cotton, 35% Polyester', 'casual', 'all-season', 'modern', 'trendy,comfortable,versatile', true, true),
      ('Olive Hiking Pants', 'Columbia', 'lower', 'Durable hiking pants with reinforced knees', 84.99, 'USD', 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80', 'olive', '30,32,34,36,38', 'Nylon', 'outdoor', 'all-season', 'adventure', 'durable,functional,outdoor', true, true);
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DELETE FROM clothes;`);
  }
}
