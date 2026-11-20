export const IST_OFFSET_MS = 330 * 60 * 1000

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

export type Quarter = 1 | 2 | 3 | 4

export type RecordPeriod = {
  fyStart: number
  quarter: Quarter | null
  from: Date
  to: Date
  fp: string | null
  label: string
  slug: string
}

const istStart = (year: number, month: number) => new Date(Date.UTC(year, month, 1) - IST_OFFSET_MS)

export const fyLabel = (fyStart: number) => `${fyStart}-${String((fyStart + 1) % 100).padStart(2, "0")}`

export function currentFyStart(now: Date = new Date()): number {
  const ist = new Date(now.getTime() + IST_OFFSET_MS)
  return ist.getUTCMonth() >= 3 ? ist.getUTCFullYear() : ist.getUTCFullYear() - 1
}

export function currentQuarter(now: Date = new Date()): Quarter {
  const m = new Date(now.getTime() + IST_OFFSET_MS).getUTCMonth()
  return (m >= 3 ? Math.floor((m - 3) / 3) + 1 : 4) as Quarter
}

export function previousQuarter(now: Date = new Date()): { fyStart: number; quarter: Quarter } {
  const fy = currentFyStart(now), q = currentQuarter(now)
  return q === 1 ? { fyStart: fy - 1, quarter: 4 } : { fyStart: fy, quarter: (q - 1) as Quarter }
}

export const QUARTER_MONTHS: Record<Quarter, string> = {
  1: "April to June",
  2: "July to September",
  3: "October to December",
  4: "January to March",
}

export function recordPeriod(fyStart: number, quarter: Quarter | null): RecordPeriod {
  if (quarter === null) {
    return {
      fyStart,
      quarter,
      from: istStart(fyStart, 3),
      to: istStart(fyStart + 1, 3),
      fp: null,
      label: `FY ${fyLabel(fyStart)} (April ${fyStart} to March ${fyStart + 1})`,
      slug: `FY${fyLabel(fyStart)}`,
    }
  }
  const year = quarter === 4 ? fyStart + 1 : fyStart
  const first = quarter === 4 ? 0 : quarter * 3
  const last = first + 2
  return {
    fyStart,
    quarter,
    from: istStart(year, first),
    to: istStart(year, first + 3),
    fp: `${String(last + 1).padStart(2, "0")}${year}`,
    label: `FY ${fyLabel(fyStart)}, Q${quarter} (${MONTHS[first]} to ${MONTHS[last]} ${year})`,
    slug: `FY${fyLabel(fyStart)}-Q${quarter}`,
  }
}
