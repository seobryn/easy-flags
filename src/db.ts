import path from "path";
import fs from "fs";
import initSqlJs, { Database as SqlJsDatabase } from "sql.js";
import { runMigrations, DatabaseWrapper } from "./migrations/runner";

const dbFile = path.resolve(process.cwd(), "data.db");

let dbInstance: DatabaseWrapper | null = null;
let sqlJsInstance: SqlJsDatabase | null = null;

/**
 * Initialize SQL.js database with proper WASM file location
 * Loads existing database from file or creates a new one
 */
async function initializeDatabase(): Promise<SqlJsDatabase> {
  // Configure sql.js to find the WASM file in different environments
  const wasmLocateFile = (filename: string): string => {
    // Try different locations based on deployment environment
    const possiblePaths = [
      // Production/Vercel: WASM in public/lib
      path.join(process.cwd(), "public", "lib", filename),
      // Development: WASM in node_modules
      path.join(process.cwd(), "node_modules", "sql.js", "dist", filename),
      // Alternative node_modules path
      path.join(
        process.cwd(),
        "node_modules",
        ".pnpm",
        "sql.js@1.8.0",
        "node_modules",
        "sql.js",
        "dist",
        filename,
      ),
    ];

    // Return the first path that exists
    for (const filePath of possiblePaths) {
      if (fs.existsSync(filePath)) {
        return filePath;
      }
    }

    // Fallback to node_modules relative path (will work in most cases)
    return path.join(process.cwd(), "node_modules", "sql.js", "dist", filename);
  };

  const SQL = await initSqlJs({ locateFile: wasmLocateFile });

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
