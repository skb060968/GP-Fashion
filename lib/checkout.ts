import { findState } from "@/lib/gst/states"

export const ADDRESS_STORAGE_KEY = "checkout_address"

export type BillingFields = {
  fullName: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  pincode: string
}

export type CheckoutAddress = {
  fullName: string
  phone: string
  email: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  pincode: string
  businessName?: string
  gstin?: string
  billing?: BillingFields
}

export const EMPTY_BILLING: BillingFields = { fullName: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "" }

export const canonicalState = (state: string | null | undefined) => findState(state)?.name ?? ""
