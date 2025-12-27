import { MigrationInterface, QueryRunner, TableColumn, TableIndex } from 'typeorm';

export class UpdateFavoritesForMultipleItemTypes1764478519098 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Add new columns for generic item support
    await queryRunner.addColumn(
      'favorites',
      new TableColumn({
        name: 'itemId',
        type: 'uuid',
        isNullable: true,
      }),
    );

    await queryRunner.addColumn(
      'favorites',
      new TableColumn({
        name: 'itemType',
        type: 'varchar',
        length: '50',
        isNullable: true,
      }),
    );

    // Make glassesId nullable for backward compatibility
    await queryRunner.changeColumn(
      'favorites',
      'glassesId',
      new TableColumn({
        name: 'glassesId',
        type: 'uuid',
        isNullable: true,
      }),
    );

    // Migrate existing data: populate itemId and itemType for existing glasses favorites
    await queryRunner.query(`
      UPDATE favorites 
      SET "itemId" = "glassesId", "itemType" = 'glasses' 
      WHERE "glassesId" IS NOT NULL
    `);

    // Create indexes for the new columns
    await queryRunner.createIndex(
      'favorites',
      new TableIndex({
        name: 'IDX_favorites_itemId',
        columnNames: ['itemId'],
      }),
    );

    await queryRunner.createIndex(
      'favorites',
      new TableIndex({
        name: 'IDX_favorites_itemType',
        columnNames: ['itemType'],
      }),
    );

    await queryRunner.createIndex(
      'favorites',
      new TableIndex({
        name: 'IDX_favorites_userId_itemId_itemType',
        columnNames: ['userId', 'itemId', 'itemType'],
        isUnique: true,
        where: '"itemId" IS NOT NULL',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop the new indexes
    await queryRunner.dropIndex('favorites', 'IDX_favorites_userId_itemId_itemType');
    await queryRunner.dropIndex('favorites', 'IDX_favorites_itemType');
    await queryRunner.dropIndex('favorites', 'IDX_favorites_itemId');

    // Make glassesId NOT NULL again
    await queryRunner.changeColumn(
      'favorites',
      'glassesId',
      new TableColumn({
        name: 'glassesId',
        type: 'uuid',
        isNullable: false,
      }),
    );

    // Drop the new columns
    await queryRunner.dropColumn('favorites', 'itemType');
    await queryRunner.dropColumn('favorites', 'itemId');
  }
}
