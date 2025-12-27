import { MigrationInterface, QueryRunner } from 'typeorm';

export class CreateFashnJobsTable1733558400000 implements MigrationInterface {
  name = 'CreateFashnJobsTable1733558400000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for job status
    await queryRunner.query(`
      CREATE TYPE "fashn_job_status_enum" AS ENUM (
        'pending',
        'processing_upper',
        'processing_lower',
        'completed',
        'failed'
      )
    `);

    // Create fashn_jobs table
    await queryRunner.query(`
      CREATE TABLE "fashn_jobs" (
        "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
        "user_id" uuid NOT NULL,
        "model_image_url" text NOT NULL,
        "upper_garment_url" text,
        "lower_garment_url" text,
        "outfit_image_url" text,
        "status" "fashn_job_status_enum" NOT NULL DEFAULT 'pending',
        "upper_prediction_id" varchar(255),
        "lower_prediction_id" varchar(255),
        "upper_result_url" text,
        "result_image_url" text,
        "seed" integer,
        "mode" varchar(50) NOT NULL DEFAULT 'quality',
        "category" varchar(50) NOT NULL DEFAULT 'auto',
        "processing_time" integer,
        "error_message" text,
        "metadata" jsonb,
        "save_to_history" boolean NOT NULL DEFAULT false,
        "history_id" uuid,
        "created_at" TIMESTAMP NOT NULL DEFAULT now(),
        "updated_at" TIMESTAMP NOT NULL DEFAULT now(),
        "completed_at" TIMESTAMP,
        CONSTRAINT "PK_fashn_jobs_id" PRIMARY KEY ("id")
      )
    `);

    // Create foreign key to users table
    await queryRunner.query(`
      ALTER TABLE "fashn_jobs"
      ADD CONSTRAINT "FK_fashn_jobs_user_id"
      FOREIGN KEY ("user_id")
      REFERENCES "users"("id")
      ON DELETE CASCADE
      ON UPDATE NO ACTION
    `);

    // Create indexes
    await queryRunner.query(`
      CREATE INDEX "IDX_fashn_jobs_user_id_created_at"
      ON "fashn_jobs" ("user_id", "created_at")
    `);

    await queryRunner.query(`
      CREATE INDEX "IDX_fashn_jobs_status"
      ON "fashn_jobs" ("status")
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes
    await queryRunner.query(`DROP INDEX "IDX_fashn_jobs_status"`);
    await queryRunner.query(`DROP INDEX "IDX_fashn_jobs_user_id_created_at"`);

    // Drop foreign key
    await queryRunner.query(`
      ALTER TABLE "fashn_jobs"
      DROP CONSTRAINT "FK_fashn_jobs_user_id"
    `);

    // Drop table
    await queryRunner.query(`DROP TABLE "fashn_jobs"`);

    // Drop enum type
    await queryRunner.query(`DROP TYPE "fashn_job_status_enum"`);
  }
}

