export const PAYMENT_REFERENCE_RE = /^[A-Z0-9]{6,35}$/

export const PAYMENT_REFERENCE_ERROR = "Enter the UPI transaction reference (UTR) as shown in your UPI app, usually 12 digits"

export const normalisePaymentReference = (v: string) => v.toUpperCase().replace(/[\s-]/g, "")
