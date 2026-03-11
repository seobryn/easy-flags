/**
 * Utility Functions
 */

import { createHash } from "crypto";

export function generateSecureId(): string {
  return `key_${Date.now()}_${Math.random().toString(36).substring(2, 15)}`;
}

export function generateApiKey(): string {
  return `env_${createHash("sha256").update(Math.random().toString()).digest("hex").substring(0, 32)}`;
}

export function hashPassword(password: string): string {
  return createHash("sha256").update(password).digest("hex");
}

export function verifyPassword(password: string, hash: string): boolean {
  return hashPassword(password) === hash;
}

export function customDatetime(): string {
  return new Date().toISOString();
}

export function generateSlug(text: string): string {
  return text
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-+|-+$/g, "");
}

export function makeSlugUnique(
  baseSlug: string,
  existingSlugs: string[],
): string {
  let slug = baseSlug;
  let counter = 1;
  while (existingSlugs.includes(slug)) {
    slug = `${baseSlug}-${counter}`;
    counter++;
  }
  return slug;
}
