import { badRequestResponse } from "@/utils/api";

export interface ValidationRule {
  type: "required" | "email" | "minLength" | "maxLength" | "pattern" | "min" | "max";
  message: string;
  value?: number | string;
  pattern?: RegExp;
}

export interface ValidationSchema {
  [field: string]: ValidationRule[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export function validateBody(body: unknown, schema: ValidationSchema): { errors: ValidationError[] } | null {
  if (!body || typeof body !== "object") {
    return { errors: [{ field: "_root", message: "Request body must be an object" }] };
  }

  const obj = body as Record<string, unknown>;
  const errors: ValidationError[] = [];

  for (const [field, rules] of Object.entries(schema)) {
    const value = obj[field];

    for (const rule of rules) {
      if (rule.type === "required") {
        if (value === undefined || value === null || value === "") {
          errors.push({ field, message: rule.message });
          continue;
        }
      }

      if (value === undefined || value === null) continue;

      if (rule.type === "email") {
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (typeof value !== "string" || !emailRegex.test(value)) {
          errors.push({ field, message: rule.message });
        }
      }

      if (rule.type === "minLength") {
        if (typeof value === "string" && value.length < (rule.value as number)) {
          errors.push({ field, message: rule.message });
        }
      }

      if (rule.type === "maxLength") {
        if (typeof value === "string" && value.length > (rule.value as number)) {
          errors.push({ field, message: rule.message });
        }
      }

      if (rule.type === "pattern") {
        if (typeof value === "string" && rule.pattern && !rule.pattern.test(value)) {
          errors.push({ field, message: rule.message });
        }
      }

      if (rule.type === "min") {
        if (typeof value === "number" && value < (rule.value as number)) {
          errors.push({ field, message: rule.message });
        }
      }

      if (rule.type === "max") {
        if (typeof value === "number" && value > (rule.value as number)) {
          errors.push({ field, message: rule.message });
        }
      }
    }
  }

  return errors.length > 0 ? { errors } : null;
}

export function validationErrorResponse(errors: ValidationError[]): Response {
  return new Response(
    JSON.stringify(badRequestResponse("Validation failed", "VALIDATION_ERROR", errors)),
    { status: 400, headers: { "Content-Type": "application/json" } },
  );
}

export const authSchemas = {
  login: {
    username: [{ type: "required", message: "Username is required" }],
    password: [{ type: "required", message: "Password is required" }],
  },
  register: {
    username: [
      { type: "required", message: "Username is required" },
      { type: "minLength", message: "Username must be at least 3 characters", value: 3 },
      { type: "maxLength", message: "Username must be at most 30 characters", value: 30 },
    ],
    email: [
      { type: "required", message: "Email is required" },
      { type: "email", message: "Invalid email format" },
    ],
    password: [
      { type: "required", message: "Password is required" },
      { type: "minLength", message: "Password must be at least 6 characters", value: 6 },
    ],
  },
};