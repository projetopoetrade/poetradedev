import { z } from "zod";

// Security: Input validation constants
export const MAX_CHARACTER_NAME_LENGTH = 50;
export const MIN_CHARACTER_NAME_LENGTH = 2;
export const MAX_OBSERVATIONS_LENGTH = 500;

// Shared Zod schema for checkout form
export const checkoutSchema = z.object({
  characterName: z
    .string()
    .min(MIN_CHARACTER_NAME_LENGTH, `Character name must be at least ${MIN_CHARACTER_NAME_LENGTH} characters`)
    .max(MAX_CHARACTER_NAME_LENGTH, `Character name must not exceed ${MAX_CHARACTER_NAME_LENGTH} characters`)
    .regex(/^[a-zA-Z0-9_\-\s]+$/, "Character name can only contain letters, numbers, spaces, underscores and hyphens")
    .transform((val) => val.trim())
    .refine(
      (val) => val.length >= MIN_CHARACTER_NAME_LENGTH,
      `Character name must be at least ${MIN_CHARACTER_NAME_LENGTH} characters`
    ),
  
  observations: z
    .string()
    .max(MAX_OBSERVATIONS_LENGTH, `Observations must not exceed ${MAX_OBSERVATIONS_LENGTH} characters`)
    .transform((val) => val.trim())
    .default(""),
});

// TypeScript type inference from schema
export type CheckoutInput = z.infer<typeof checkoutSchema>;

// Security: Sanitize input to prevent XSS and injection attacks
export function sanitizeInput(input: string): string {
  if (typeof input !== 'string') {
    return '';
  }
  
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove potential HTML tags
    .replace(/[\x00-\x1F\x7F]/g, '') // Remove control characters
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+=/gi, '') // Remove event handlers
    .replace(/\{[^}]*\}/g, '') // Remove potential template injection
    .replace(/\$\{[^}]*\}/g, ''); // Remove template literals
}

// Apply sanitization to validated data
export function sanitizeCheckoutData(data: CheckoutInput): CheckoutInput {
  return {
    characterName: sanitizeInput(data.characterName),
    observations: data.observations ? sanitizeInput(data.observations) : "",
  };
}
