import { createClient, type Client } from "@libsql/client";

let db: Client | null = null;
let dbInitialized = false;

export async function getDatabase(): Promise<Client> {
  if (!db) {
    const url = import.meta.env.DATABASE_URL || "file:./data.db";
    const authToken = import.meta.env.DATABASE_AUTH_TOKEN;

    db = createClient({
      url,
      ...(authToken && { authToken }),
    });

    // Automatically initialize database on first connection if empty
    if (!dbInitialized) {
      dbInitialized = true;
      try {
        // Check if tables exist
        const result = await db.execute(
          "SELECT name FROM sqlite_master WHERE type='table' AND name='spaces'",
        );
        if (result.rows.length === 0) {
          // Database is empty, initialize it
          await initializeDatabase();
        }
      } catch (err) {
        console.error("Error checking database state:", err);
        // Continue anyway - the initialize call will handle errors
      }
    }
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
      slug TEXT NOT NULL,
      description TEXT,
      owner_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id),
      UNIQUE(slug)
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
      slug TEXT NOT NULL,
      description TEXT,
      type TEXT DEFAULT 'other',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (space_id) REFERENCES spaces(id),
      UNIQUE(space_id, name),
      UNIQUE(space_id, slug)
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

    CREATE TABLE IF NOT EXISTS environment_configs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      environment_id INTEGER NOT NULL,
      key TEXT NOT NULL,
      default_value TEXT NOT NULL,
      overridden_value TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (environment_id) REFERENCES environments(id),
      UNIQUE(environment_id, key)
    );

    CREATE TABLE IF NOT EXISTS api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      environment_id INTEGER NOT NULL,
      key TEXT UNIQUE NOT NULL,
      last_used DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (environment_id) REFERENCES environments(id)
    );

    CREATE TABLE IF NOT EXISTS user_api_keys (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      key TEXT UNIQUE NOT NULL,
      last_used DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS user_preferences (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL UNIQUE,
      email_notifications BOOLEAN DEFAULT 1,
      security_alerts BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS advanced_configurations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feature_flag_id INTEGER NOT NULL,
      rollout_percentage INTEGER DEFAULT 0,
      rollout_start_date DATETIME,
      rollout_end_date DATETIME,
      default_value TEXT,
      scheduling_enabled BOOLEAN DEFAULT 0,
      schedule_start_date DATETIME,
      schedule_start_time TEXT,
      schedule_end_date DATETIME,
      schedule_end_time TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (feature_flag_id) REFERENCES feature_flags(id),
      UNIQUE(feature_flag_id)
    );

    CREATE TABLE IF NOT EXISTS targeting_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feature_flag_id INTEGER NOT NULL,
      rule_type TEXT NOT NULL,
      rule_value TEXT NOT NULL,
      operator TEXT DEFAULT 'equals',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (feature_flag_id) REFERENCES feature_flags(id)
    );

    CREATE TABLE IF NOT EXISTS feature_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_id INTEGER NOT NULL,
      feature_name TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id),
      UNIQUE(role_id, feature_name)
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

    // Insert default roles with specific IDs
    await database.execute({
      sql: "INSERT INTO roles (id, name, description) VALUES (?, ?, ?)",
      args: [
        1,
        "super_user",
        "Super User with access to system administration tools",
      ],
    });

    await database.execute({
      sql: "INSERT INTO roles (id, name, description) VALUES (?, ?, ?)",
      args: [2, "admin", "Administrator with full access"],
    });

    await database.execute({
      sql: "INSERT INTO roles (id, name, description) VALUES (?, ?, ?)",
      args: [3, "editor", "Editor can modify features and settings"],
    });

    await database.execute({
      sql: "INSERT INTO roles (id, name, description) VALUES (?, ?, ?)",
      args: [4, "viewer", "Viewer can only read features"],
    });

    // Seed feature permissions
    // Seed feature permissions using defined defaults
    // SUPER_USER (role_id: 1) - all features
    const superUserFeatures = [
      "feature_flags",
      "spaces",
      "environments",
      "billing",
      "settings",
      "database_inspector",
      "api_reference",
    ];
    for (const feature of superUserFeatures) {
      await database.execute({
        sql: "INSERT INTO feature_permissions (role_id, feature_name) VALUES (?, ?)",
        args: [1, feature],
      });
    }

    // ADMIN (role_id: 2) - all except database_inspector
    const adminFeatures = [
      "feature_flags",
      "spaces",
      "environments",
      "billing",
      "settings",
      "api_reference",
    ];
    for (const feature of adminFeatures) {
      await database.execute({
        sql: "INSERT INTO feature_permissions (role_id, feature_name) VALUES (?, ?)",
        args: [2, feature],
      });
    }

    // EDITOR (role_id: 3) - feature flags, spaces, environments, api_reference
    const editorFeatures = [
      "feature_flags",
      "spaces",
      "environments",
      "api_reference",
    ];
    for (const feature of editorFeatures) {
      await database.execute({
        sql: "INSERT INTO feature_permissions (role_id, feature_name) VALUES (?, ?)",
        args: [3, feature],
      });
    }

    // VIEWER (role_id: 4) - feature flags, api_reference (read-only access)
    const viewerFeatures = ["feature_flags", "api_reference"];
    for (const feature of viewerFeatures) {
      await database.execute({
        sql: "INSERT INTO feature_permissions (role_id, feature_name) VALUES (?, ?)",
        args: [4, feature],
      });
    }

    // Insert default super user (role_id: 1)
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
      "Database seeded successfully with roles and admin user:",
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
