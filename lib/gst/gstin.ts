import { stateByCode } from "./states"

const CHARS = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZ"
const SHAPE = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z][1-9A-Z]Z[0-9A-Z]$/

export function normaliseGstin(input: string): string {
  return input.toUpperCase().replace(/[\s-]/g, "")
}

export function gstinCheckChar(first14: string): string {
  let sum = 0
  for (let i = 0; i < 14; i++) {
    const product = CHARS.indexOf(first14[i]) * (i % 2 === 0 ? 1 : 2)
    sum += Math.floor(product / 36) + (product % 36)
  }
  return CHARS[(36 - (sum % 36)) % 36]
}

export function gstinError(input: string): string | null {
  const g = normaliseGstin(input)
  if (g.length !== 15) return "A GSTIN has 15 characters"
  if (!SHAPE.test(g)) return "This is not a valid GSTIN"
  if (!stateByCode(g.slice(0, 2))) return "The first two digits are not a valid state code"
  if (gstinCheckChar(g.slice(0, 14)) !== g[14]) return "Please check the GSTIN. The last character does not match"
  return null
}
