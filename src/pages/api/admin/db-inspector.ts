import type { APIRoute } from "astro";
import { getUserFromContext, isSuperUser } from "@/utils/auth";
import { unauthorizedResponse } from "@/utils/api";
import { getDatabase } from "@/lib/db";
import type { InArgs } from "@libsql/client";
import bcrypt from "bcryptjs";

// Database inspector API - restricted to development OR super users
export const prerender = false;

interface InspectorRequest {
  action:
    | "getTables"
    | "getTableData"
    | "getTableSchema"
    | "addRow"
    | "deleteRow"
    | "updateRow";
  table?: string;
  limit?: number;
  rowData?: Record<string, unknown>;
  rowId?: string | number;
  primaryKey?: string;
}

import { EnvManager } from "@/lib/env";

export const POST: APIRoute = async (context) => {
  // Check authentication
  const user = getUserFromContext(context);
  
  // Rule: Allow in DEVELOPMENT environment for any authenticated user
  // OR Allow in any environment if the user is a SUPER USER
  const isDevelopment = EnvManager.get("PROD") !== "true";
  const isUserSuperUser = isSuperUser(user);

  if (!user) {
    return new Response(JSON.stringify(unauthorizedResponse()), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  if (!isDevelopment && !isUserSuperUser) {
    return new Response(
      JSON.stringify({
        error:
          "Database inspector is restricted to Super Users in production environments",
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const db = await getDatabase();
    const body = (await context.request.json()) as InspectorRequest;

    if (body.action === "getTables") {
      // Get all tables
      const result = await db.execute(
        "SELECT name FROM sqlite_master WHERE type='table' AND name NOT LIKE 'sqlite_%' ORDER BY name",
      );

      const tables = result.rows.map((row) => row.name as string);

      // Get row count for each table
      const tablesWithCounts = await Promise.all(
        tables.map(async (table) => {
          try {
            const countResult = await db.execute(
              `SELECT COUNT(*) as count FROM ${table}`,
            );
            return {
              name: table,
              rowCount: (countResult.rows[0]?.count as number) || 0,
            };
          } catch {
            return {
              name: table,
              rowCount: 0,
            };
          }
        }),
      );

      return new Response(JSON.stringify({ tables: tablesWithCounts }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (body.action === "getTableSchema") {
      if (!body.table) {
        return new Response(JSON.stringify({ error: "Table name required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      // Get table schema
      const result = await db.execute(`PRAGMA table_info(${body.table})`);

      return new Response(JSON.stringify({ schema: result.rows }), {
        headers: { "Content-Type": "application/json" },
      });
    }

    if (body.action === "getTableData") {
      if (!body.table) {
        return new Response(JSON.stringify({ error: "Table name required" }), {
          status: 400,
          headers: { "Content-Type": "application/json" },
        });
      }

      const limit = Math.min(body.limit || 100, 1000); // Max 1000 rows
      const result = await db.execute(
        `SELECT * FROM ${body.table} LIMIT ${limit}`,
      );

      return new Response(
        JSON.stringify({ data: result.rows, total: result.rows.length }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (body.action === "addRow") {
      if (!body.table || !body.rowData) {
        return new Response(
          JSON.stringify({ error: "Table name and row data required" }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Extract password fields metadata and prepare data for insertion
      const passwordFields =
        (body.rowData._passwordFields as string[] | undefined) || [];
      const insertData: Record<string, unknown> = {};

      // Filter out the _passwordFields metadata and process password fields
      for (const [key, value] of Object.entries(body.rowData)) {
        if (key === "_passwordFields") {
          continue; // Skip metadata
        }

        if (passwordFields.includes(key) && typeof value === "string") {
          // Hash the password field
          const hashedPassword = await bcrypt.hash(value, 10);
          insertData[key] = hashedPassword;
        } else {
          insertData[key] = value;
        }
      }

      const columns = Object.keys(insertData);
      const values = Object.values(insertData);
      const placeholders = columns.map(() => "?").join(",");

      const query = `INSERT INTO ${body.table} (${columns.join(",")}) VALUES (${placeholders})`;

      await db.execute({
        sql: query,
        args: values as InArgs,
      });

      return new Response(
        JSON.stringify({ success: true, message: "Row added successfully" }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (body.action === "deleteRow") {
      if (!body.table || body.rowId === undefined || !body.primaryKey) {
        return new Response(
          JSON.stringify({
            error: "Table name, row ID, and primary key name required",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      const query = `DELETE FROM ${body.table} WHERE ${body.primaryKey} = ?`;

      await db.execute({
        sql: query,
        args: [body.rowId],
      });

      return new Response(
        JSON.stringify({ success: true, message: "Row deleted successfully" }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    if (body.action === "updateRow") {
      if (!body.table || body.rowId === undefined || !body.rowData) {
        return new Response(
          JSON.stringify({
            error: "Table name, row ID, and row data required",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Get table schema to find primary key
      const schemaResult = await db.execute(`PRAGMA table_info(${body.table})`);
      const schema = schemaResult.rows as unknown as Array<{
        cid: number;
        name: string;
        type: string;
        notnull: number;
        dflt_value: unknown;
        pk: number;
      }>;
      const primaryKeyColumn = schema.find((col) => col.pk === 1);

      if (!primaryKeyColumn) {
        return new Response(
          JSON.stringify({
            error: "Could determine primary key for table",
          }),
          {
            status: 400,
            headers: { "Content-Type": "application/json" },
          },
        );
      }

      // Extract password fields metadata and prepare data for update
      const passwordFields =
        (body.rowData._passwordFields as string[] | undefined) || [];
      const updateData: Record<string, unknown> = {};

      // Filter out the _passwordFields metadata and process password fields
      for (const [key, value] of Object.entries(body.rowData)) {
        if (key === "_passwordFields") {
          continue; // Skip metadata
        }

        if (passwordFields.includes(key) && typeof value === "string") {
          // Hash the password field
          const hashedPassword = await bcrypt.hash(value, 10);
          updateData[key] = hashedPassword;
        } else {
          updateData[key] = value;
        }
      }

      const columns = Object.keys(updateData);
      const values = Object.values(updateData);
      const setClause = columns.map((col) => `${col} = ?`).join(", ");

      // Add rowId as the last argument for the WHERE clause
      values.push(body.rowId);

      const query = `UPDATE ${body.table} SET ${setClause} WHERE ${primaryKeyColumn.name} = ?`;

      await db.execute({
        sql: query,
        args: values as InArgs,
      });

      return new Response(
        JSON.stringify({ success: true, message: "Row updated successfully" }),
        {
          headers: { "Content-Type": "application/json" },
        },
      );
    }

    return new Response(JSON.stringify({ error: "Invalid action" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
