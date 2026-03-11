#!/usr/bin/env node

/**
 * Database initialization script for Turso/LibSQL
 * This script will:
 * 1. Initialize the database schema
 * 2. Seed default data (roles, admin user)
 * 3. Run any pending migrations
 */

import { createClient } from "@libsql/client";
import bcrypt from "bcryptjs";
import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

// Load environment variables from .env file
config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const dbUrl = process.env.DATABASE_URL || "file:./data.db";
const dbAuthToken = process.env.DATABASE_AUTH_TOKEN;

/**
 * Generate URL-friendly slug from text
 * Converts to lowercase and replaces spaces with dashes
 */
function generateSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Make slug unique in a collection by appending numbers if needed
 */
function makeSlugUnique(baseSlug, existingSlugs) {
  let slug = baseSlug;
  let counter = 1;
  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}

async function main() {
  try {
    console.log("🚀 Initializing Easy Flags database...");
    console.log(`📊 Database URL: ${dbUrl}`);

    // Create database client
    const client = createClient({
      url: dbUrl,
      ...(dbAuthToken && { authToken: dbAuthToken }),
    });

    // Check connection
    const versionResult = await client.execute(
      "SELECT sqlite_version() as version",
    );
    console.log(
      `✅ Connected to database (SQLite ${versionResult.rows[0]?.version})`,
    );

    // Initialize schema
    await initializeSchema(client);

    // Seed default data
    await seedDefaultData(client);

    // Run migrations
    await runMigrations(client);

    console.log("✨ Database initialization complete!");
    process.exit(0);
  } catch (error) {
    console.error("❌ Error initializing database:", error);
    process.exit(1);
  }
}

async function initializeSchema(client) {
  console.log("\n📋 Initializing database schema...");

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

    CREATE TABLE IF NOT EXISTS targeting_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      feature_flag_id INTEGER NOT NULL,
      rule_type TEXT NOT NULL,
      rule_value TEXT NOT NULL,
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

  const statements = schema
    .split(";")
    .map((stmt) => stmt.trim())
    .filter((stmt) => stmt.length > 0);

  for (const statement of statements) {
    try {
      await client.execute(statement);
    } catch (error) {
      if (error.message.includes("already exists")) {
        // Table already exists, skip
      } else {
        throw error;
      }
    }
  }

  console.log("✅ Database schema initialized");
}

