import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateUserImagesTable1735035600000 implements MigrationInterface {
  name = 'CreateUserImagesTable1735035600000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      CREATE TABLE "user_images" (
        "id" uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "image_url" varchar NOT NULL,
        "gcs_key" varchar,
        "is_default" boolean NOT NULL DEFAULT false,
        "description" varchar,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        CONSTRAINT "fk_user_images_user" FOREIGN KEY ("user_id") 
          REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION
      )
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_user_images_user_id" ON "user_images" ("user_id")
    `);

    await queryRunner.query(`
      CREATE INDEX "idx_user_images_is_default" ON "user_images" ("user_id", "is_default")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`DROP INDEX "idx_user_images_is_default"`);
    await queryRunner.query(`DROP INDEX "idx_user_images_user_id"`);
    await queryRunner.query(`DROP TABLE "user_images"`);
  }
}

