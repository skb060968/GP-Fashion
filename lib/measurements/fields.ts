import type { ProductCategory } from "@/lib/data/shop"

export const PERSON_KINDS = ["women", "men", "girls", "boys"] as const
export type PersonKind = (typeof PERSON_KINDS)[number]

export const KIND_LABEL: Record<PersonKind, string> = { women: "Woman", men: "Man", girls: "Girl", boys: "Boy" }

export const KINDS_FOR_CATEGORY: Record<ProductCategory, readonly PersonKind[]> = {
  womenswear: ["women"],
  menswear: ["men"],
  kidswear: ["girls", "boys"],
  accessories: [],
}

export const isChildKind = (k: PersonKind) => k === "girls" || k === "boys"

export const MTM_SIZE = "Custom"
export const MTM_LEAD_TIME = "4 to 6 weeks"

export type FieldGroup = "main" | "upper" | "arms" | "lower" | "lengths"

export const GROUP_TITLE: Record<FieldGroup, string> = {
  main: "Main measurements",
  upper: "Neck, shoulders and body",
  arms: "Arms",
  lower: "Hips and legs",
  lengths: "Lengths",
}

export type MeasurementField = {
  key: string
  label: string
  labels?: Partial<Record<PersonKind, string>>
  how: string
  group: FieldGroup
  kinds: readonly PersonKind[]
  required?: boolean
  adult: [number, number]
  child: [number, number]
}

const ALL = PERSON_KINDS
const WOMEN = ["women"] as const

