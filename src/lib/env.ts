/**
 * EnvManager Utility
 * Bridges the gap between Astro's import.meta.env and Node's process.env
 */

export const EnvManager = {
  get(key: string): string {
    // Try Astro environment first
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[key]) {
      return import.meta.env[key];
    }
    
    // Fallback to Node environment
    if (typeof process !== 'undefined' && process.env && process.env[key]) {
      return process.env[key] as string;
    }
    
    return "";
  }
};
