import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUserProfileColumns1759839426235 implements MigrationInterface {
    name = 'AddUserProfileColumns1759839426235';

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Add profile columns to users table
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN IF NOT EXISTS "height" character varying,
            ADD COLUMN IF NOT EXISTS "weight" decimal(5,2),
            ADD COLUMN IF NOT EXISTS "weightUnit" character varying,
            ADD COLUMN IF NOT EXISTS "profileImageUrl" character varying,
            ADD COLUMN IF NOT EXISTS "phoneNumber" character varying,
            ADD COLUMN IF NOT EXISTS "dateOfBirth" date,
            ADD COLUMN IF NOT EXISTS "gender" character varying,
            ADD COLUMN IF NOT EXISTS "bio" character varying,
            ADD COLUMN IF NOT EXISTS "location" character varying,
            ADD COLUMN IF NOT EXISTS "profileCompleted" boolean DEFAULT false
        `);

        // Add indexes for commonly queried fields
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_users_profileCompleted" ON "users" ("profileCompleted")
        `);
        
        await queryRunner.query(`
            CREATE INDEX IF NOT EXISTS "IDX_users_gender" ON "users" ("gender")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Drop indexes first
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_gender"`);
        await queryRunner.query(`DROP INDEX IF EXISTS "IDX_users_profileCompleted"`);
        
        // Drop columns
        await queryRunner.query(`
            ALTER TABLE "users" 
            DROP COLUMN IF EXISTS "profileCompleted",
            DROP COLUMN IF EXISTS "location",
            DROP COLUMN IF EXISTS "bio",
            DROP COLUMN IF EXISTS "gender",
            DROP COLUMN IF EXISTS "dateOfBirth",
            DROP COLUMN IF EXISTS "phoneNumber",
            DROP COLUMN IF EXISTS "profileImageUrl",
            DROP COLUMN IF EXISTS "weightUnit",
            DROP COLUMN IF EXISTS "weight",
            DROP COLUMN IF EXISTS "height"
        `);
    }
}
