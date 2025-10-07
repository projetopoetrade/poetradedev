import { z } from "zod";

// Security: Input validation constants
export const MAX_CHARACTER_NAME_LENGTH = 50;
export const MIN_CHARACTER_NAME_LENGTH = 2;
export const MAX_OBSERVATIONS_LENGTH = 500;

// PIX validation constants
export const CPF_LENGTH = 11;
export const PHONE_MIN_LENGTH = 10;
export const PHONE_MAX_LENGTH = 11;

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

// CPF validation helper
export function validateCPF(cpf: string): boolean {
  // Remove non-digits
  const cleanCPF = cpf.replace(/\D/g, '');
  
  // Check if has 11 digits
  if (cleanCPF.length !== CPF_LENGTH) {
    return false;
  }
  
  // Check for known invalid CPFs (all digits the same)
  if (/^(\d)\1{10}$/.test(cleanCPF)) {
    return false;
  }
  
  // Validate CPF algorithm
  let sum = 0;
  let remainder;
  
  // First verification digit
  for (let i = 1; i <= 9; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (11 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(9, 10))) return false;
  
  // Second verification digit
  sum = 0;
  for (let i = 1; i <= 10; i++) {
    sum += parseInt(cleanCPF.substring(i - 1, i)) * (12 - i);
  }
  remainder = (sum * 10) % 11;
  if (remainder === 10 || remainder === 11) remainder = 0;
  if (remainder !== parseInt(cleanCPF.substring(10, 11))) return false;
  
  return true;
}

// Phone validation helper
export function validateBrazilianPhone(phone: string): boolean {
  // Remove non-digits
  const cleanPhone = phone.replace(/\D/g, '');
  
  // Check if has 10 or 11 digits (with or without 9th digit for mobile)
  if (cleanPhone.length < PHONE_MIN_LENGTH || cleanPhone.length > PHONE_MAX_LENGTH) {
    return false;
  }
  
  // Check if starts with valid DDD (area code between 11-99)
  const ddd = parseInt(cleanPhone.substring(0, 2));
  if (ddd < 11 || ddd > 99) {
    return false;
  }
  
  return true;
}

// PIX checkout schema
export const pixCheckoutSchema = z.object({
  email: z
    .string()
    .min(1, "Email is required")
    .email("Invalid email address")
    .transform((val) => val.trim().toLowerCase()),
  
  cpf: z
    .string()
    .min(1, "CPF is required")
    .transform((val) => val.replace(/\D/g, ''))
    .refine((val) => val.length === CPF_LENGTH, "CPF must have 11 digits")
    .refine((val) => validateCPF(val), "Invalid CPF"),
  
  phone: z
    .string()
    .min(1, "Phone is required")
    .transform((val) => val.replace(/\D/g, ''))
    .refine(
      (val) => val.length >= PHONE_MIN_LENGTH && val.length <= PHONE_MAX_LENGTH,
      "Phone must have 10 or 11 digits"
    )
    .refine((val) => validateBrazilianPhone(val), "Invalid phone number"),
});

export type PixCheckoutInput = z.infer<typeof pixCheckoutSchema>;

// Sanitize PIX data
export function sanitizePixData(data: PixCheckoutInput): PixCheckoutInput {
  return {
    email: sanitizeInput(data.email.trim().toLowerCase()),
    cpf: data.cpf.replace(/\D/g, ''),
    phone: data.phone.replace(/\D/g, ''),
  };
}
