import type { APIRoute } from "astro";

export const prerender = false;

export const GET: APIRoute = async () => {
  const checks: Record<string, { status: string; latency?: number; error?: string }> = {};
  let allHealthy = true;

  // Check database
  const dbStart = Date.now();
  try {
    const { getDatabase } = await import("@/lib/db");
    const db = await getDatabase();
    await db.execute("SELECT 1");
    checks.database = { status: "healthy", latency: Date.now() - dbStart };
  } catch (error) {
    checks.database = {
      status: "unhealthy",
      latency: Date.now() - dbStart,
      error: error instanceof Error ? error.message : "Unknown error",
    };
    allHealthy = false;
  }

  // Check rate limiter (in-memory store is always up)
  checks.rateLimiter = { status: "healthy" };

  // Check environment variables
  const requiredEnvVars = ["JWT_SECRET", "DATABASE_URL", "SITE_URL"];
  const missing = requiredEnvVars.filter((v) => !import.meta.env[v]);
  if (missing.length > 0) {
    checks.environment = {
      status: "degraded",
      error: `Missing: ${missing.join(", ")}`,
    };
  } else {
    checks.environment = { status: "healthy" };
  }

  const status = allHealthy ? 200 : 503;
  const statusText = allHealthy ? "healthy" : "degraded";

  return new Response(
    JSON.stringify({
      status: statusText,
      timestamp: new Date().toISOString(),
      checks,
    }),
    {
      status,
      headers: {
        "Content-Type": "application/json",
        "Cache-Control": "no-store, max-age=0",
      },
    },
  );
};