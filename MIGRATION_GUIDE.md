# Database Migration Guide

This guide explains how to work with TypeORM migrations in the Authentication API.

## 📋 Available Migration Commands

| Command | Description |
|---------|-------------|
| `pnpm run migration:generate` | Generate migration from entity changes |
| `pnpm run migration:create` | Create empty migration file |
| `pnpm run migration:run` | Execute pending migrations |
| `pnpm run migration:revert` | Rollback last migration |
| `pnpm run migration:show` | Show migration status |

## 🔄 Common Workflows

### 1. Adding New Fields to User Entity

**Step 1**: Modify the entity
```typescript
// src/database/entities/user.entity.ts
@Entity('users')
export class User {
  // ... existing fields
  
  @Column({ nullable: true })
  phoneNumber: string; // New field
}
```

**Step 2**: Generate migration
```bash
pnpm run migration:generate src/database/migrations/AddPhoneNumberToUser
```

**Step 3**: Review generated file
```typescript
// src/database/migrations/1234567890123-AddPhoneNumberToUser.ts
export class AddPhoneNumberToUser1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" ADD "phoneNumber" varchar`);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`ALTER TABLE "users" DROP COLUMN "phoneNumber"`);
  }
}
```

**Step 4**: Run migration
```bash
pnpm run migration:run
```

### 2. Creating New Table

**Step 1**: Create new entity
```typescript
// src/database/entities/profile.entity.ts
@Entity('profiles')
export class Profile {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => User)
  user: User;

  @Column()
  bio: string;
}
```

**Step 2**: Add to database module
```typescript
// src/database/database.module.ts
entities: [User, Profile], // Add new entity
```

**Step 3**: Generate migration
```bash
pnpm run migration:generate src/database/migrations/CreateProfileTable
```

**Step 4**: Run migration
```bash
pnpm run migration:run
```

### 3. Custom Migration (Manual)

For complex changes that can't be auto-generated:

**Step 1**: Create empty migration
```bash
pnpm run migration:create src/database/migrations/CustomDataUpdate
```

**Step 2**: Write custom logic
```typescript
export class CustomDataUpdate1234567890123 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Custom SQL or complex operations
    await queryRunner.query(`
      UPDATE users 
      SET email = LOWER(email) 
      WHERE email != LOWER(email)
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Rollback logic (if possible)
  }
}
```

**Step 3**: Run migration
```bash
pnpm run migration:run
```

## 📊 Migration Status

Check what migrations have been applied:

```bash
pnpm run migration:show
```

Output example:
```
[X] 1704067200000 CreateUserTable1704067200000
[X] 1704067300000 AddPhoneNumberToUser1704067300000
[ ] 1704067400000 CreateProfileTable1704067400000  # Pending
```

- `[X]` = Applied
- `[ ]` = Pending

## ⚠️ Important Notes

### Development vs Production

**Development**:
- Feel free to generate and run migrations frequently
- You can revert migrations if needed

**Production**:
- Always review migrations carefully before applying
- Test migrations on staging environment first
- Backup database before running migrations
- Consider downtime for large table changes

### Migration Best Practices

1. **Always review generated migrations** before running them
2. **Test migrations locally** before deploying
3. **Write reversible migrations** when possible
4. **Don't edit migrations** that have already been applied
5. **Use descriptive names** for migration files

### Troubleshooting

**Migration fails with syntax error**:
```bash
# Check the generated SQL
cat src/database/migrations/latest-migration.ts

# Fix the migration file manually if needed
```

**Need to rollback**:
```bash
# Rollback last migration
pnpm run migration:revert

# Check status
pnpm run migration:show
```

**Database out of sync**:
```bash
# In development, you can reset:
# 1. Drop and recreate database
# 2. Run all migrations from scratch
pnpm run migration:run
```

## 🔗 TypeORM Migration Documentation

For more advanced use cases, refer to:
- [TypeORM Migrations](https://typeorm.io/migrations)
- [Migration API](https://typeorm.io/migration-api)
