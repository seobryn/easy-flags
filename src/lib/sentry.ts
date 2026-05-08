import * as Sentry from "@sentry/astro";
import { EnvManager } from "./env";

let initialized = false;

export async function initSentry() {
  if (initialized) return;

  const dsn = EnvManager.get("SENTRY_DSN");
  if (!dsn) {
    console.log("📝 Sentry: No DSN configured, skipping initialization");
    return;
  }

  Sentry.init({
    dsn,
    integrations: [
      Sentry.httpClientIntegration(),
    ],
    tracesSampleRate: 1.0,
    sampleRate: 1.0,
    environment: EnvManager.get("NODE_ENV") || "development",
  });

  initialized = true;
  console.log("✅ Sentry initialized");
}

export function captureError(error: Error, context?: Record<string, unknown>) {
  if (context) {
    Sentry.setContext("additional", context);
  }
  Sentry.captureException(error);
}

export function captureMessage(message: string, level: Sentry.SeverityLevel = "info") {
  Sentry.captureMessage(message, level);
}