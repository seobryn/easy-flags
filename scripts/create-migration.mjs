#!/usr/bin/env node

/**
 * Create a new database migration
 * Usage: npm run migration:create my_feature_name
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const migrationName = process.argv[2];

if (!migrationName) {
  console.error("❌ Error: Migration name is required");
  console.error("Usage: npm run migration:create my_feature_name");
  process.exit(1);
}

// Validate migration name
if (!/^[a-z0-9_]+$/.test(migrationName)) {
  console.error(
    "❌ Error: Migration name must contain only lowercase letters, numbers, and underscores",
  );
  process.exit(1);
}

// Create migrations directory if it doesn't exist
const migrationsDir = path.join(__dirname, "migrations");
if (!fs.existsSync(migrationsDir)) {
  fs.mkdirSync(migrationsDir, { recursive: true });
}

// Generate timestamp and filename
const timestamp = new Date().toISOString().replace(/[:-]/g, "").split(".")[0];
const filename = `${timestamp}_${migrationName}.sql`;
const filePath = path.join(migrationsDir, filename);

// Create template migration file
const template = `-- Migration: ${migrationName}
-- Created: ${new Date().toISOString()}
-- Description: [Add your migration description here]

-- Add your SQL statements below:

`;

try {
  fs.writeFileSync(filePath, template);
  console.log(`✅ Migration created: ${filename}`);
  console.log(`📝 Location: ${filePath}`);
  console.log("\n   Edit this file to add your SQL statements.");
  console.log("   The migration will run automatically on next database init.");
} catch (error) {
  console.error("❌ Error creating migration:", error.message);
  process.exit(1);
}
