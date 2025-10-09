import { DataSource } from 'typeorm';
import { config } from 'dotenv';

// Load environment variables
config();

async function addProfileColumns() {
  const dataSource = new DataSource({
    type: 'postgres',
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432'),
    username: process.env.DB_USERNAME || 'postgres',
    password: process.env.DB_PASSWORD || 'postgres',
    database: process.env.DB_NAME || 'fashly',
    synchronize: false,
    logging: true,
  });

  try {
    await dataSource.initialize();
    console.log('Connected to database');

    const queryRunner = dataSource.createQueryRunner();

    // Add columns one by one to avoid syntax issues
    const columns = [
      { name: 'height', type: 'character varying' },
      { name: 'weight', type: 'decimal(5,2)' },
      { name: 'weightUnit', type: 'character varying' },
      { name: 'profileImageUrl', type: 'character varying' },
      { name: 'phoneNumber', type: 'character varying' },
      { name: 'dateOfBirth', type: 'date' },
      { name: 'gender', type: 'character varying' },
      { name: 'bio', type: 'character varying' },
      { name: 'location', type: 'character varying' },
      { name: 'profileCompleted', type: 'boolean DEFAULT false' },
    ];

    for (const column of columns) {
      try {
        await queryRunner.query(`
          DO $$ 
          BEGIN 
            IF NOT EXISTS (
              SELECT 1 FROM information_schema.columns 
              WHERE table_name='users' AND column_name='${column.name}'
            ) THEN
              ALTER TABLE users ADD COLUMN "${column.name}" ${column.type};
            END IF;
          END $$;
        `);
        console.log(`✅ Added column: ${column.name}`);
      } catch (error) {
        console.log(`⚠️  Column ${column.name} might already exist:`, error.message);
      }
    }

    // Add indexes
    try {
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_users_profileCompleted" ON users ("profileCompleted")
      `);
      console.log('✅ Added profileCompleted index');
    } catch (error) {
      console.log('⚠️  Index might already exist:', error.message);
    }

    try {
      await queryRunner.query(`
        CREATE INDEX IF NOT EXISTS "IDX_users_gender" ON users (gender)
      `);
      console.log('✅ Added gender index');
    } catch (error) {
      console.log('⚠️  Index might already exist:', error.message);
    }

    await queryRunner.release();
    console.log('✅ Profile columns added successfully!');

  } catch (error) {
    console.error('❌ Error adding profile columns:', error);
  } finally {
    await dataSource.destroy();
  }
}

addProfileColumns();
