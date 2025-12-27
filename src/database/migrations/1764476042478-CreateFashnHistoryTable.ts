import { MigrationInterface, QueryRunner, Table, TableIndex } from 'typeorm';

export class CreateFashnHistoryTable1764476042478 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create fashn_history table
    await queryRunner.createTable(
      new Table({
        name: 'fashn_history',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'user_id',
            type: 'uuid',
            isNullable: false,
          },
          {
            name: 'model_image_url',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'upper_garment_url',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'lower_garment_url',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'result_image_url',
            type: 'text',
            isNullable: false,
          },
          {
            name: 'prediction_id',
            type: 'varchar',
            length: '255',
            isNullable: false,
          },
          {
            name: 'processing_time',
            type: 'integer',
            isNullable: false,
          },
          {
            name: 'category',
            type: 'varchar',
            length: '100',
            isNullable: true,
          },
          {
            name: 'is_saved',
            type: 'boolean',
            default: false,
            isNullable: false,
          },
          {
            name: 'model_name',
            type: 'varchar',
            length: '100',
            default: "'tryon-v1.6'",
            isNullable: false,
          },
          {
            name: 'metadata',
            type: 'jsonb',
            isNullable: true,
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

    // Create index on user_id for faster queries
    await queryRunner.createIndex(
      'fashn_history',
      new TableIndex({
        name: 'IDX_fashn_history_user_id',
        columnNames: ['user_id'],
      }),
    );

    // Create composite index on user_id and created_at for efficient pagination
    await queryRunner.createIndex(
      'fashn_history',
      new TableIndex({
        name: 'IDX_fashn_history_user_id_created_at',
        columnNames: ['user_id', 'created_at'],
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Drop indexes first
    await queryRunner.dropIndex('fashn_history', 'IDX_fashn_history_user_id_created_at');
    await queryRunner.dropIndex('fashn_history', 'IDX_fashn_history_user_id');

    // Drop the table
    await queryRunner.dropTable('fashn_history');
  }
}
