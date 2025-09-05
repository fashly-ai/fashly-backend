import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateGlassesTableManual1757002885215 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE "glasses" (
                "id" uuid NOT NULL DEFAULT uuid_generate_v4(),
                "name" character varying NOT NULL,
                "productUrl" character varying NOT NULL,
                "imageUrl" character varying NOT NULL,
                "brand" character varying,
                "category" character varying,
                "price" character varying,
                "availability" character varying,
                "isActive" boolean NOT NULL DEFAULT true,
                "createdAt" TIMESTAMP NOT NULL DEFAULT now(),
                "updatedAt" TIMESTAMP NOT NULL DEFAULT now(),
                CONSTRAINT "PK_glasses_id" PRIMARY KEY ("id"),
                CONSTRAINT "UQ_glasses_productUrl" UNIQUE ("productUrl")
            )
        `);

        await queryRunner.query(`CREATE INDEX "IDX_glasses_name" ON "glasses" ("name")`);
        await queryRunner.query(`CREATE INDEX "IDX_glasses_productUrl" ON "glasses" ("productUrl")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "public"."IDX_glasses_productUrl"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_glasses_name"`);
        await queryRunner.query(`DROP TABLE "glasses"`);
    }

}
