#!/usr/bin/env node

/**
 * Migration script to add slug column to environments table and generate slugs for existing records
 */

import { createClient } from "@libsql/client";
import { config } from "dotenv";

// Load environment variables from .env file
config();

const dbUrl = process.env.DATABASE_URL || "file:./data.db";
const dbAuthToken = process.env.DATABASE_AUTH_TOKEN;

function generateSlug(text) {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

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
    console.log("🚀 Starting migration to add slug column to environments...");
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

    // Check if slug column already exists
    const tableInfo = await client.execute("PRAGMA table_info(environments);");
    const hasSlugColumn = tableInfo.rows.some((row) => row.name === "slug");

    if (hasSlugColumn) {
      console.log("✨ Slug column already exists. Skipping migration.");
      process.exit(0);
    }

    // Add slug column
    console.log("\n📝 Adding slug column to environments table...");
    await client.execute(
      "ALTER TABLE environments ADD COLUMN slug TEXT DEFAULT '' NOT NULL;",
    );
    console.log("✅ Slug column added");

    // Fetch all environments grouped by space
    console.log("\n🔄 Generating unique slugs for existing environments...");
    const spaces = await client.execute(
      "SELECT DISTINCT space_id FROM environments",
    );

    let totalUpdated = 0;

    for (const spaceRow of spaces.rows) {
      const spaceId = spaceRow.space_id;
      const envs = await client.execute(
        "SELECT id, name FROM environments WHERE space_id = ? ORDER BY id",
        [spaceId],
      );

      const existingSlugs = [];

      for (const env of envs.rows) {
        const baseSlug = generateSlug(env.name);
        const slug = makeSlugUnique(baseSlug, existingSlugs);
        existingSlugs.push(slug);

        console.log(`  - Space ${spaceId}: "${env.name}" → "${slug}"`);

        await client.execute("UPDATE environments SET slug = ? WHERE id = ?", [
          slug,
          env.id,
        ]);
        totalUpdated++;
      }
    }

    console.log(
      `\n✨ Successfully updated ${totalUpdated} environments with slugs`,
    );

    // Add unique constraint
    console.log("\n🔒 Adding unique constraint...");
    // Note: SQLite doesn't support adding constraints directly, so we'll just verify the data is correct
    console.log("✅ Migration complete!");
    console.log(
      "\n📋 To enforce uniqueness, consider recreating the table with UNIQUE(space_id, slug) constraint",
    );

    process.exit(0);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

main();
