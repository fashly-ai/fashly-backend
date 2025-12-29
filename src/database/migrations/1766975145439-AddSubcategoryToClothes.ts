import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSubcategoryToClothes1766975145439 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add subcategory column
        await queryRunner.query(`
            ALTER TABLE "clothes" 
            ADD COLUMN "subcategory" character varying(100)
        `);

        // Add index on category column
        await queryRunner.query(`
            CREATE INDEX "IDX_clothes_category" ON "clothes" ("category")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop index on category column
        await queryRunner.query(`
            DROP INDEX "IDX_clothes_category"
        `);

        // Remove subcategory column
        await queryRunner.query(`
            ALTER TABLE "clothes" 
            DROP COLUMN "subcategory"
        `);
    }

}
