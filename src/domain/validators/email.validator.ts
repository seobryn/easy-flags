/**
 * Validates email format using a regex pattern
 * Ensures proper email structure without external dependencies
 */
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export function validateEmail(email: string): boolean {
  if (typeof email !== "string") {
    return false;
  }
  return emailRegex.test(email.trim());
}