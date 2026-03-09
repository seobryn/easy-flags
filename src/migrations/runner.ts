import { Database } from "sql.js";
import fs from "fs";
import path from "path";

/**
 * Wrapper to provide a sqlite-like interface for sql.js
 */
export class DatabaseWrapper {
  constructor(
    private db: Database,
    private onChanges?: () => void,
  ) {}

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
      const stmt = this.db.prepare(sql);
      if (params && params.length > 0) {
        stmt.bind(params);
      }

      const results: T[] = [];
      while (stmt.step()) {
        results.push(stmt.getAsObject() as T);
      }
      stmt.free();
      return results;
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
      const stmt = this.db.prepare(sql);
      if (params && params.length > 0) {
        stmt.bind(params);
      }

      let result: T | undefined;
      if (stmt.step()) {
        result = stmt.getAsObject() as T;
      }
      stmt.free();
      return result;
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
      const stmt = this.db.prepare(sql);
      if (params && params.length > 0) {
        stmt.bind(params);
      }
      stmt.step();
      stmt.free();
      this.onChanges?.();
      return {
        changes: this.db.getRowsModified(),
        lastID: this.db.exec("SELECT last_insert_rowid() as id")[0]
          ?.values[0]?.[0] as number,
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
      this.db.run(sql);
      this.onChanges?.();
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
 * @param db - The sql.js Database instance
 * @param migrationsDir - Directory containing migration files
 * @param onChanges - Callback when database changes (for persistence)
 */
export async function runMigrations(
  sqlJsDb: Database,
  migrationsDir: string,
  onChanges?: () => void,
): Promise<void> {
  const db = new DatabaseWrapper(sqlJsDb, onChanges);

  // Create migrations table if it doesn't exist
  await db.exec(`
    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Get all migration files (from compiled .js files)
  const files = fs
    .readdirSync(migrationsDir)
    .filter(
      (file) =>
        file.endsWith(".js") && file !== "runner.js" && file !== "index.js",
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
      // Dynamically import the migration
      const migrationModule = await import(
        path.join(migrationsDir, migrationName)
      );
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
 * @param db - The sql.js Database instance
 * @param migrationsDir - Directory containing migration files
 * @param onChanges - Callback when database changes
 */
export async function rollbackMigration(
  sqlJsDb: Database,
  migrationsDir: string,
  onChanges?: () => void,
): Promise<void> {
  const db = new DatabaseWrapper(sqlJsDb, onChanges);

  // Get the last applied migration
  const lastMigration = await db.get<{ name: string }>(
    "SELECT name FROM migrations ORDER BY id DESC LIMIT 1",
  );

  if (!lastMigration) {
    console.log("No migrations to rollback");
    return;
  }

  try {
    const migrationModule = await import(
      path.join(migrationsDir, lastMigration.name)
    );
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
 * @param db - The sql.js Database instance
 * @param migrationsDir - Directory containing migration files
 */
export async function getMigrationStatus(
  sqlJsDb: Database,
  migrationsDir: string,
): Promise<{ name: string; applied: boolean }[]> {
  const db = new DatabaseWrapper(sqlJsDb);

  const files = fs
    .readdirSync(migrationsDir)
    .filter(
      (file) =>
        file.endsWith(".ts") && file !== "runner.ts" && file !== "index.ts",
    )
    .sort();

  const applied = await db.all<{ name: string }>("SELECT name FROM migrations");
  const appliedNames = new Set(applied.map((row) => row.name));

  return files.map((file) => ({
    name: path.basename(file, path.extname(file)),
    applied: appliedNames.has(path.basename(file, path.extname(file))),
  }));
}
