import { Migration, DatabaseWrapper } from "./runner";

/**
 * Migration - Adds multi-tenant spaces support
 * This migration sets up the schema for:
 * - Spaces (tenants)
 * - Space user memberships with space-level roles
 * - Updates existing tables to be space-aware
 */
const migration: Migration = {
  async up(db: DatabaseWrapper) {
    // Create spaces table
    await db.exec(
      `CREATE TABLE IF NOT EXISTS spaces (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        description TEXT,
        owner_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY(owner_id) REFERENCES users(id)
      )`,
    );

    // Create space_users table for managing user memberships and roles within spaces
    await db.exec(
      `CREATE TABLE IF NOT EXISTS space_users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        space_id INTEGER NOT NULL,
        user_id INTEGER NOT NULL,
        role_id INTEGER NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(space_id, user_id),
        FOREIGN KEY(space_id) REFERENCES spaces(id) ON DELETE CASCADE,
        FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE,
        FOREIGN KEY(role_id) REFERENCES roles(id)
      )`,
    );

    // Add space_id to environments table
    await db.exec(`ALTER TABLE environments ADD COLUMN space_id INTEGER`);

    // Add foreign key constraint for environments.space_id
    // Note: SQLite doesn't support direct ALTER TABLE ADD CONSTRAINT,
    // so this is handled via PRAGMA foreign_keys and manual FK definition

    // Add space_id to features table
    await db.exec(`ALTER TABLE features ADD COLUMN space_id INTEGER`);

    // Create space_users index for faster lookups
    await db.exec(
      `CREATE INDEX IF NOT EXISTS idx_space_users_space_id ON space_users(space_id)`,
    );
    await db.exec(
      `CREATE INDEX IF NOT EXISTS idx_space_users_user_id ON space_users(user_id)`,
    );

    // Create environments index for space lookups
    await db.exec(
      `CREATE INDEX IF NOT EXISTS idx_environments_space_id ON environments(space_id)`,
    );

    // Create features index for space lookups
    await db.exec(
      `CREATE INDEX IF NOT EXISTS idx_features_space_id ON features(space_id)`,
    );
  },

  async down(db: DatabaseWrapper) {
    // Drop indexes
    await db.exec("DROP INDEX IF EXISTS idx_features_space_id");
    await db.exec("DROP INDEX IF EXISTS idx_environments_space_id");
    await db.exec("DROP INDEX IF EXISTS idx_space_users_user_id");
    await db.exec("DROP INDEX IF EXISTS idx_space_users_space_id");

    // Drop tables
    await db.exec("DROP TABLE IF EXISTS space_users");
    await db.exec("DROP TABLE IF EXISTS spaces");

    // Remove space_id columns from environments and features
    // Note: SQLite doesn't support DROP COLUMN easily in older versions,
    // so this might need manual handling based on SQLite version
  },
};

export default migration;
