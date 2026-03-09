import path from "path";
import fs from "fs";
import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import { runMigrations, DatabaseWrapper } from "./migrations/runner";

const dbFile = path.resolve(process.cwd(), "data.db");

let dbInstance: DatabaseWrapper | null = null;
let sqlJsInstance: SqlJsDatabase | null = null;

/**
 * Initialize SQL.js database
 * Loads existing database from file or creates a new one
 */
async function initializeDatabase(): Promise<SqlJsDatabase> {
  const SQL = await initSqlJs();

  let db: SqlJsDatabase;

  // Try to load existing database from file
  if (fs.existsSync(dbFile)) {
    const fileBuffer = fs.readFileSync(dbFile);
    db = new SQL.Database(fileBuffer);
  } else {
    // Create new database
    db = new SQL.Database();
  }

  return db;
}

/**
 * Persist database to file
 */
function persistDatabase(db: SqlJsDatabase): void {
  const data = db.export();
  const buffer = Buffer.from(data);
  fs.writeFileSync(dbFile, buffer);
}

/**
 * Get or create database instance wrapped in DatabaseWrapper
 */
export async function getDb(): Promise<DatabaseWrapper> {
  if (dbInstance) return dbInstance;

  sqlJsInstance = await initializeDatabase();

  // Run pending migrations
  const migrationsDir = path.join(__dirname, "migrations");
  await runMigrations(sqlJsInstance, migrationsDir, () =>
    persistDatabase(sqlJsInstance!),
  );

  // Create wrapped database instance
  dbInstance = new DatabaseWrapper(sqlJsInstance, () =>
    persistDatabase(sqlJsInstance!),
  );

  // Persist database after initialization
  persistDatabase(sqlJsInstance);

  return dbInstance;
}

/**
 * Persist database when needed
 */
export function saveDatabaseState(): void {
  if (sqlJsInstance) {
    persistDatabase(sqlJsInstance);
  }
}

export default getDb;
