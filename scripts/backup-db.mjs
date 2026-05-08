#!/usr/bin/env node

/**
 * Database backup script for Easy Flags
 * Usage: node scripts/backup-db.js [output-dir]
 * 
 * Options:
 *   - Creates timestamped backup files
 *   - Keeps last 7 backups by default
 *   - Supports both local file and Turso (LibSQL) databases
 */

import * as fs from "fs";
import * as path from "path";
import { fileURLToPath } from "url";
import { createClient } from "@libsql/client";
import { config } from "dotenv";

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const outputDir = process.argv[2] || path.join(__dirname, "..", "backups");
const maxBackups = 7;

const dbUrl = process.env.DATABASE_URL || "file:./data.db";
const dbAuthToken = process.env.DATABASE_AUTH_TOKEN;

function formatDate(date) {
  return date.toISOString().replace(/[:]/g, "-").split(".")[0];
}

async function createBackup() {
  console.log("🗄️  Starting database backup...");
  console.log(`📊 Source: ${dbUrl}`);

  // Ensure backup directory exists
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
    console.log(`📁 Created backup directory: ${outputDir}`);
  }

  const timestamp = formatDate(new Date());
  const isRemote = dbUrl.startsWith("libsql://") || dbUrl.startsWith("https://");

  let backupData;

  if (isRemote) {
    // For Turso remote, use their backup API
    console.log("☁️  Backing up remote database...");
    const client = createClient({ url: dbUrl, authToken: dbAuthToken });

    // Export all tables
    const tables = [
      "roles", "users", "spaces", "space_members", "environments",
      "features", "feature_flags", "environment_configs", "api_keys",
      "user_api_keys", "user_preferences", "targeting_rules",
      "advanced_configurations", "feature_permissions",
      "flag_evaluations", "flag_usage_metrics", "performance_metrics",
      "pricing_plans", "pricing_plan_features", "pricing_plan_limits",
      "space_subscriptions", "migrations"
    ];

    backupData = { timestamp: new Date().toISOString(), tables: {} };

    for (const table of tables) {
      try {
        const result = await client.execute(`SELECT * FROM ${table}`);
        backupData.tables[table] = result.rows;
        console.log(`   ✓ ${table}: ${result.rows.length} rows`);
      } catch (e) {
        console.log(`   - ${table}: table not found, skipping`);
      }
    }
  } else {
    // For local file, just copy the file
    const dbPath = dbUrl.replace("file:", "");
    if (!fs.existsSync(dbPath)) {
      console.error("❌ Database file not found:", dbPath);
      process.exit(1);
    }

    const ext = path.extname(dbPath);
    const basename = path.basename(dbPath, ext);
    const backupFilename = `${basename}_${timestamp}${ext}`;
    const backupPath = path.join(outputDir, backupFilename);

    fs.copyFileSync(dbPath, backupPath);
    console.log(`✅ Backup created: ${backupPath}`);

    // Clean up old backups
    await cleanupOldBackups(basename, ext);
    return;
  }

  // Write JSON backup for remote
  const backupFilename = `backup_${timestamp}.json`;
  const backupPath = path.join(outputDir, backupFilename);
  fs.writeFileSync(backupPath, JSON.stringify(backupData, null, 2));
  console.log(`✅ JSON backup created: ${backupPath}`);

  await cleanupOldBackups("backup_", ".json");
  console.log("✨ Backup complete!");
}

async function cleanupOldBackups(prefix, ext) {
  const files = fs.readdirSync(outputDir)
    .filter(f => f.startsWith(prefix) && f.endsWith(ext))
    .sort()
    .reverse();

  if (files.length > maxBackups) {
    const toDelete = files.slice(maxBackups);
    for (const file of toDelete) {
      const filePath = path.join(outputDir, file);
      fs.unlinkSync(filePath);
      console.log(`🗑️  Deleted old backup: ${file}`);
    }
  }
}

createBackup().catch(err => {
  console.error("❌ Backup failed:", err);
  process.exit(1);
});