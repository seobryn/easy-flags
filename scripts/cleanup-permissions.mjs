#!/usr/bin/env node

/**
 * Cleanup script to remove feature_permissions rows with NULL role_id
 */

import { createClient } from "@libsql/client";
import { config } from "dotenv";

// Load environment variables from .env file
config();

const dbUrl = process.env.DATABASE_URL || "file:./data.db";
const dbAuthToken = process.env.DATABASE_AUTH_TOKEN;

async function main() {
  try {
    console.log("🚀 Cleaning up feature_permissions table...");
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

    // Count NULL role_id rows before cleanup
    const beforeResult = await client.execute(
      "SELECT COUNT(*) as count FROM feature_permissions WHERE role_id IS NULL",
    );
    const beforeCount = beforeResult.rows[0]?.count || 0;

    console.log(`\n📊 Found ${beforeCount} rows with NULL role_id`);

    if (beforeCount > 0) {
      // Show which rows will be deleted
      const nullRows = await client.execute(
        "SELECT id, role_id, feature_name FROM feature_permissions WHERE role_id IS NULL",
      );
      console.log("\nRows to be deleted:");
      nullRows.rows.forEach((row) => {
        console.log(
          `  - ID: ${row.id}, role_id: ${row.role_id}, feature: ${row.feature_name}`,
        );
      });

      // Delete NULL role_id rows
      await client.execute(
        "DELETE FROM feature_permissions WHERE role_id IS NULL",
      );
      console.log(`\n✅ Deleted ${beforeCount} rows with NULL role_id`);
    }

    // Count after cleanup
    const afterResult = await client.execute(
      "SELECT COUNT(*) as count FROM feature_permissions WHERE role_id IS NULL",
    );
    const afterCount = afterResult.rows[0]?.count || 0;

    console.log(
      `\n✨ Cleanup complete! Remaining NULL role_id rows: ${afterCount}`,
    );

    // Show summary of feature_permissions by role
    const summaryResult = await client.execute(
      "SELECT role_id, COUNT(*) as count FROM feature_permissions GROUP BY role_id ORDER BY role_id",
    );
    console.log("\n📋 Feature permissions by role:");
    summaryResult.rows.forEach((row) => {
      const roleMap = {
        1: "super_user",
        2: "admin",
        3: "editor",
        4: "viewer",
      };
      console.log(
        `  - Role ${row.role_id} (${roleMap[row.role_id] || "unknown"}): ${row.count} features`,
      );
    });

    process.exit(0);
  } catch (error) {
    console.error("❌ Error cleaning up database:", error);
    process.exit(1);
  }
}

main();