async function seedDefaultData(client) {
  console.log("\n🌱 Seeding default data...");

  try {
    // Cleanup: Remove any feature_permissions rows with NULL role_id (data integrity)
    await client.execute(
      "DELETE FROM feature_permissions WHERE role_id IS NULL",
    );

    // Check if roles already exist
    const rolesResult = await client.execute(
      "SELECT COUNT(*) as count FROM roles",
    );
    const rolesCount = rolesResult.rows[0]?.count || 0;

    if (rolesCount > 0) {
      console.log("⏭️  Database already seeded, skipping seed step");
      // After skipping, still check for any NULL role_id rows and warn
      const nullPerms = await client.execute(
        "SELECT COUNT(*) as count FROM feature_permissions WHERE role_id IS NULL",
      );
      if (nullPerms.rows[0]?.count > 0) {
        console.warn(
          `⚠️  WARNING: Found ${nullPerms.rows[0].count} feature_permissions rows with NULL role_id. Please investigate and clean up.`,
        );
      }
      return;
    }

    // Insert default roles with specific IDs
    await client.execute({
      sql: "INSERT INTO roles (id, name, description) VALUES (?, ?, ?)",
      args: [
        1,
        "super_user",
        "Super User with access to system administration tools",
      ],
    });

    await client.execute({
      sql: "INSERT INTO roles (id, name, description) VALUES (?, ?, ?)",
      args: [2, "admin", "Administrator with full access"],
    });

    await client.execute({
      sql: "INSERT INTO roles (id, name, description) VALUES (?, ?, ?)",
      args: [3, "editor", "Editor can modify features and settings"],
    });

    await client.execute({
      sql: "INSERT INTO roles (id, name, description) VALUES (?, ?, ?)",
      args: [4, "viewer", "Viewer can only read features"],
    });

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
      await client.execute({
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
      await client.execute({
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
      await client.execute({
        sql: "INSERT INTO feature_permissions (role_id, feature_name) VALUES (?, ?)",
        args: [3, feature],
      });
    }

    // VIEWER (role_id: 4) - feature flags, api_reference (read-only access)
    const viewerFeatures = ["feature_flags", "api_reference"];
    for (const feature of viewerFeatures) {
      await client.execute({
        sql: "INSERT INTO feature_permissions (role_id, feature_name) VALUES (?, ?)",
        args: [4, feature],
      });
    }

    const username = process.env.ADMIN_USER;
    const password = process.env.ADMIN_PASS;

    if (!username || !password) {
      throw new Error(
        "ADMIN_USER and ADMIN_PASS environment variables must be set to create the default admin user",
      );
    }

    // Insert default super user (role_id: 1)
    const adminUser = {
      username: username,
      passwordPlain: password,
      email: "admin@example.com",
      role_id: 1,
    };

    // Hash the password
    const passwordHash = await bcrypt.hash(adminUser.passwordPlain, 10);

    await client.execute({
      sql: "INSERT INTO users (username, email, password_hash, role_id) VALUES (?, ?, ?, ?)",
      args: [
        adminUser.username,
        adminUser.email,
        passwordHash,
        adminUser.role_id,
      ],
    });

    // After seeding, check for any NULL role_id rows and warn
    const nullPerms = await client.execute(
      "SELECT COUNT(*) as count FROM feature_permissions WHERE role_id IS NULL",
    );
    if (nullPerms.rows[0]?.count > 0) {
      console.warn(
        `⚠️  WARNING: Found ${nullPerms.rows[0].count} feature_permissions rows with NULL role_id after seeding. Please investigate and clean up.`,
      );
    }

    console.log(`✅ Default data seeded`);
    console.log(`   - 4 roles created (super_user, admin, editor, viewer)`);
    console.log(`   - Feature permissions configured for all roles`);
    console.log(`   - Super user created: ${adminUser.username}`);
  } catch (error) {
    console.error("Error seeding data:", error);
    throw error;
  }
}

async function runMigrations(client) {
  console.log("\n📦 Running pending migrations...");

  try {
    // Get list of migration files
    const migrationsDir = path.join(__dirname, "migrations");
    if (!fs.existsSync(migrationsDir)) {
      console.log("⏭️  No migrations directory found");
      return;
    }

    const files = fs
      .readdirSync(migrationsDir)
      .filter((f) => f.endsWith(".sql"))
      .sort();

    if (files.length === 0) {
      console.log("⏭️  No migrations to run");
      return;
    }

    // Get executed migrations
    const executedResult = await client.execute(
      "SELECT name FROM migrations ORDER BY executed_at",
    );
    const executed = new Set(executedResult.rows.map((r) => r.name));

    let totalRun = 0;

    // Run pending migrations
    for (const file of files) {
      if (executed.has(file)) {
        console.log(`⏭️  ${file} (already executed)`);
        continue;
      }

      console.log(`▶️  Running ${file}...`);
      const filePath = path.join(migrationsDir, file);
      const sqlContent = fs.readFileSync(filePath, "utf-8");

      // Split by semicolon and execute statements
      const statements = sqlContent
        .split(";")
        .map((stmt) => stmt.trim())
        .filter((stmt) => stmt.length > 0);

      for (const statement of statements) {
        await client.execute(statement);
      }

      // Record migration
      await client.execute({
        sql: "INSERT INTO migrations (name) VALUES (?)",
        args: [file],
      });

      totalRun++;
    }

    if (totalRun > 0) {
      console.log(`✅ ${totalRun} migration(s) executed`);
    } else {
      console.log("✅ All migrations already executed");
    }
  } catch (error) {
    console.error("Error running migrations:", error);
    throw error;
  }
}

main();
