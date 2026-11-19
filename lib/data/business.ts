import { contact } from "./contact"

export const GSTIN_PLACEHOLDER = "07XXXXXXXXXX1ZX"

export const business = {
  legalName: "Piyush Bholla Label",
  addressLines: ["N-37A, Vijay Vihar, Uttam Nagar", "Delhi 110059"],
  state: "Delhi",
  stateCode: "07",
  gstin: "07FSKPB8774F1ZD",
  email: contact.email,
  phone: contact.phone,
  invoicePrefix: "PBL",
}

export const gstinIsPlaceholder = () => business.gstin === GSTIN_PLACEHOLDER

export function formatInvoiceNumber(financialYear: string, sequence: number): string {
  return `${business.invoicePrefix}/${financialYear}/${String(sequence).padStart(4, "0")}`
}
