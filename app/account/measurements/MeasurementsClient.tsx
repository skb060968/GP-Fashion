"use client"

import { useEffect, useState } from "react"
import { Plus, Ruler } from "lucide-react"
import EmptyState from "@/components/EmptyState"
import MeasurementForm from "@/components/account/MeasurementForm"
import type { ProfileDTO } from "@/lib/measurements/profiles"
import { KIND_LABEL, MTM_LEAD_TIME, fieldLabel, fieldsFor, formatInches } from "@/lib/measurements/fields"
import { MAX_PROFILES } from "@/lib/measurements/limits"
import { useCart } from "@/context/CartContext"

function summary(p: ProfileDTO) {
  const fields = fieldsFor(p.kind)
  const main = fields.filter((f) => f.required && typeof p.values[f.key] === "number")
  const extra = fields.filter((f) => !f.required && typeof p.values[f.key] === "number").length
  return { main: main.map((f) => `${fieldLabel(f, p.kind)} ${formatInches(p.values[f.key])}`), extra }
}

export default function MeasurementsClient() {
  const { removeProfile } = useCart()
  const [profiles, setProfiles] = useState<ProfileDTO[] | null>(null)
  const [error, setError] = useState("")
  const [editing, setEditing] = useState<ProfileDTO | "new" | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = () =>
    fetch("/api/account/measurements", { credentials: "same-origin" })
      .then(async (r) => {
        if (r.status === 401) {
          window.location.href = "/login?next=/account/measurements"
          return
        }
        const d = await r.json()
        if (!r.ok) throw new Error(d.error || "Could not load measurements")
        setProfiles(d.profiles)
      })
      .catch((e) => setError(e.message))

  useEffect(() => {
    load()
  }, [])

  const remove = async (p: ProfileDTO) => {
    if (!confirm(`Delete the measurements for ${p.name}? Any bag items using them will be removed. Orders already placed keep their own copy.`)) return
    setBusyId(p.id)
    try {
      const r = await fetch(`/api/account/measurements/${p.id}`, { method: "DELETE" })
      if (!r.ok) throw new Error("Could not delete the measurements")
      removeProfile(p.id)
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not delete the measurements")
    } finally {
      setBusyId(null)
    }
  }

  if (error) return <p className="rounded-lg border border-red-200 bg-red-50 p-4 font-jost text-sm text-red-800">{error}</p>
  if (!profiles) return <div className="h-40 animate-pulse rounded-xl bg-stone-100" />

  const intro = (
    <p className="mb-6 font-jost text-sm leading-relaxed text-black/65">
      Save measurements for yourself or your family, then choose <strong className="text-black">Made to measure</strong> on any dress. The price stays the same.
      We confirm the measurements with you before cutting, and made-to-measure pieces are ready in {MTM_LEAD_TIME}.
    </p>
  )

  return (
    <>
      {intro}
      {profiles.length === 0 && editing === null ? (
        <div className="card-elevated">
          <EmptyState
            icon={Ruler}
            title="No saved measurements"
            description="Add measurements once and use them for any made-to-measure order."
            ctaLabel="Add measurements"
            ctaHref="#"
          />
          <div className="-mt-20 flex justify-center pb-10">
            <button type="button" onClick={() => setEditing("new")} className="btn-outline-dark">
              Add measurements
            </button>
          </div>
        </div>
      ) : (
        editing === null && (
          <div className="space-y-4">
            <ul className="grid gap-4 sm:grid-cols-2">
              {profiles.map((p) => {
                const s = summary(p)
                return (
                  <li key={p.id} className="card-elevated flex flex-col p-5 font-jost text-sm">
                    <div className="flex items-start justify-between gap-3">
                      <p className="font-semibold">{p.name}</p>
                      <span className="rounded-full border border-black px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em]">{KIND_LABEL[p.kind]}</span>
                    </div>
                    <p className="mt-2 flex-1 leading-relaxed text-black/70">
                      {s.main.join(" · ")}
                      {s.extra > 0 && <span className="block text-black/50">+ {s.extra} more {s.extra === 1 ? "measurement" : "measurements"}</span>}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                      <button type="button" onClick={() => setEditing(p)} className="underline underline-offset-4 hover:text-black">Edit</button>
                      <button type="button" onClick={() => remove(p)} disabled={busyId === p.id} className="text-red-700 underline underline-offset-4 disabled:opacity-40">
                        Delete
                      </button>
                    </div>
                  </li>
                )
              })}
            </ul>
            {profiles.length < MAX_PROFILES && (
              <button type="button" onClick={() => setEditing("new")} className="btn-outline-dark">
                <Plus className="mr-2 h-4 w-4" strokeWidth={1.75} aria-hidden /> Add measurements
              </button>
            )}
          </div>
        )
      )}

      {editing !== null && (
        <MeasurementForm
          initial={editing === "new" ? undefined : editing}
          onCancel={() => setEditing(null)}
          onSaved={() => {
            setEditing(null)
            load()
          }}
        />
      )}
    </>
  )
}
