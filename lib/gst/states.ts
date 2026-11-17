export type IndianState = { code: string; name: string }

export const INDIAN_STATES: IndianState[] = [
  { code: "35", name: "Andaman and Nicobar Islands" },
  { code: "37", name: "Andhra Pradesh" },
  { code: "12", name: "Arunachal Pradesh" },
  { code: "18", name: "Assam" },
  { code: "10", name: "Bihar" },
  { code: "04", name: "Chandigarh" },
  { code: "22", name: "Chhattisgarh" },
  { code: "26", name: "Dadra and Nagar Haveli and Daman and Diu" },
  { code: "07", name: "Delhi" },
  { code: "30", name: "Goa" },
  { code: "24", name: "Gujarat" },
  { code: "06", name: "Haryana" },
  { code: "02", name: "Himachal Pradesh" },
  { code: "01", name: "Jammu and Kashmir" },
  { code: "20", name: "Jharkhand" },
  { code: "29", name: "Karnataka" },
  { code: "32", name: "Kerala" },
  { code: "38", name: "Ladakh" },
  { code: "31", name: "Lakshadweep" },
  { code: "23", name: "Madhya Pradesh" },
  { code: "27", name: "Maharashtra" },
  { code: "14", name: "Manipur" },
  { code: "17", name: "Meghalaya" },
  { code: "15", name: "Mizoram" },
  { code: "13", name: "Nagaland" },
  { code: "21", name: "Odisha" },
  { code: "34", name: "Puducherry" },
  { code: "03", name: "Punjab" },
  { code: "08", name: "Rajasthan" },
  { code: "11", name: "Sikkim" },
  { code: "33", name: "Tamil Nadu" },
  { code: "36", name: "Telangana" },
  { code: "16", name: "Tripura" },
  { code: "09", name: "Uttar Pradesh" },
  { code: "05", name: "Uttarakhand" },
  { code: "19", name: "West Bengal" },
]

const key = (s: string) => s.toLowerCase().replace(/&/g, "and").replace(/[^a-z]/g, "")

const ALIASES: Record<string, string> = {
  newdelhi: "07",
  nctofdelhi: "07",
  nationalcapitalterritoryofdelhi: "07",
  delhinct: "07",
  orissa: "21",
  pondicherry: "34",
  jk: "01",
  jandk: "01",
  jammukashmir: "01",
  andaman: "35",
  andamannicobar: "35",
  dadranagarhaveli: "26",
  damananddiu: "26",
  damandiu: "26",
  dadraandnagarhaveli: "26",
  uttaranchal: "05",
  up: "09",
  mp: "23",
  tn: "33",
  wb: "19",
}

const BY_KEY = new Map(INDIAN_STATES.map((s) => [key(s.name), s]))
const BY_CODE = new Map(INDIAN_STATES.map((s) => [s.code, s]))

export function findState(input: string | null | undefined): IndianState | null {
  if (!input) return null
  const k = key(input)
  if (!k) return null
  return BY_KEY.get(k) ?? BY_CODE.get(ALIASES[k] ?? "") ?? null
}

export function stateByCode(code: string | null | undefined): IndianState | null {
  return code ? BY_CODE.get(code) ?? null : null
}

export function placeOfSupplyLabel(code: string | null | undefined): string {
  const s = stateByCode(code)
  return s ? `${s.name} (${s.code})` : code ?? ""
}
