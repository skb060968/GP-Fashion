import { z } from "zod";
import { OrderStatus } from "@prisma/client";

export const orderItemSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  size: z.enum(["S", "M", "L", "XL"]),
  price: z.number().int().positive(),
  quantity: z.number().int().min(1).max(10),
  coverThumbnail: z.string().min(1),
});

export const addressSchema = z.object({
  fullName: z.string().min(2).max(100),
  phone: z.string().regex(/^[6-9]\d{9}$/),
  email: z.string().email().optional().or(z.literal("")),
  addressLine1: z.string().min(5).max(200),
  addressLine2: z.string().max(200).optional().or(z.literal("")),
  city: z.string().min(1),
  state: z.string().min(1),
  pincode: z.string().regex(/^\d{6}$/),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  address: addressSchema,
  amount: z.number().int().positive(),
  discount: z.number().int().min(0).optional(),
  paymentMethod: z.enum(["UPI_MANUAL", "COD"]),
  couponCode: z.string().optional(),
});

export const updateStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

/**
 * Converts a ZodError into a flat field-level error map.
 * Nested paths are joined with dots (e.g. "address.phone").
 */
export function formatZodErrors(error: z.ZodError): Record<string, string> {
  const errors: Record<string, string> = {};
  for (const issue of error.issues) {
    const path = issue.path.join(".");
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }
  return errors;
}
