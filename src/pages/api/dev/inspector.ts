import type { APIRoute } from "astro";
import { getDatabase } from "../../../lib/db";

// Only allow in development
export const prerender = false;

interface InspectorRequest {
  action: "getTables" | "getTableData" | "getTableSchema";
  table?: string;
  limit?: number;
}

export const POST: APIRoute = async ({ request }) => {
  // Only allow in development environment
  const isDevelopment = !import.meta.env.PROD;
  if (!isDevelopment) {
    return new Response(
      JSON.stringify({
        error:
          "Database inspector is only available in development environment",
      }),
      {
        status: 403,
        headers: { "Content-Type": "application/json" },
      },
    );
  }

  try {
    const db = await getDatabase();
    const body = (await request.json()) as InspectorRequest;

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
