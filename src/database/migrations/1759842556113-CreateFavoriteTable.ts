import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateFavoriteTable1759842556113 implements MigrationInterface {
    name = 'CreateFavoriteTable1759842556113'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_users_profileCompleted"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_users_gender"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_glasses_name"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_glasses_productUrl"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_otps_email"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_otps_email_type_status"`);
        await queryRunner.query(`CREATE TABLE "favorites" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "glassesId" uuid NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_890818d27523748dd36a4d1bdc8" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_e747534006c6e3c2f09939da60" ON "favorites" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_caa0f8c9837c9c761535029e80" ON "favorites" ("glassesId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_8528ae41b031b5d568ad723c62" ON "favorites" ("userId", "glassesId") `);
        await queryRunner.query(`CREATE INDEX "IDX_ac8ac6236c6bd116114e6c408c" ON "glasses" ("name") `);
        await queryRunner.query(`CREATE INDEX "IDX_77ad52e0a75a7dad2ad3d04ca2" ON "glasses" ("productUrl") `);
        await queryRunner.query(`CREATE INDEX "IDX_9bd09e59708ea02bb49081961c" ON "otps" ("email") `);
        await queryRunner.query(`CREATE INDEX "IDX_b2e219ade8414b72ee14f80916" ON "otps" ("email", "type", "status") `);
        await queryRunner.query(`ALTER TABLE "favorites" ADD CONSTRAINT "FK_e747534006c6e3c2f09939da60f" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "favorites" ADD CONSTRAINT "FK_caa0f8c9837c9c761535029e808" FOREIGN KEY ("glassesId") REFERENCES "glasses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "favorites" DROP CONSTRAINT "FK_caa0f8c9837c9c761535029e808"`);
        await queryRunner.query(`ALTER TABLE "favorites" DROP CONSTRAINT "FK_e747534006c6e3c2f09939da60f"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b2e219ade8414b72ee14f80916"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9bd09e59708ea02bb49081961c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_77ad52e0a75a7dad2ad3d04ca2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ac8ac6236c6bd116114e6c408c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8528ae41b031b5d568ad723c62"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_caa0f8c9837c9c761535029e80"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_e747534006c6e3c2f09939da60"`);
        await queryRunner.query(`DROP TABLE "favorites"`);
        await queryRunner.query(`CREATE INDEX "IDX_otps_email_type_status" ON "otps" ("email", "type", "status") `);
        await queryRunner.query(`CREATE INDEX "IDX_otps_email" ON "otps" ("email") `);
        await queryRunner.query(`CREATE INDEX "IDX_glasses_productUrl" ON "glasses" ("productUrl") `);
        await queryRunner.query(`CREATE INDEX "IDX_glasses_name" ON "glasses" ("name") `);
        await queryRunner.query(`CREATE INDEX "IDX_users_gender" ON "users" ("gender") `);
        await queryRunner.query(`CREATE INDEX "IDX_users_profileCompleted" ON "users" ("profileCompleted") `);
    }

}
