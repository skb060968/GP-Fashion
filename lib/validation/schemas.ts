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
  fullName: z.string().min(2, "Name must be at least 2 characters").max(100, "Name is too long"),
  phone: z.string().regex(/^[6-9]\d{9}$/, "Invalid phone number. Must be a 10-digit Indian mobile number"),
  email: z.string().email("Invalid email address"),
  addressLine1: z.string().min(5, "Address must be at least 5 characters").max(200, "Address is too long"),
  addressLine2: z.string().max(200).optional().or(z.literal("")),
  city: z.string().min(1, "City is required"),
  state: z.string().min(1, "State is required"),
  pincode: z.string().regex(/^\d{6}$/, "Invalid pincode. Must be a 6-digit number"),
});

/** Saved address in a customer's address book. */
export const userAddressSchema = addressSchema.omit({ email: true }).extend({
  label: z.string().trim().max(40).optional().or(z.literal("")),
  isDefault: z.boolean().optional(),
});

export const createOrderSchema = z.object({
  items: z.array(orderItemSchema).min(1),
  address: addressSchema,
  amount: z.number().int().positive(),
  paymentMethod: z.enum(["UPI_MANUAL", "COD", "RAZORPAY"]),
  couponCode: z.string().optional(),
});

export const updateStatusSchema = z.object({
  status: z.nativeEnum(OrderStatus),
  note: z.string().max(500).optional(),
  /** Defaults to true; the admin can suppress the customer email. */
  notifyCustomer: z.boolean().optional(),
});

export const updateNotesSchema = z.object({
  notes: z.string().max(5000),
});

/** PATCH /api/admin/orders/[orderId] accepts either a status change or a notes update. */
export const adminOrderPatchSchema = z.union([
  updateStatusSchema.extend({ action: z.literal("status") }),
  updateNotesSchema.extend({ action: z.literal("notes") }),
]);

export const couponSchema = z.object({
  code: z.string().min(1, "Code is required").regex(
    /^[A-Z0-9-]+$/,
    "Code must contain only uppercase letters, numbers, and hyphens"
  ),
  discountType: z.enum(["PERCENTAGE", "FIXED"]),
  discountValue: z.number().int().positive("Discount value must be a positive integer"),
  minOrderAmount: z.number().int().min(0).nullable().optional(),
  maxUses: z.number().int().positive().nullable().optional(),
  expiresAt: z.string().datetime({ offset: true }).nullable().optional(),
  isActive: z.boolean().optional(),
}).refine(
  (data) => data.discountType !== "PERCENTAGE" || (data.discountValue >= 1 && data.discountValue <= 100),
  { message: "Percentage discount must be between 1 and 100", path: ["discountValue"] }
);

export type CouponFormData = z.infer<typeof couponSchema>;

export const razorpayCreateOrderSchema = z.object({
  amount: z.number().int().positive("Amount must be a positive integer"),
});

export const razorpayVerifyPaymentSchema = z.object({
  razorpay_payment_id: z.string().min(1, "Payment ID is required"),
  razorpay_order_id: z.string().min(1, "Order ID is required"),
  razorpay_signature: z.string().min(1, "Signature is required"),
  orderData: createOrderSchema,
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
