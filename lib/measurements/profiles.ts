import type { MeasurementProfile } from "@prisma/client"
import { measurementProfileSchema } from "@/lib/validation/schemas"
import { isChildKind, validateMeasurements, type MeasurementValues, type PersonKind } from "./fields"

export { MAX_PROFILES } from "./limits"

export type ProfileDTO = {
  id: string
  name: string
  kind: PersonKind
  values: MeasurementValues
  notes: string | null
  guardianConsent: boolean
  updatedAt: string
}

export const toProfileDTO = (p: MeasurementProfile): ProfileDTO => ({
  id: p.id,
  name: p.name,
  kind: p.kind as PersonKind,
  values: (p.values ?? {}) as MeasurementValues,
  notes: p.notes,
  guardianConsent: p.guardianConsent,
  updatedAt: p.updatedAt.toISOString(),
})

type ParsedProfile = { name: string; kind: PersonKind; values: MeasurementValues; notes: string | null; guardianConsent: boolean }

export function parseProfileBody(body: unknown): { ok: true; data: ParsedProfile } | { ok: false; error: string; field?: string } {
  const parsed = measurementProfileSchema.safeParse(body)
  if (!parsed.success) {
    const first = parsed.error.issues[0]
    return { ok: false, error: first?.message ?? "Invalid measurements", field: first?.path[0] as string | undefined }
  }
  const { name, kind, values, notes, guardianConsent } = parsed.data
  const checked = validateMeasurements(kind, values)
  if (!checked.ok) return { ok: false, error: checked.error, field: checked.field }
  if (isChildKind(kind) && !guardianConsent) {
    return { ok: false, error: "Please confirm you are the child's parent or guardian", field: "guardianConsent" }
  }
  return { ok: true, data: { name, kind, values: checked.values, notes: notes || null, guardianConsent: isChildKind(kind) && !!guardianConsent } }
}
