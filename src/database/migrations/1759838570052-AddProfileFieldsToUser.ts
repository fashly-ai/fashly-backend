import { MigrationInterface, QueryRunner } from "typeorm";

export class AddProfileFieldsToUser1759838570052 implements MigrationInterface {
    name = 'AddProfileFieldsToUser1759838570052';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "users" 
            ADD COLUMN "height" character varying,
            ADD COLUMN "weight" decimal(5,2),
            ADD COLUMN "weightUnit" character varying,
            ADD COLUMN "profileImageUrl" character varying,
            ADD COLUMN "phoneNumber" character varying,
            ADD COLUMN "dateOfBirth" date,
            ADD COLUMN "gender" character varying,
            ADD COLUMN "bio" character varying,
            ADD COLUMN "location" character varying,
            ADD COLUMN "profileCompleted" boolean NOT NULL DEFAULT false
        `);

        // Add indexes for commonly queried fields
        await queryRunner.query(`
            CREATE INDEX "IDX_users_profileCompleted" ON "users" ("profileCompleted")
        `);
        
        await queryRunner.query(`
            CREATE INDEX "IDX_users_gender" ON "users" ("gender")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_users_gender"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_users_profileCompleted"`);
        
        await queryRunner.query(`
            ALTER TABLE "users" 
            DROP COLUMN "profileCompleted",
            DROP COLUMN "location",
            DROP COLUMN "bio",
            DROP COLUMN "gender",
            DROP COLUMN "dateOfBirth",
            DROP COLUMN "phoneNumber",
            DROP COLUMN "profileImageUrl",
            DROP COLUMN "weightUnit",
            DROP COLUMN "weight",
            DROP COLUMN "height"
        `);
    }
}
