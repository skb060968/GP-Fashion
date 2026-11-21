import { addressSchema, billingAddressSchema, formatZodErrors } from "./schemas";

export function validateAddress(data: unknown): { valid: boolean; errors: Record<string, string> } {
  const result = addressSchema.safeParse(data);
  if (result.success) {
    return { valid: true, errors: {} };
  }
  return { valid: false, errors: formatZodErrors(result.error) };
}

export function validateBillingAddress(data: unknown): { valid: boolean; errors: Record<string, string> } {
  const result = billingAddressSchema.safeParse(data);
  if (result.success) {
    return { valid: true, errors: {} };
  }
  return { valid: false, errors: formatZodErrors(result.error) };
}
