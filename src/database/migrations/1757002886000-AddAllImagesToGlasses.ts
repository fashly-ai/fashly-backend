import { MigrationInterface, QueryRunner } from 'typeorm';

export class AddAllImagesToGlasses1757002886000 implements MigrationInterface {
  name = 'AddAllImagesToGlasses1757002886000';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(
      `ALTER TABLE "glasses" ADD "allImages" text`,
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "glasses" DROP COLUMN "allImages"`);
  }
}