export const MEASUREMENT_FIELDS: MeasurementField[] = [
  { key: "height", label: "Height", how: "Stand straight against a wall without shoes. Measure from the floor to the top of the head.", group: "main", kinds: ALL, required: true, adult: [48, 84], child: [28, 68] },
  { key: "chest", label: "Chest", labels: { women: "Bust" }, how: "Around the fullest part of the chest (bust) and straight across the back. Keep the tape level.", group: "main", kinds: ALL, required: true, adult: [26, 70], child: [18, 42] },
  { key: "waist", label: "Waist", how: "Around the natural waist, the narrowest part of the body, usually just above the navel. Snug, not tight.", group: "main", kinds: ALL, required: true, adult: [20, 70], child: [16, 38] },
  { key: "hip", label: "Hip", labels: { men: "Hip / seat", boys: "Hip / seat" }, how: "Around the widest part of the hips and seat, with the tape level with the floor.", group: "main", kinds: ALL, required: true, adult: [28, 72], child: [18, 44] },

  { key: "neck", label: "Neck", how: "Around the base of the neck, where a shirt collar sits.", group: "upper", kinds: ALL, adult: [11, 24], child: [8, 16] },
  { key: "shoulder", label: "Shoulder width", how: "Across the back, from one shoulder tip (the bone at the top of the arm) to the other.", group: "upper", kinds: ALL, adult: [11, 24], child: [7, 16] },
  { key: "acrossBack", label: "Across back", how: "Across the back from one armhole crease to the other, halfway down the armhole.", group: "upper", kinds: ALL, adult: [10, 24], child: [6, 16] },
  { key: "acrossFront", label: "Across front", how: "Across the chest from one armhole crease to the other, halfway down the armhole.", group: "upper", kinds: ALL, adult: [10, 24], child: [6, 16] },
  { key: "bustPointToPoint", label: "Bust point to point", how: "Straight across from one bust point to the other.", group: "upper", kinds: WOMEN, adult: [5, 12], child: [4, 10] },
  { key: "shoulderToBustPoint", label: "Shoulder to bust point", how: "From the shoulder tip down to the bust point.", group: "upper", kinds: WOMEN, adult: [7, 15], child: [5, 12] },
  { key: "frontWaistLength", label: "Front waist length", how: "From the hollow at the base of the front neck straight down to the waist.", group: "upper", kinds: ALL, adult: [10, 22], child: [6, 16] },
  { key: "backWaistLength", label: "Back waist length", how: "From the bone at the back of the neck straight down the spine to the waist. Ask someone to help.", group: "upper", kinds: ALL, adult: [12, 24], child: [7, 18] },
  { key: "shoulderToWaistFront", label: "Shoulder to waist, front", how: "From the shoulder where it meets the neck, over the chest, straight down to the waist.", group: "upper", kinds: ALL, adult: [12, 26], child: [8, 18] },
  { key: "shoulderToWaistBack", label: "Shoulder to waist, back", how: "From the shoulder where it meets the neck, straight down the back to the waist.", group: "upper", kinds: ALL, adult: [12, 26], child: [8, 18] },

  { key: "sleeveLength", label: "Sleeve length", how: "With the arm slightly bent, from the shoulder tip over the elbow to the wrist bone.", group: "arms", kinds: ALL, adult: [16, 30], child: [9, 24] },
  { key: "upperArm", label: "Upper arm", how: "Around the fullest part of the upper arm, with the arm relaxed.", group: "arms", kinds: ALL, adult: [8, 22], child: [5, 14] },
  { key: "wrist", label: "Wrist", how: "Around the wrist bone.", group: "arms", kinds: ALL, adult: [5, 10], child: [4, 8] },
  { key: "hand", label: "Hand", how: "Around the hand at the knuckles with the thumb tucked in. Used for fitted cuffs.", group: "arms", kinds: ALL, adult: [6, 12], child: [5, 10] },

  { key: "abdomen", label: "Abdomen", how: "Around the tummy, 3 inches (7.5 cm) below the waist.", group: "lower", kinds: WOMEN, adult: [22, 70], child: [16, 40] },
  { key: "upperThigh", label: "Upper thigh", how: "Around the fullest part of the thigh, just below the crotch.", group: "lower", kinds: ALL, adult: [14, 40], child: [9, 26] },
  { key: "knee", label: "Knee", how: "Around the middle of the knee.", group: "lower", kinds: ALL, adult: [10, 24], child: [7, 17] },
  { key: "calf", label: "Calf", how: "Around the fullest part of the calf.", group: "lower", kinds: ALL, adult: [9, 22], child: [6, 17] },
  { key: "ankle", label: "Ankle", how: "Around the ankle bone.", group: "lower", kinds: ALL, adult: [7, 14], child: [5, 11] },
  { key: "seatedRise", label: "Seated rise", how: "Sit straight on a hard chair. From the side waist straight down to the chair seat.", group: "lower", kinds: ALL, adult: [7, 15], child: [5, 12] },
  { key: "crotchLength", label: "Crotch length", how: "From the centre front waist, between the legs, up to the centre back waist.", group: "lower", kinds: ALL, adult: [18, 40], child: [12, 30] },

  { key: "waistToHip", label: "Waist to hip", how: "At the side, from the waist down to the widest part of the hips.", group: "lengths", kinds: ALL, adult: [5, 13], child: [3, 9] },
  { key: "waistToKnee", label: "Waist to knee", how: "At the side, from the waist down to the middle of the knee.", group: "lengths", kinds: ALL, adult: [17, 30], child: [9, 24] },
  { key: "waistToAnkle", label: "Waist to ankle", how: "At the side, from the waist down to the ankle bone.", group: "lengths", kinds: ALL, adult: [30, 48], child: [16, 40] },
  { key: "waistToFloor", label: "Waist to floor", how: "At the side, from the waist down to the floor, without shoes.", group: "lengths", kinds: ALL, adult: [32, 50], child: [18, 44] },
]

export const FIELD_BY_KEY = new Map(MEASUREMENT_FIELDS.map((f) => [f.key, f]))

export const fieldsFor = (kind: PersonKind) => MEASUREMENT_FIELDS.filter((f) => f.kinds.includes(kind))

export const fieldLabel = (f: MeasurementField, kind: PersonKind) => f.labels?.[kind] ?? f.label

export const rangeFor = (f: MeasurementField, kind: PersonKind) => (isChildKind(kind) ? f.child : f.adult)

export type MeasurementValues = Record<string, number>

export const roundEighth = (v: number) => Math.round(v * 8) / 8

const UNICODE_FRACTIONS: Record<string, string> = { "½": " 1/2", "¼": " 1/4", "¾": " 3/4", "⅛": " 1/8", "⅜": " 3/8", "⅝": " 5/8", "⅞": " 7/8" }

