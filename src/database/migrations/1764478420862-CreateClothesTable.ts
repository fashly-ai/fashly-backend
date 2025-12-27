import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateClothesTable1764478420862 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.createTable(
      new Table({
        name: 'clothes',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'name',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'brand',
            type: 'varchar',
            length: '100',
            isNullable: false,
          },
          {
            name: 'clothingType',
            type: 'varchar',
            length: '50',
            isNullable: false,
          },
          {
            name: 'description',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'price',
            type: 'decimal',
            precision: 10,
            scale: 2,
            isNullable: true,
          },
          {
            name: 'currency',
            type: 'varchar',
            length: '10',
            isNullable: true,
          },
          {
            name: 'imageUrl',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'thumbnailUrl',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'additionalImages',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'color',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'sizes',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'material',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'season',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'style',
            type: 'varchar',
            length: '50',
            isNullable: true,
          },
          {
            name: 'tags',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'productUrl',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'sku',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'isActive',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'inStock',
            type: 'boolean',
            default: true,
            isNullable: false,
          },
          {
            name: 'created_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
          {
            name: 'updated_at',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
            isNullable: false,
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'clothes',
      new TableIndex({
        name: 'IDX_clothes_isActive',
        columnNames: ['isActive'],
      }),
    );

    await queryRunner.createIndex(
      'clothes',
      new TableIndex({
        name: 'IDX_clothes_clothingType',
        columnNames: ['clothingType'],
      }),
    );

    await queryRunner.createIndex(
      'clothes',
      new TableIndex({
        name: 'IDX_clothes_brand',
        columnNames: ['brand'],
      }),
    );

    await queryRunner.createIndex(
      'clothes',
      new TableIndex({
        name: 'IDX_clothes_isActive_clothingType',
        columnNames: ['isActive', 'clothingType'],
      }),
    );

    await queryRunner.createIndex(
      'clothes',
      new TableIndex({
        name: 'IDX_clothes_brand_isActive',
        columnNames: ['brand', 'isActive'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.dropIndex('clothes', 'IDX_clothes_brand_isActive');
    await queryRunner.dropIndex('clothes', 'IDX_clothes_isActive_clothingType');
    await queryRunner.dropIndex('clothes', 'IDX_clothes_brand');
    await queryRunner.dropIndex('clothes', 'IDX_clothes_clothingType');
    await queryRunner.dropIndex('clothes', 'IDX_clothes_isActive');

    // Drop the table
    await queryRunner.dropTable('clothes');
  }
}
