import { stateByCode } from "./states"

export type PlaceOfSupplyResult =
  | { ok: true; code: string; basis: "shipping" | "gstin" }
  | { ok: false; field: "gstin" | "billing.state"; message: string }

export function placeOfSupply(input: { shippingStateCode: string; billingStateCode?: string | null; gstin?: string | null }): PlaceOfSupplyResult {
  const gstin = input.gstin?.trim()
  if (!gstin) return { ok: true, code: input.shippingStateCode, basis: "shipping" }

  const registered = gstin.slice(0, 2)
  const billing = input.billingStateCode ?? input.shippingStateCode
  if (billing === registered) return { ok: true, code: registered, basis: "gstin" }

  const reg = stateByCode(registered)?.name ?? registered
  const bill = stateByCode(billing)?.name ?? billing
  return input.billingStateCode
    ? { ok: false, field: "billing.state", message: `This GSTIN is registered in ${reg}, so the billing address must be in ${reg}, not ${bill}` }
    : {
        ok: false,
        field: "gstin",
        message: `This GSTIN is registered in ${reg}, but the address is in ${bill}. Untick "Billing address same as shipping" and enter the address the GSTIN is registered at`,
      }
}
