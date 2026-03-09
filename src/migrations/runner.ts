import { Client } from "@libsql/client";
import fs from "fs";
import path from "path";

/**
 * Wrapper to provide a unified interface for libsql client
 */
export class DatabaseWrapper {
  constructor(private client: Client) {}

  /**
   * Normalize parameters - accepts both array and spread arguments
   */
  private normalizeParams(params?: any[] | any): any[] {
    if (!params) return [];
    if (Array.isArray(params)) return params;
    // If single param but not array, wrap it
    return [params];
  }

  /**
   * Execute a SQL query that returns rows
   */
  async all<T = any>(sql: string, ...args: any[]): Promise<T[]> {
    try {
      const params = this.normalizeParams(
        args.length === 1 && Array.isArray(args[0]) ? args[0] : args,
      );

      const result = await this.client.execute({
        sql,
        args: params,
      });

      return result.rows as T[];
    } catch (error) {
      console.error("Error executing query:", sql, error);
      throw error;
    }
  }

  /**
   * Execute a SQL query that returns a single row
   */
  async get<T = any>(sql: string, ...args: any[]): Promise<T | undefined> {
    try {
      const params = this.normalizeParams(
        args.length === 1 && Array.isArray(args[0]) ? args[0] : args,
      );

      const result = await this.client.execute({
        sql,
        args: params,
      });

      return result.rows[0] as T | undefined;
    } catch (error) {
      console.error("Error executing query:", sql, error);
      throw error;
    }
  }

  /**
   * Execute a SQL statement that modifies data
   */
  async run(
    sql: string,
    ...args: any[]
  ): Promise<{ changes?: number; lastID?: number }> {
    try {
      const params = this.normalizeParams(
        args.length === 1 && Array.isArray(args[0]) ? args[0] : args,
      );

      const result = await this.client.execute({
        sql,
        args: params,
      });

      // Get last insert row id if available
      let lastID: number | undefined;
      if (sql.trim().toUpperCase().startsWith("INSERT")) {
        const idResult = await this.client.execute(
          "SELECT last_insert_rowid() as id",
        );
        lastID = idResult.rows[0]?.id as number | undefined;
      }

      return {
        changes: result.rows.length > 0 ? 1 : result.rows.length,
        lastID,
      };
    } catch (error) {
      console.error("Error executing query:", sql, error);
      throw error;
    }
  }

  /**
   * Execute multiple SQL statements
   */
  async exec(sql: string): Promise<void> {
    try {
      // Split SQL by semicolon and execute each statement
      const statements = sql
        .split(";")
        .map((s) => s.trim())
        .filter((s) => s.length > 0);

      for (const statement of statements) {
        await this.client.execute(statement);
      }
    } catch (error) {
      console.error("Error executing SQL:", error);
      throw error;
    }
  }
}

/**
 * Migration interface
 */
export interface Migration {
  up(db: DatabaseWrapper): Promise<void>;
  down(db: DatabaseWrapper): Promise<void>;
}

/**
 * Run all pending migrations
 * @param db - The DatabaseWrapper instance
 * @param migrationsDir - Directory containing migration files
 */
export async function runMigrations(
  db: DatabaseWrapper,
  migrationsDir: string,
): Promise<void> {
  // Create migrations table if it doesn't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Get all migration files (from compiled .js files in production or .ts in development)
  const files = fs
    .readdirSync(migrationsDir)
    .filter(
      (file) =>
        (file.endsWith(".js") || file.endsWith(".ts")) &&
        file !== "runner.js" &&
        file !== "runner.ts" &&
        file !== "index.js" &&
        file !== "index.ts",
    )
    .sort();

  // Get applied migrations
  const applied = await db.all<{ name: string }>("SELECT name FROM migrations");
  const appliedNames = new Set(applied.map((row) => row.name));

  // Show migration status
  if (files.length === 0) {
    console.log("📦 No migrations found");
    return;
  }

  const pendingCount = files.filter(
    (file) => !appliedNames.has(path.basename(file, path.extname(file))),
  ).length;

  if (pendingCount === 0) {
    console.log(
      `📦 Database up-to-date (${appliedNames.size} migrations applied)`,
    );
    return;
  }

  console.log(`📦 Running ${pendingCount} pending migration(s)...`);

  // Run pending migrations
  for (const file of files) {
    const migrationName = path.basename(file, path.extname(file));

    if (appliedNames.has(migrationName)) {
      continue;
    }

    try {
      // Dynamically import the migration - works with both .ts and .js files
      // ts-node handles .ts files, node handles .js files
      const migrationPath = path.join(migrationsDir, migrationName);
      const migrationModule = await import(migrationPath);
      const migration = migrationModule.default as Migration;

      process.stdout.write(`  → ${migrationName} ... `);
      await migration.up(db);

      // Record the migration as applied
      await db.run("INSERT INTO migrations (name) VALUES (?)", [migrationName]);

      console.log("✓");
    } catch (error) {
      console.log("✗");
      console.error(`\n✗ Migration failed: ${migrationName}`, error);
      throw error;
    }
  }

  console.log(`✓ All migrations applied successfully!`);
}

/**
 * Rollback the last migration
 * @param db - The DatabaseWrapper instance
 * @param migrationsDir - Directory containing migration files
 */
export async function rollbackMigration(
  db: DatabaseWrapper,
  migrationsDir: string,
): Promise<void> {
  // Get the last applied migration
  const lastMigration = await db.get<{ name: string }>(
    "SELECT name FROM migrations ORDER BY id DESC LIMIT 1",
  );

  if (!lastMigration) {
    console.log("No migrations to rollback");
    return;
  }

  try {
    const migrationPath = path.join(migrationsDir, lastMigration.name);
    const migrationModule = await import(migrationPath);
    const migration = migrationModule.default as Migration;

    console.log(`→ Rolling back migration: ${lastMigration.name}`);
    await migration.down(db);

    // Remove the migration record
    await db.run("DELETE FROM migrations WHERE name = ?", [lastMigration.name]);

    console.log(`✓ Rollback completed: ${lastMigration.name}`);
  } catch (error) {
    console.error(
      `✗ Rollback failed for migration: ${lastMigration.name}`,
      error,
    );
    throw error;
  }
}

/**
 * Get the status of all migrations
 * @param db - The DatabaseWrapper instance
 * @param migrationsDir - Directory containing migration files
 */
export async function getMigrationStatus(
  db: DatabaseWrapper,
  migrationsDir: string,
): Promise<{ name: string; applied: boolean }[]> {
  const files = fs
    .readdirSync(migrationsDir)
    .filter(
      (file) =>
        (file.endsWith(".js") || file.endsWith(".ts")) &&
        file !== "runner.js" &&
        file !== "runner.ts" &&
        file !== "index.js" &&
        file !== "index.ts",
    )
    .sort();

  const applied = await db.all<{ name: string }>("SELECT name FROM migrations");
  const appliedNames = new Set(applied.map((row) => row.name));

  return files.map((file) => ({
    name: path.basename(file, path.extname(file)),
    applied: appliedNames.has(path.basename(file, path.extname(file))),
  }));
}
