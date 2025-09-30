import { z } from "zod";

// Security: Input validation constants
export const MAX_EMAIL_LENGTH = 254; // RFC 5321
export const MAX_SUBJECT_LENGTH = 200;
export const MAX_DESCRIPTION_LENGTH = 5000;
export const MIN_DESCRIPTION_LENGTH = 10;

// Shared Zod schema for ticket creation
export const ticketSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email format")
    .max(MAX_EMAIL_LENGTH, `Email must not exceed ${MAX_EMAIL_LENGTH} characters`)
    .transform((val) => val.trim().toLowerCase()),
  
  subject: z
    .string()
    .min(1, "Subject is required")
    .max(MAX_SUBJECT_LENGTH, `Subject must not exceed ${MAX_SUBJECT_LENGTH} characters`)
    .transform((val) => val.trim())
    .refine(
      (val) => val.length > 0,
      "Subject cannot be empty"
    ),
  
  description: z
    .string()
    .min(MIN_DESCRIPTION_LENGTH, `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`)
    .max(MAX_DESCRIPTION_LENGTH, `Description must not exceed ${MAX_DESCRIPTION_LENGTH} characters`)
    .transform((val) => val.trim())
    .refine(
      (val) => val.length >= MIN_DESCRIPTION_LENGTH,
      `Description must be at least ${MIN_DESCRIPTION_LENGTH} characters`
    ),
});

// TypeScript type inference from schema
export type TicketInput = z.infer<typeof ticketSchema>;

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
export function sanitizeTicketData(data: TicketInput): TicketInput {
  return {
    email: sanitizeInput(data.email),
    subject: sanitizeInput(data.subject),
    description: sanitizeInput(data.description),
  };
}
