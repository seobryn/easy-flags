import { createClient } from "@libsql/client";
import * as dotenv from "dotenv";
dotenv.config();

async function checkTable() {
  const tableName = process.argv[2];
  if (!tableName) {
    console.error("Please provide a table name.");
    return;
  }

  const url = process.env.DATABASE_URL;
  const authToken = process.env.DATABASE_AUTH_TOKEN;
  const client = createClient({ url, authToken });

  try {
    const result = await client.execute(`SELECT name FROM sqlite_master WHERE type='table' AND name='${tableName}'`);
    console.log(`Table '${tableName}' check:`, result.rows);
    
    if (result.rows.length > 0) {
      const columns = await client.execute(`PRAGMA table_info(${tableName})`);
      console.log("Columns:", columns.rows);

      const rows = await client.execute(`SELECT * FROM ${tableName} LIMIT 10`);
      console.log("Rows:", rows.rows);
    }
  } catch (err) {
    console.error("Check failed:", err);
  }
}

checkTable();
