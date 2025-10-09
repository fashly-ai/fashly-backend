import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTryOnTable1759845810266 implements MigrationInterface {
    name = 'CreateTryOnTable1759845810266'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "tryons" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "userId" uuid NOT NULL, "glassesId" uuid NOT NULL, "resultImageUrl" character varying, "metadata" json, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), CONSTRAINT "PK_e238d505f6986a8a59550248bd2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_699ceab291a25af1bd1f8d4214" ON "tryons" ("userId") `);
        await queryRunner.query(`CREATE INDEX "IDX_d582eff8ea8b6dcaf91ebb42d2" ON "tryons" ("glassesId") `);
        await queryRunner.query(`CREATE UNIQUE INDEX "IDX_fbfb4882f99713d024ca66ff4b" ON "tryons" ("userId", "glassesId") `);
        await queryRunner.query(`ALTER TABLE "tryons" ADD CONSTRAINT "FK_699ceab291a25af1bd1f8d4214d" FOREIGN KEY ("userId") REFERENCES "users"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "tryons" ADD CONSTRAINT "FK_d582eff8ea8b6dcaf91ebb42d2a" FOREIGN KEY ("glassesId") REFERENCES "glasses"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tryons" DROP CONSTRAINT "FK_d582eff8ea8b6dcaf91ebb42d2a"`);
        await queryRunner.query(`ALTER TABLE "tryons" DROP CONSTRAINT "FK_699ceab291a25af1bd1f8d4214d"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fbfb4882f99713d024ca66ff4b"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d582eff8ea8b6dcaf91ebb42d2"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_699ceab291a25af1bd1f8d4214"`);
        await queryRunner.query(`DROP TABLE "tryons"`);
    }

}
