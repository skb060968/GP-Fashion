export type Heads = { igst: number; cgst: number; sgst: number }

export const zeroHeads = (): Heads => ({ igst: 0, cgst: 0, sgst: 0 })
export const addHeads = (a: Heads, b: Heads): Heads => ({ igst: a.igst + b.igst, cgst: a.cgst + b.cgst, sgst: a.sgst + b.sgst })
export const subHeads = (a: Heads, b: Heads): Heads => ({ igst: a.igst - b.igst, cgst: a.cgst - b.cgst, sgst: a.sgst - b.sgst })
export const clampHeads = (a: Heads): Heads => ({ igst: Math.max(0, a.igst), cgst: Math.max(0, a.cgst), sgst: Math.max(0, a.sgst) })
export const totalHeads = (a: Heads) => a.igst + a.cgst + a.sgst
export const roundRupees = (a: Heads): Heads => ({ igst: Math.round(a.igst / 100) * 100, cgst: Math.round(a.cgst / 100) * 100, sgst: Math.round(a.sgst / 100) * 100 })

export type SetOff = { liability: Heads; credit: Heads; creditUsed: Heads; creditLeft: Heads; cash: Heads }

export function setOff(liability: Heads, credit: Heads): SetOff {
  const L = clampHeads(liability)
  const C = clampHeads(credit)
  const start = { ...C }
  const use = (from: keyof Heads, to: keyof Heads, cap = Infinity) => {
    const n = Math.min(C[from], L[to], cap)
    C[from] -= n
    L[to] -= n
  }
  use("igst", "igst")
  use("igst", "cgst", Math.max(0, L.cgst - C.cgst))
  use("igst", "sgst", Math.max(0, L.sgst - C.sgst))
  use("igst", "cgst")
  use("igst", "sgst")
  use("cgst", "cgst")
  use("cgst", "igst")
  use("sgst", "sgst")
  use("sgst", "igst")
  return { liability: clampHeads(liability), credit: start, creditUsed: subHeads(start, C), creditLeft: C, cash: L }
}
