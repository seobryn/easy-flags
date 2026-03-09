import path from "path";
import { createClient, Client } from "@libsql/client";
import { runMigrations, DatabaseWrapper } from "./migrations/runner";

// Get database connection URL from environment variable or use default
const getConnectionUrl = (): string => {
  const dbUrl = process.env.DATABASE_URL || "file:./data.db";

  // If it's a file path (relative or absolute), convert to file: URL
  if (!dbUrl.startsWith("file:") && !dbUrl.startsWith("libsql:")) {
    if (dbUrl.startsWith("/")) {
      // Absolute path
      return `file:${dbUrl}`;
    } else if (dbUrl.startsWith("./") || dbUrl.startsWith("../")) {
      // Relative path
      return `file:${path.resolve(process.cwd(), dbUrl)}`;
    } else {
      // Assume it's a relative path
      return `file:${path.resolve(process.cwd(), dbUrl)}`;
    }
  }

  return dbUrl;
};

let dbInstance: DatabaseWrapper | null = null;
let libsqlClient: Client | null = null;

/**
 * Initialize libsql client and create database connection
 */
async function initializeDatabase(): Promise<Client> {
  const connectionUrl = getConnectionUrl();

  // Create client for local or remote database
  const client = createClient({
    url: connectionUrl,
    ...(process.env.DATABASE_AUTH_TOKEN && {
      authToken: process.env.DATABASE_AUTH_TOKEN,
    }),
  });

  // Test the connection
  await client.execute("SELECT 1");

  return client;
}

/**
 * Get or create database instance wrapped in DatabaseWrapper
 */
export async function getDb(): Promise<DatabaseWrapper> {
  if (dbInstance) return dbInstance;

  libsqlClient = await initializeDatabase();

  // Create wrapped database instance
  dbInstance = new DatabaseWrapper(libsqlClient);

  // Run pending migrations
  const migrationsDir = path.join(__dirname, "migrations");
  await runMigrations(dbInstance, migrationsDir);

  return dbInstance;
}

/**
 * Close database connection
 */
export async function closeDb(): Promise<void> {
  if (libsqlClient) {
    await libsqlClient.close();
    libsqlClient = null;
    dbInstance = null;
  }
}

export default getDb;