export function parseMeasurement(text: string, unit: "in" | "cm"): number | null {
  let s = text.trim().toLowerCase()
  if (!s) return null
  for (const [u, r] of Object.entries(UNICODE_FRACTIONS)) s = s.split(u).join(r)
  s = s.replace(/(″|"|”|inches|inch|in|cm)$/u, "").trim().replace(/,/g, ".")
  let v: number
  const mixed = s.match(/^(\d+)(?:\s+|-)(\d+)\/(\d+)$/)
  const frac = s.match(/^(\d+)\/(\d+)$/)
  if (mixed) v = Number(mixed[1]) + Number(mixed[2]) / Number(mixed[3])
  else if (frac) v = Number(frac[1]) / Number(frac[2])
  else if (/^\d+(\.\d+)?$/.test(s)) v = Number(s)
  else return null
  if (!Number.isFinite(v) || v <= 0) return null
  return roundEighth(unit === "cm" ? v / 2.54 : v)
}

const FRACTION_TEXT: Record<number, string> = { 1: "1/8", 2: "1/4", 3: "3/8", 4: "1/2", 5: "5/8", 6: "3/4", 7: "7/8" }

export function formatInches(v: number, mark = "″") {
  const eighths = Math.round(v * 8)
  const whole = Math.floor(eighths / 8)
  const rest = eighths % 8
  const text = rest ? (whole ? `${whole} ${FRACTION_TEXT[rest]}` : FRACTION_TEXT[rest]) : String(whole)
  return `${text}${mark}`
}

export const formatCm = (v: number) => `${(Math.round(v * 2.54 * 10) / 10).toString()} cm`

export const formatValue = (v: number, unit: "in" | "cm") => (unit === "cm" ? formatCm(v) : formatInches(v))

export type ValidationResult = { ok: true; values: MeasurementValues } | { ok: false; field: string; error: string }

export function validateMeasurements(kind: PersonKind, input: Record<string, unknown>): ValidationResult {
  const values: MeasurementValues = {}
  const allowed = fieldsFor(kind)
  for (const key of Object.keys(input)) {
    if (!allowed.some((f) => f.key === key)) return { ok: false, field: key, error: "This measurement does not apply" }
  }
  for (const f of allowed) {
    const raw = input[f.key]
    if (raw === undefined || raw === null || raw === "") {
      if (f.required) return { ok: false, field: f.key, error: `${fieldLabel(f, kind)} is required` }
      continue
    }
    const v = typeof raw === "number" ? raw : NaN
    const [min, max] = rangeFor(f, kind)
    if (!Number.isFinite(v)) return { ok: false, field: f.key, error: `${fieldLabel(f, kind)} must be a number` }
    if (v < min || v > max) {
      return { ok: false, field: f.key, error: `${fieldLabel(f, kind)} should be between ${formatInches(min)} and ${formatInches(max)} (${formatCm(min)}–${formatCm(max)})` }
    }
    values[f.key] = roundEighth(v)
  }
  return { ok: true, values }
}

export type MeasurementSnapshot = {
  profileId: string
  name: string
  kind: PersonKind
  values: MeasurementValues
  notes: string | null
  savedAt: string
}

export function isSnapshot(v: unknown): v is MeasurementSnapshot {
  if (!v || typeof v !== "object") return false
  const s = v as Record<string, unknown>
  return typeof s.name === "string" && typeof s.kind === "string" && PERSON_KINDS.includes(s.kind as PersonKind) && !!s.values && typeof s.values === "object"
}

export function snapshotLines(s: MeasurementSnapshot): { label: string; value: string }[] {
  return fieldsFor(s.kind)
    .filter((f) => typeof s.values[f.key] === "number")
    .map((f) => ({ label: fieldLabel(f, s.kind), value: `${formatInches(s.values[f.key])} (${formatCm(s.values[f.key])})` }))
}

export const mtmLabel = (name: string) => `Made to measure · ${name}`

export function itemSizeLabel(item: { size: string; measurements?: unknown; profileName?: string | null }) {
  if (isSnapshot(item.measurements)) return mtmLabel(item.measurements.name)
  if (item.profileName) return mtmLabel(item.profileName)
  return `Size ${item.size}`
}
