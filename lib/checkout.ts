// lib/checkout.ts
// Shared constants/types for the client-side checkout flow.

export const ADDRESS_STORAGE_KEY = "checkout_address"

export type CheckoutAddress = {
  fullName: string
  phone: string
  email: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  pincode: string
}
