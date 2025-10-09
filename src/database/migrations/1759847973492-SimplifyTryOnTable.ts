import { MigrationInterface, QueryRunner } from "typeorm";

export class SimplifyTryOnTable1759847973492 implements MigrationInterface {
    name = 'SimplifyTryOnTable1759847973492'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tryons" DROP COLUMN "resultImageUrl"`);
        await queryRunner.query(`ALTER TABLE "tryons" DROP COLUMN "metadata"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "tryons" ADD "metadata" json`);
        await queryRunner.query(`ALTER TABLE "tryons" ADD "resultImageUrl" character varying`);
    }

}
