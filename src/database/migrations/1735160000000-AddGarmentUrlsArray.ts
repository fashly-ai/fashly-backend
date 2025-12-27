import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddGarmentUrlsArray1735160000000 implements MigrationInterface {
  name = 'AddGarmentUrlsArray1735160000000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add garment_urls column to fashn_jobs table
    await queryRunner.query(`
      ALTER TABLE "fashn_jobs" 
      ADD COLUMN "garment_urls" text
    `);

    // Add garment_urls column to fashn_history table
    await queryRunner.query(`
      ALTER TABLE "fashn_history" 
      ADD COLUMN "garment_urls" text
    `);

    // Make upper_garment_url nullable in fashn_history (was required before)
    await queryRunner.query(`
      ALTER TABLE "fashn_history" 
      ALTER COLUMN "upper_garment_url" DROP NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Remove garment_urls column from fashn_jobs
    await queryRunner.query(`
      ALTER TABLE "fashn_jobs" 
      DROP COLUMN "garment_urls"
    `);

    // Remove garment_urls column from fashn_history
    await queryRunner.query(`
      ALTER TABLE "fashn_history" 
      DROP COLUMN "garment_urls"
    `);

    // Restore upper_garment_url NOT NULL constraint (if needed)
    // Note: This might fail if there are NULL values
    // await queryRunner.query(`
    //   ALTER TABLE "fashn_history" 
    //   ALTER COLUMN "upper_garment_url" SET NOT NULL
    // `);
  }
}

