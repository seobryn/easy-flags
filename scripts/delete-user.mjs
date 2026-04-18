#!/usr/bin/env node

/**
 * Script to delete a user and all associated data
 * Usage: node scripts/delete-user.mjs <username_or_id>
 */

import { createClient } from "@libsql/client";
import { config } from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";

config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbUrl = process.env.DATABASE_URL || "file:./data.db";
const dbAuthToken = process.env.DATABASE_AUTH_TOKEN;

async function main() {
  const identifier = process.argv[2];

  if (!identifier) {
    console.error("❌ Please provide a username or user ID.");
    console.log("Usage: node scripts/delete-user.mjs <username_or_id>");
    process.exit(1);
  }

  const client = createClient({
    url: dbUrl,
    ...(dbAuthToken && { authToken: dbAuthToken }),
  });

  try {
    // 1. Find user
    let user;
    if (isNaN(identifier)) {
      const result = await client.execute({
        sql: "SELECT * FROM users WHERE username = ?",
        args: [identifier]
      });
      user = result.rows[0];
    } else {
      const result = await client.execute({
        sql: "SELECT * FROM users WHERE id = ?",
        args: [parseInt(identifier)]
      });
      user = result.rows[0];
    }

    if (!user) {
      console.error(`❌ User not found: ${identifier}`);
      process.exit(1);
    }

    const userId = user.id;
    console.log(`🗑️  Preparing to delete user: ${user.username} (ID: ${userId})`);

    // 2. Find all spaces owned by the user
    const spacesResult = await client.execute({
      sql: "SELECT id, name FROM spaces WHERE owner_id = ?",
      args: [userId]
    });
    const spaces = spacesResult.rows;

    console.log(`📂 Found ${spaces.length} spaces owned by user.`);

    // 3. Delete each space (which handles cascading for environments, features, etc.)
    for (const space of spaces) {
      console.log(`   - Deleting space: ${space.name} (ID: ${space.id})...`);
      
      // We manually implement the cascading delete here to avoid importing complex services in a script
      // This logic is mirrored from LibSqlSpaceRepository.delete
      
      // a. Space Members
      await client.execute({ sql: "DELETE FROM space_members WHERE space_id = ?", args: [space.id] });
      
      // b. Targeting Rules
      await client.execute({
        sql: `DELETE FROM targeting_rules WHERE feature_flag_id IN (
          SELECT ff.id FROM feature_flags ff 
          JOIN features f ON ff.feature_id = f.id 
          WHERE f.space_id = ?
        )`,
        args: [space.id]
      });

      // c. Advanced Configurations
      await client.execute({
        sql: `DELETE FROM advanced_configurations WHERE feature_flag_id IN (
          SELECT ff.id FROM feature_flags ff 
          JOIN features f ON ff.feature_id = f.id 
          WHERE f.space_id = ?
        )`,
        args: [space.id]
      });

      // d. Feature Flags
      await client.execute({
        sql: `DELETE FROM feature_flags WHERE feature_id IN (SELECT id FROM features WHERE space_id = ?)`,
        args: [space.id]
      });

      // e. API Keys and Environment Configs
      await client.execute({
        sql: `DELETE FROM api_keys WHERE environment_id IN (SELECT id FROM environments WHERE space_id = ?)`,
        args: [space.id]
      });

      await client.execute({
        sql: `DELETE FROM environment_configs WHERE environment_id IN (SELECT id FROM environments WHERE space_id = ?)`,
        args: [space.id]
      });

      // f. Environments and Features
      await client.execute({ sql: "DELETE FROM environments WHERE space_id = ?", args: [space.id] });
      await client.execute({ sql: "DELETE FROM features WHERE space_id = ?", args: [space.id] });

      // g. Analytics
      await client.execute({ sql: "DELETE FROM flag_evaluations WHERE space_id = ?", args: [space.id] });
      await client.execute({ sql: "DELETE FROM flag_usage_metrics WHERE space_id = ?", args: [space.id] });
      await client.execute({ sql: "DELETE FROM performance_metrics WHERE space_id = ?", args: [space.id] });
      
      // h. Logs and reports
      await client.execute({ sql: "DELETE FROM audit_logs WHERE space_id = ?", args: [space.id] });
      await client.execute({ sql: "DELETE FROM permission_denial_logs WHERE space_id = ?", args: [space.id] });
      await client.execute({ sql: "DELETE FROM compliance_reports WHERE space_id = ?", args: [space.id] });

      // i. Finally delete the space itself
      await client.execute({ sql: "DELETE FROM spaces WHERE id = ?", args: [space.id] });
      console.log(`     ✅ Space deleted.`);
    }

    // 4. Cleanup user-specific data in remaining tables
    console.log("🧹 Cleaning up user-specific data...");
    
    // Space memberships as non-owner
    await client.execute({ sql: "DELETE FROM space_members WHERE user_id = ?", args: [userId] });
    
    // API Keys
    await client.execute({ sql: "DELETE FROM user_api_keys WHERE user_id = ?", args: [userId] });
    
    // Preferences
    await client.execute({ sql: "DELETE FROM user_preferences WHERE user_id = ?", args: [userId] });
    
    // Logs
    await client.execute({ sql: "DELETE FROM audit_logs WHERE user_id = ?", args: [userId] });
    await client.execute({ sql: "DELETE FROM permission_denial_logs WHERE user_id = ?", args: [userId] });
    
    // Subscriptions and Payments (should already be covered by ON DELETE CASCADE if supported, but let's be explicit)
    await client.execute({ sql: "DELETE FROM user_subscriptions WHERE user_id = ?", args: [userId] });
    await client.execute({ sql: "DELETE FROM payments WHERE user_id = ?", args: [userId] });

    // 5. Finally, delete the user
    await client.execute({ sql: "DELETE FROM users WHERE id = ?", args: [userId] });

    console.log(`✨ User ${user.username} and all associated data deleted successfully.`);
  } catch (error) {
    console.error("❌ Error deleting user:", error);
    process.exit(1);
  }
}

main();
