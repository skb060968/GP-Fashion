"use client"

import { useMemo, useState } from "react"
import { Check } from "lucide-react"
import Field from "@/components/checkout/Field"
import type { ProfileDTO } from "@/lib/measurements/profiles"
import {
  FIELD_BY_KEY,
  GROUP_TITLE,
  KIND_LABEL,
  PERSON_KINDS,
  fieldLabel,
  fieldsFor,
  formatInches,
  isChildKind,
  parseMeasurement,
  type FieldGroup,
  type PersonKind,
} from "@/lib/measurements/fields"

type Unit = "in" | "cm"

const OPTIONAL_GROUPS: FieldGroup[] = ["upper", "arms", "lower", "lengths"]

const toText = (v: number, unit: Unit) => (unit === "cm" ? String(Math.round(v * 2.54 * 10) / 10) : formatInches(v, ""))

export default function MeasurementForm({
  initial,
  allowedKinds,
  onCancel,
  onSaved,
}: {
  initial?: ProfileDTO
  allowedKinds?: readonly PersonKind[]
  onCancel: () => void
  onSaved: (p: ProfileDTO) => void
}) {
  const kinds = allowedKinds?.length ? allowedKinds : PERSON_KINDS
  const [name, setName] = useState(initial?.name ?? "")
  const [kind, setKind] = useState<PersonKind | null>(initial?.kind ?? (kinds.length === 1 ? kinds[0] : null))
  const [unit, setUnit] = useState<Unit>("in")
  const [text, setText] = useState<Record<string, string>>(() =>
    Object.fromEntries(Object.entries(initial?.values ?? {}).map(([k, v]) => [k, toText(v, "in")]))
  )
  const [notes, setNotes] = useState(initial?.notes ?? "")
  const [guardian, setGuardian] = useState(initial?.guardianConsent ?? false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [general, setGeneral] = useState("")
  const [saving, setSaving] = useState(false)
  const [openGroups, setOpenGroups] = useState<Set<FieldGroup>>(() => {
    const keys = Object.keys(initial?.values ?? {})
    return new Set(OPTIONAL_GROUPS.filter((g) => keys.some((k) => FIELD_BY_KEY.get(k)?.group === g)))
  })

  const fields = useMemo(() => (kind ? fieldsFor(kind) : []), [kind])

  const showErrors = (errs: Record<string, string>) => {
    setErrors(errs)
    const groups = Object.keys(errs).filter((k) => errs[k]).map((k) => FIELD_BY_KEY.get(k)?.group)
    setOpenGroups((s) => new Set([...s, ...groups.filter((g): g is FieldGroup => !!g && g !== "main")]))
  }

  const switchUnit = (next: Unit) => {
    if (next === unit) return
    setText((t) => {
      const out: Record<string, string> = {}
      for (const [k, s] of Object.entries(t)) {
        const v = parseMeasurement(s, unit)
        out[k] = v === null ? s : toText(v, next)
      }
      return out
    })
    setUnit(next)
  }

  const setValue = (key: string, value: string) => {
    setText((t) => ({ ...t, [key]: value }))
    setErrors((e) => ({ ...e, [key]: "" }))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setGeneral("")
    if (!kind) {
      setErrors({ kind: "Choose who the measurements are for" })
      return
    }
    const values: Record<string, number> = {}
    const errs: Record<string, string> = {}
    for (const f of fields) {
      const s = (text[f.key] ?? "").trim()
      if (!s) {
        if (f.required) errs[f.key] = `${fieldLabel(f, kind)} is required`
        continue
      }
      const v = parseMeasurement(s, unit)
      if (v === null) errs[f.key] = unit === "cm" ? "Enter a number, e.g. 92.5" : "Enter a number, e.g. 36.5 or 36 1/2"
      else values[f.key] = v
    }
    if (!name.trim()) errs.name = "Give this profile a name"
    if (isChildKind(kind) && !guardian) errs.guardianConsent = "Please confirm you are the child's parent or guardian"
    if (Object.values(errs).some(Boolean)) {
      showErrors(errs)
      return
    }

    setSaving(true)
    try {
      const res = await fetch(initial ? `/api/account/measurements/${initial.id}` : "/api/account/measurements", {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), kind, values, notes: notes.trim(), guardianConsent: isChildKind(kind) ? guardian : false }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (d.field) showErrors({ [d.field]: d.error })
        else setGeneral(d.error || "Could not save the measurements")
        return
      }
      onSaved(d.profile)
    } catch {
      setGeneral("Could not save the measurements. Check your connection.")
    } finally {
      setSaving(false)
    }
  }

  const input = (key: string) => {
    const f = fields.find((x) => x.key === key)!
    return (
      <Field
        key={key}
        label={fieldLabel(f, kind!)}
        name={key}
        inputMode="decimal"
        autoComplete="off"
        value={text[key] ?? ""}
        onChange={(e) => setValue(key, e.target.value)}
        error={errors[key]}
        hint={f.how}
        optional={!f.required}
        endAdornment={<span className="pr-2 font-jost text-xs text-black/45">{unit}</span>}
      />
    )
  }

  return (
    <form onSubmit={submit} noValidate className="card-elevated space-y-6 p-6 sm:p-8">
      <h3 className="font-cinzel text-base font-bold uppercase tracking-[0.15em]">{initial ? "Edit measurements" : "New measurements"}</h3>

      <Field
        label="Profile name"
        name="name"
        placeholder="Me, Mom, Aarav…"
        maxLength={40}
        value={name}
        onChange={(e) => {
          setName(e.target.value)
          setErrors((er) => ({ ...er, name: "" }))
        }}
        error={errors.name}
      />

      <div>
        <p className="font-jost text-xs font-semibold uppercase tracking-[0.15em] text-black/70">Measurements for</p>
        <div role="radiogroup" aria-label="Measurements for" className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4">
          {kinds.map((k) => {
            const on = k === kind
            return (
              <button
                key={k}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => {
                  setKind(k)
                  setErrors((er) => ({ ...er, kind: "" }))
                }}
                className={`rounded-lg border px-4 py-3 font-jost text-sm font-semibold transition-colors ${on ? "border-black bg-black/[0.03]" : "border-black/15 hover:border-black"}`}
              >
                {KIND_LABEL[k]}
              </button>
            )
          })}
        </div>
        {errors.kind && <p role="alert" className="mt-1.5 font-jost text-xs text-red-600">{errors.kind}</p>}
      </div>

      {kind && (
        <>
          <div className="rounded-lg bg-stone-50 p-4 font-jost text-sm leading-relaxed text-black/70">
            <p className="font-semibold text-black">How to measure</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              <li>Measure the body, not a garment. We add the right ease for each style.</li>
              <li>Wear light, close-fitting clothes and use a soft tape. Keep it snug but not tight, and level all the way round.</li>
              <li>Stand relaxed and breathe normally. Ask someone to help with back and length measurements.</li>
            </ul>
          </div>

          <div className="flex items-center justify-between gap-4">
            <p className="font-jost text-xs font-semibold uppercase tracking-[0.15em] text-black/70">Units</p>
            <div role="radiogroup" aria-label="Units" className="inline-flex rounded-full border border-black/15 p-0.5 font-jost text-xs font-semibold">
              {(["in", "cm"] as const).map((u) => (
                <button
                  key={u}
                  type="button"
                  role="radio"
                  aria-checked={unit === u}
                  onClick={() => switchUnit(u)}
                  className={`rounded-full px-4 py-1.5 transition-colors ${unit === u ? "bg-black text-white" : "text-black/60 hover:text-black"}`}
                >
                  {u === "in" ? "Inches" : "Centimetres"}
                </button>
              ))}
            </div>
          </div>

          <fieldset className="space-y-5">
            <legend className="font-cinzel text-sm font-bold uppercase tracking-[0.15em]">{GROUP_TITLE.main}</legend>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {fields.filter((f) => f.group === "main").map((f) => input(f.key))}
            </div>
          </fieldset>

          <div className="space-y-3">
            <p className="font-jost text-sm text-black/60">
              The measurements below are optional. Each one you add brings the fit closer to you; anything left out is taken from the standard size nearest your main measurements.
            </p>
            {OPTIONAL_GROUPS.map((g) => {
              const groupFields = fields.filter((f) => f.group === g)
              if (!groupFields.length) return null
              const filled = groupFields.filter((f) => (text[f.key] ?? "").trim()).length
              return (
                <details
                  key={g}
                  open={openGroups.has(g)}
                  onToggle={(e) => {
                    const isOpen = e.currentTarget.open
                    setOpenGroups((s) => {
                      if (s.has(g) === isOpen) return s
                      const n = new Set(s)
                      if (isOpen) n.add(g)
                      else n.delete(g)
                      return n
                    })
                  }}
                  className="group rounded-lg border border-black/10"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between px-4 py-3 font-jost text-sm font-semibold">
                    <span>{GROUP_TITLE[g]}</span>
                    <span className="text-xs font-normal text-black/50">
                      {filled ? `${filled} of ${groupFields.length} added` : `${groupFields.length} optional`}
                      <span aria-hidden className="ml-2 inline-block transition-transform group-open:rotate-180">⌄</span>
                    </span>
                  </summary>
                  <div className="grid grid-cols-1 gap-5 border-t border-black/10 p-4 sm:grid-cols-2">
                    {groupFields.map((f) => input(f.key))}
                  </div>
                </details>
              )
            })}
          </div>

          <Field
            as="textarea"
            label="Fit notes"
            name="notes"
            rows={3}
            maxLength={500}
            placeholder="e.g. prefer loose sleeves, one shoulder lower, usually wear size M"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            error={errors.notes}
            optional
          />

          {isChildKind(kind) && (
            <label className="flex cursor-pointer items-start gap-3">
              <span className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                <input
                  type="checkbox"
                  checked={guardian}
                  onChange={(e) => {
                    setGuardian(e.target.checked)
                    setErrors((er) => ({ ...er, guardianConsent: "" }))
                  }}
                  className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-black/30 transition-colors checked:border-black checked:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                />
                <Check className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100" strokeWidth={3} aria-hidden />
              </span>
              <span className="font-jost text-sm leading-relaxed text-black/80">
                I am this child&apos;s parent or guardian and agree to these measurements being stored to make their clothes.
                {errors.guardianConsent && <span role="alert" className="mt-1 block text-xs text-red-600">{errors.guardianConsent}</span>}
              </span>
            </label>
          )}
        </>
      )}

      {general && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 font-jost text-sm text-red-800">{general}</p>}

      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} disabled={saving} className="btn-outline-dark">
          Cancel
        </button>
        <button type="submit" disabled={saving || !kind} className="btn-solid-dark disabled:opacity-40">
          {saving ? "Saving…" : "Save measurements"}
        </button>
      </div>
    </form>
  )
}
