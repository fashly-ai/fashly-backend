import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateOtpTable1759836000019 implements MigrationInterface {
    name = 'CreateOtpTable1759836000019';

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TYPE "public"."otps_type_enum" AS ENUM('signin', 'signup')
        `);
        await queryRunner.query(`
            CREATE TYPE "public"."otps_status_enum" AS ENUM('pending', 'used', 'expired')
        `);
        await queryRunner.query(`
            CREATE TABLE "otps" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "email" character varying NOT NULL,
                "code" character varying(6) NOT NULL,
                "type" "public"."otps_type_enum" NOT NULL,
                "status" "public"."otps_status_enum" NOT NULL DEFAULT 'pending',
                "expiresAt" TIMESTAMP NOT NULL,
                "usedAt" TIMESTAMP,
                "attemptCount" integer NOT NULL DEFAULT '0',
                "maxAttempts" integer NOT NULL DEFAULT '3',
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_91fef5ed60605b854a2115d2410" PRIMARY KEY ("id")
            )
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_otps_email" ON "otps" ("email")
        `);
        await queryRunner.query(`
            CREATE INDEX "IDX_otps_email_type_status" ON "otps" ("email", "type", "status")
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_otps_email_type_status"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_otps_email"`);
        await queryRunner.query(`DROP TABLE "otps"`);
        await queryRunner.query(`DROP TYPE "public"."otps_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."otps_type_enum"`);
    }
}
