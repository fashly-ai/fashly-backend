import { MigrationInterface, QueryRunner } from "typeorm";

export class AddGlassTryOnHistory1763384228253 implements MigrationInterface {
    name = 'AddGlassTryOnHistory1763384228253'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "glass_tryon_history" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "glassesId" uuid NOT NULL, "prompt" text, "negativePrompt" text, "seed" integer, "resultImageUrl" text NOT NULL, "promptId" character varying NOT NULL, "filename" character varying NOT NULL, "processingTime" integer NOT NULL, "imageSize" integer NOT NULL, "savedTryOn" boolean NOT NULL DEFAULT false, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_01e3fe0c09c6ee678fdb9f04d72" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_05db9a484d9e2e5596e76f7cce" ON "glass_tryon_history" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_da9314cc2cef5034ffde3610c8" ON "glass_tryon_history" ("glassesId") `);
        await queryRunner.query(`CREATE INDEX "IDX_1eb6b4b8ee448fa4f2dc287434" ON "glass_tryon_history" ("savedTryOn") `);
        await queryRunner.query(`CREATE INDEX "IDX_f57b267aa320aa3340a8a47210" ON "glass_tryon_history" ("userId", "createdAt") `);
        await queryRunner.query(`ALTER TABLE "glass_tryon_history" ADD CONSTRAINT "FK_05db9a484d9e2e5596e76f7cce0" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "glass_tryon_history" ADD CONSTRAINT "FK_da9314cc2cef5034ffde3610c8d" FOREIGN KEY ("glassesId") REFERENCES "glasses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "glass_tryon_history" DROP CONSTRAINT "FK_da9314cc2cef5034ffde3610c8d"`);
        await queryRunner.query(`ALTER TABLE "glass_tryon_history" DROP CONSTRAINT "FK_05db9a484d9e2e5596e76f7cce0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f57b267aa320aa3340a8a47210"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_1eb6b4b8ee448fa4f2dc287434"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_da9314cc2cef5034ffde3610c8"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_05db9a484d9e2e5596e76f7cce"`);
        await queryRunner.query(`DROP TABLE "glass_tryon_history"`);
    }

}
