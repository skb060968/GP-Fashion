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
  email: z.string().email(),
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
  paymentMethod: z.enum(["UPI_MANUAL", "COD"]),
  couponCode: z.string().optional(),
});

export const updateStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
});

export const couponSchema = z.object({
  code: z.string().min(1, "Code is required").regex(
    /^[A-Z0-9-]+$/,
    "Code must contain only uppercase letters, numbers, and hyphens"
  ),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number().int().positive("Discount value must be a positive integer"),
  minOrderAmount: z.number().int().min(0).nullable().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().datetime().nullable().optional(),
}).refine(
  (data) => data.discountType !== "PERCENTAGE" || (data.discountValue >= 1 && data.discountValue <= 100),
  { message: "Percentage discount must be between 1 and 100", path: ["discountValue"] }
);

export type CouponFormData = z.infer<typeof couponSchema>;

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
