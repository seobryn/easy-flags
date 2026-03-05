#!/usr/bin/env node

import fs from "fs";
import path from "path";

// Get migration name from command line arguments
const migrationName = process.argv[2];

if (!migrationName) {
  console.error("❌ Error: Migration name is required");
  console.error("");
  console.error("Usage: npm run migration:create -- <name>");
  console.error("");
  console.error("Examples:");
  console.error("  npm run migration:create -- add_audit_log");
  console.error("  npm run migration:create -- create_feature_tags");
  console.error("  npm run migration:create -- add_timestamps_to_users");
  process.exit(1);
}

// Validate migration name
if (!/^[a-z0-9_]+$/.test(migrationName)) {
  console.error(
    "❌ Error: Migration name must contain only lowercase letters, numbers, and underscores",
  );
  process.exit(1);
}

// Get migrations directory
const migrationsDir = path.join(process.cwd(), "src", "migrations");

// Ensure migrations directory exists
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

// Find the next migration number
const files = fs
  .readdirSync(migrationsDir)
  .filter((f) => f.endsWith(".ts") && f !== "runner.ts" && f !== "index.ts")
  .map((f) => {
    const match = f.match(/^(\d+)_/);
    return match ? parseInt(match[1]) : 0;
  });

const nextNumber = (Math.max(...files, 0) + 1).toString().padStart(3, "0");
const fileName = `${nextNumber}_${migrationName}.ts`;
const filePath = path.join(migrationsDir, fileName);

// Check if file already exists
if (fs.existsSync(filePath)) {
  console.error(`❌ Error: Migration file already exists: ${fileName}`);
  process.exit(1);
}

// Migration template
const template = `import { Database } from "sqlite";
import sqlite3 from "sqlite3";
import { Migration } from "./runner";

/**
 * Migration: ${migrationName}
 * Description: Add a description of what this migration does
 */
const migration: Migration = {
  async up(db: Database<sqlite3.Database>) {
    // TODO: Implement migration logic here
    // Example:
    // await db.exec(\`
    //   CREATE TABLE IF NOT EXISTS my_table (
    //     id INTEGER PRIMARY KEY AUTOINCREMENT,
    //     name TEXT NOT NULL,
    //     created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    //   )
    // \`);
  },

  async down(db: Database<sqlite3.Database>) {
    // TODO: Implement rollback logic here
    // Example:
    // await db.exec("DROP TABLE IF EXISTS my_table");
  },
};

export default migration;
`;

// Create the migration file
fs.writeFileSync(filePath, template);

console.log(`✓ Migration created: ${fileName}`);
console.log(`  Location: src/migrations/${fileName}`);
console.log("");
console.log("Next steps:");
console.log("  1. Edit the migration file to implement your changes");
console.log("  2. Fill in the up() method with your table/data changes");
console.log("  3. Fill in the down() method with rollback logic");
console.log("  4. Run 'npm start' to apply the migration");
console.log("");
