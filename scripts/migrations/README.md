-- Database Migrations

All database migrations are stored in this directory. The naming convention is:
`{TIMESTAMP}_{description}.sql`

## How to create a migration

Run the following command:

```bash
npm run migration:create my_migration_name
```

This will create a new SQL file in this directory. Edit the file to add your SQL statements.

## How migrations are executed

Migrations are executed automatically when you run:

```bash
npm run db:init
```

The system tracks which migrations have been executed in the `migrations` table to prevent duplicate execution.

## Migration files

Each migration file should contain valid SQL statements separated by semicolons.

### Example Migration

```sql
-- Migration: add_api_keys_table
-- Created: 2026-03-10T14:00:00Z
-- Description: Add API keys table for space access management

CREATE TABLE IF NOT EXISTS api_keys (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  space_id INTEGER NOT NULL,
  key TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  is_active BOOLEAN DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (space_id) REFERENCES spaces(id)
);

CREATE INDEX IF NOT EXISTS idx_api_keys_space_id ON api_keys(space_id);
```

## Important Notes

- Migrations are executed in alphabetical order based on filename
- The timestamp format ensures migrations run in the correct order
- Once executed, a migration is never run again
- Failed migrations will stop the initialization process
