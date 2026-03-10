import { createClient, type Client } from "@libsql/client";

let db: Client | null = null;

export async function getDatabase(): Promise<Client> {
  if (!db) {
    const url = process.env.DATABASE_URL || "file:./data.db";
    const authToken = process.env.DATABASE_AUTH_TOKEN;

    db = createClient({
      url,
      ...(authToken && { authToken }),
    });
  }
  return db;
}

export async function closeDatabase(): Promise<void> {
  if (db) {
    // LibSQL client doesn't need explicit close, but we clear reference
    db = null;
  }
}

export async function initializeDatabase(): Promise<void> {
  const database = await getDatabase();

  // Create tables using batch execution
  const schema = `
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      role_id INTEGER NOT NULL,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id)
    );

    CREATE TABLE IF NOT EXISTS spaces (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      owner_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS space_members (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      space_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      role_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (space_id) REFERENCES spaces(id),
      FOREIGN KEY (user_id) REFERENCES users(id),
      FOREIGN KEY (role_id) REFERENCES roles(id),
      UNIQUE(space_id, user_id)
    );

    CREATE TABLE IF NOT EXISTS environments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      space_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (space_id) REFERENCES spaces(id),
      UNIQUE(space_id, name)
    );

    CREATE TABLE IF NOT EXISTS features (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      space_id INTEGER NOT NULL,
      key TEXT NOT NULL,
      name TEXT NOT NULL,
      description TEXT,
      type TEXT DEFAULT 'boolean',
      default_value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (space_id) REFERENCES spaces(id),
      UNIQUE(space_id, key)
    );

    CREATE TABLE IF NOT EXISTS feature_flags (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feature_id INTEGER NOT NULL,
      environment_id INTEGER NOT NULL,
      is_enabled BOOLEAN DEFAULT 0,
      rollout_percentage INTEGER DEFAULT 0,
      value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (feature_id) REFERENCES features(id),
      FOREIGN KEY (environment_id) REFERENCES environments(id),
      UNIQUE(feature_id, environment_id)
    );

    CREATE TABLE IF NOT EXISTS targeting_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feature_flag_id INTEGER NOT NULL,
      rule_type TEXT NOT NULL,
      rule_value TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (feature_flag_id) REFERENCES feature_flags(id)
    );

    CREATE TABLE IF NOT EXISTS migrations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `;

  // Split by semicolon and execute each statement
  const statements = schema
    .split(";")
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0);

  for (const statement of statements) {
    try {
      await database.execute(statement);
    } catch (error) {
      // Table might already exist, continue
      console.log(`Statement executed or skipped:`, statement.substring(0, 50));
    }
  }

  console.log("Database schema initialized");
}

export async function seedDatabase(): Promise<void> {
  const database = await getDatabase();

  try {
    // Check if data already exists
    const rolesResult = await database.execute(
      "SELECT COUNT(*) as count FROM roles",
    );
    const rolesCount = (rolesResult.rows[0]?.count as number) || 0;

    if (rolesCount > 0) {
      console.log("Database already seeded");
      return;
    }

    // Insert default roles
    await database.execute({
      sql: "INSERT INTO roles (name, description) VALUES (?, ?)",
      args: ["admin", "Administrator with full access"],
    });

    await database.execute({
      sql: "INSERT INTO roles (name, description) VALUES (?, ?)",
      args: ["editor", "Editor can modify features and settings"],
    });

    await database.execute({
      sql: "INSERT INTO roles (name, description) VALUES (?, ?)",
      args: ["viewer", "Viewer can only read features"],
    });

    // Insert default admin user
    const adminUser = {
      username: process.env.ADMIN_USER || "admin",
      email: "admin@example.com",
      password_hash: process.env.ADMIN_PASS || "password",
      role_id: 1,
    };

    const result = await database.execute({
      sql: "INSERT INTO users (username, email, password_hash, role_id) VALUES (?, ?, ?, ?)",
      args: [
        adminUser.username,
        adminUser.email,
        adminUser.password_hash,
        adminUser.role_id,
      ],
    });

    console.log(
      "Database seeded successfully with admin user:",
      adminUser.username,
    );
  } catch (error) {
    console.error("Error seeding database:", error);
    throw error;
  }
}

export async function recordMigration(name: string): Promise<void> {
  const database = await getDatabase();
  await database.execute({
    sql: "INSERT INTO migrations (name) VALUES (?)",
    args: [name],
  });
}

export async function getMigrationStatus(): Promise<string[]> {
  const database = await getDatabase();
  const result = await database.execute(
    "SELECT name FROM migrations ORDER BY executed_at",
  );
  return result.rows.map((row) => row.name as string);
}
