export const GST_RATE = 18

export const HSN_CODES = {
  "6203": "Men's or boys' suits, blazers, trousers, jeans and shorts, woven",
  "6204": "Women's or girls' suits, dresses, skirts and trousers, woven",
  "6205": "Men's or boys' shirts, woven",
  "6206": "Women's or girls' blouses and shirts, woven",
} as const

export type HsnCode = keyof typeof HSN_CODES

export function taxInclusive(paise: number, rate = GST_RATE) {
  const tax = Math.round((paise * rate) / (100 + rate))
  return { taxable: paise - tax, tax }
}

export function allocate(total: number, weights: number[]): number[] {
  const sum = weights.reduce((a, b) => a + b, 0)
  if (total <= 0 || sum <= 0) return weights.map(() => 0)
  const exact = weights.map((w) => (total * w) / sum)
  const parts = exact.map(Math.floor)
  let left = total - parts.reduce((a, b) => a + b, 0)
  const order = exact.map((x, i) => ({ i, r: x - Math.floor(x) })).sort((a, b) => b.r - a.r || a.i - b.i)
  for (let k = 0; left > 0; k++, left--) parts[order[k % order.length].i] += 1
  return parts
}

export type TaxLineInput = { price: number; quantity: number; rate?: number }

export type TaxLine = {
  gross: number
  discount: number
  value: number
  rate: number
  taxable: number
  tax: number
  cgst: number
  sgst: number
  igst: number
}

export type OrderTax = {
  subtotal: number
  discount: number
  total: number
  intraState: boolean
  lines: TaxLine[]
  taxableValue: number
  tax: number
  cgst: number
  sgst: number
  igst: number
}

export function computeOrderTax(
  lines: TaxLineInput[],
  discount: number,
  sellerStateCode: string,
  buyerStateCode: string | null
): OrderTax {
  const gross = lines.map((l) => l.price * l.quantity)
  const subtotal = gross.reduce((a, b) => a + b, 0)
  const applied = Math.max(0, Math.min(Math.round(discount), subtotal))
  const shares = allocate(applied, gross)
  const intraState = buyerStateCode === sellerStateCode
  const out = lines.map((l, i) => {
    const rate = l.rate ?? GST_RATE
    const value = gross[i] - shares[i]
    const { taxable, tax } = taxInclusive(value, rate)
    const cgst = intraState ? Math.round(tax / 2) : 0
    const sgst = intraState ? tax - cgst : 0
    return { gross: gross[i], discount: shares[i], value, rate, taxable, tax, cgst, sgst, igst: intraState ? 0 : tax }
  })
  const sum = (k: keyof TaxLine) => out.reduce((a, l) => a + (l[k] as number), 0)
  return {
    subtotal,
    discount: applied,
    total: subtotal - applied,
    intraState,
    lines: out,
    taxableValue: sum("taxable"),
    tax: sum("tax"),
    cgst: sum("cgst"),
    sgst: sum("sgst"),
    igst: sum("igst"),
  }
}

export function includedGst(lines: TaxLineInput[], discount = 0): number {
  return computeOrderTax(lines, discount, "", null).tax
}

export function financialYear(date: Date): string {
  const ist = new Date(date.getTime() + 330 * 60 * 1000)
  const y = ist.getUTCFullYear()
  const start = ist.getUTCMonth() >= 3 ? y : y - 1
  return `${String(start % 100).padStart(2, "0")}-${String((start + 1) % 100).padStart(2, "0")}`
}
