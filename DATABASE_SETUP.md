# Database Setup & Migrations

This document explains how to initialize and manage the Easy Flags database with Turso/LibSQL.

## Quick Start

### 1. Initialize the Database

```bash
npm run db:init
```

This command will:
- ✅ Create all necessary database tables
- ✅ Seed default roles (admin, editor, viewer)
- ✅ Create default admin user
- ✅ Run any pending migrations

### 2. Create Admin User

By default, an admin user is created with:
- **Username**: `admin` (configurable via `ADMIN_USER` env var)
- **Password**: `password` (configurable via `ADMIN_PASS` env var)
- **Email**: `admin@example.com`

Change these in your `.env` file:

```env
ADMIN_USER=your_admin_username
ADMIN_PASS=your_admin_password
DATABASE_URL=your_turso_database_url
DATABASE_AUTH_TOKEN=your_turso_auth_token
```

## Database Schema

The database includes the following tables:

### Core Tables

- **roles** - User roles (admin, editor, viewer)
- **users** - User accounts with authentication
- **spaces** - Feature flag management workspaces
- **space_members** - Team member access control

### Feature Management

- **environments** - Deployment environments (dev, staging, production)
- **features** - Feature definitions with types and defaults
- **feature_flags** - Feature enable/disable per environment
- **targeting_rules** - User targeting for gradual rollouts

### Operational

- **migrations** - Migration history tracking

## Working with Migrations

### Create a Migration

```bash
npm run migration:create add_new_table
```

This creates a new migration file with a timestamp prefix:
```
scripts/migrations/20260310_141530_add_new_table.sql
```

Edit the file and add your SQL statements:

```sql
-- Migration: add_new_table
-- Description: Add custom configuration table

CREATE TABLE IF NOT EXISTS config (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  key TEXT UNIQUE NOT NULL,
  value TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### Run Migrations

Migrations run automatically during `db:init`, but you can also check the status:

```bash
npm run db:init
```

The system tracks executed migrations to prevent re-running them.

## Environment Variables

```env
# Database Configuration
DATABASE_URL=file:./data.db              # Local SQLite or Turso database URL
DATABASE_AUTH_TOKEN=                      # Turso authentication token (if required)

# Admin User
ADMIN_USER=admin                          # Default admin username
ADMIN_PASS=password                       # Default admin password

# JWT
JWT_SECRET=your-secret-key               # Used for signing authentication tokens

# Stripe (Optional)
STRIPE_SECRET_KEY=                        # Stripe API key for billing
```

## Turso Setup (Production)

To use Turso for production:

1. Create a Turso account at https://turso.tech
2. Create a database and get your connection details
3. Set environment variables:

```env
DATABASE_URL=libsql://your-db-url.turso.io
DATABASE_AUTH_TOKEN=your-auth-token
```

## Troubleshooting

### Migration Already Exists

If you get an error that a table already exists, it's usually safe to ignore. The `IF NOT EXISTS` clause prevents duplicate creation.

### Database Connection Error

- Verify `DATABASE_URL` is correct
- Check `DATABASE_AUTH_TOKEN` if using Turso cloud
- For local development, ensure `./data.db` directory is writable

### Seed Data Not Inserted

Check if data already exists. The seed script skips seeding if roles are already in the database. You can manually clear tables if needed:

```sql
DELETE FROM migrations;
DELETE FROM users;
DELETE FROM roles;
```

Then run `npm run db:init` again.

## Database Utilities

The database module is available at `src/lib/db.ts` with the following functions:

```typescript
// Get database connection
const db = await getDatabase();

// Initialize schema
await initializeDatabase();

// Seed default data
await seedDatabase();

// Record a migration
await recordMigration('migration_name');

// Get migration status
const executed = await getMigrationStatus();
```

## Development Workflow

1. **Start development server**:
   ```bash
   npm run dev
   ```

2. **Create database if needed**:
   ```bash
   npm run db:init
   ```

3. **Make schema changes**:
   ```bash
   npm run migration:create my_change_name
   ```

4. **Edit the migration file** in `scripts/migrations/`

5. **Run migrations**:
   ```bash
   npm run db:init
   ```

## Production Deployment

1. Use Turso or another hosted SQLite service
2. Set `DATABASE_URL` and `DATABASE_AUTH_TOKEN` in production environment
3. Run database initialization on deployment:
   ```bash
   npm run db:init
   ```
4. The app is ready to use with seeded admin user

## API Integration

API routes in `src/pages/api/` can access the database:

```typescript
import { getDatabase } from '@/lib/db';

export const GET: APIRoute = async (context) => {
  const db = await getDatabase();
  
  const result = await db.execute('SELECT * FROM features');
  
  return new Response(JSON.stringify(result.rows));
};
```

## Backup & Recovery

For production databases, ensure you have proper backups. Turso provides:
- Automatic backups with their hosting
- Point-in-time recovery options

For local development, simply back up the `data.db` file.
