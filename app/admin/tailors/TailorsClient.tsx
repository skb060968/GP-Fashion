"use client"

import { useCallback, useEffect, useState } from "react"
import Link from "next/link"
import { Pencil, Plus } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/AdminShell"
import { Alert, Card, Dialog, EmptyRow, Skeleton, btn, input } from "@/components/admin/ui"
import { adminFetch } from "@/lib/admin/fetch"
import { INDIAN_STATES, placeOfSupplyLabel } from "@/lib/gst/states"
import { business } from "@/lib/data/business"
import { challanPiecesText, dueSoon, parsePieces, returnDeadline } from "@/lib/jobwork/challan"

type Tailor = {
  id: string
  name: string
  phone: string | null
  addressLine1: string
  addressLine2: string | null
  city: string
  stateCode: string
  pincode: string
  gstin: string | null
  active: boolean
  _count: { challans: number }
}

type OpenChallan = {
  number: string
  date: string
  tailorName: string
  tailorId: string
  pieces: unknown
  receivedAt: null
  cancelledAt: null
  order: { orderCode: string; status: string }
}

type Form = { name: string; phone: string; addressLine1: string; addressLine2: string; city: string; stateCode: string; pincode: string; gstin: string; active: boolean }

const emptyForm = (): Form => ({ name: "", phone: "", addressLine1: "", addressLine2: "", city: "", stateCode: business.stateCode, pincode: "", gstin: "", active: true })

const day = (iso: string | Date) => new Date(iso).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short", year: "numeric" })

const label = "block font-jost text-xs font-semibold uppercase tracking-[0.12em] text-black/60"

export default function TailorsClient() {
  const [data, setData] = useState<{ tailors: Tailor[]; open: OpenChallan[] } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [editing, setEditing] = useState<{ id: string | null; form: Form } | null>(null)

  const load = useCallback(async () => {
    try {
      setData(await adminFetch<{ tailors: Tailor[]; open: OpenChallan[] }>("/api/admin/tailors"))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load the tailors")
    }
  }, [])

  useEffect(() => {
    load()
  }, [load])

  const edit = (t: Tailor) =>
    setEditing({
      id: t.id,
      form: {
        name: t.name,
        phone: t.phone ?? "",
        addressLine1: t.addressLine1,
        addressLine2: t.addressLine2 ?? "",
        city: t.city,
        stateCode: t.stateCode,
        pincode: t.pincode,
        gstin: t.gstin ?? "",
        active: t.active,
      },
    })

  return (
    <div className="space-y-6">
      <AdminPageHeader
        title="Tailors"
        description="Tailors who stitch the pieces, and the fabric that is with them on job work challans."
        actions={
          <button type="button" onClick={() => setEditing({ id: null, form: emptyForm() })} className={btn.primary}>
            <Plus className="h-4 w-4" strokeWidth={2} aria-hidden /> Add tailor
          </button>
        }
      />

      {error && <Alert onDismiss={() => setError(null)}>{error}</Alert>}
      {flash && (
        <Alert tone="success" onDismiss={() => setFlash(null)}>
          {flash}
        </Alert>
      )}

      <Card title="Tailors" padded={false}>
        {!data ? (
          <div className="space-y-3 p-5">
            <Skeleton className="h-6" />
            <Skeleton className="h-6" />
          </div>
        ) : data.tailors.length === 0 ? (
          <EmptyRow title="No tailors yet" hint="Add each tailor you send fabric to. Their name and address go on the job work challan." />
        ) : (
          <ul className="divide-y divide-black/5">
            {data.tailors.map((t) => (
              <li key={t.id} className="flex flex-wrap items-start justify-between gap-4 px-5 py-4 font-jost text-sm">
                <div className={t.active ? "" : "opacity-50"}>
                  <p className="font-semibold">
                    {t.name}
                    {!t.active && <span className="ml-2 text-xs font-normal">Inactive</span>}
                  </p>
                  <p className="text-black/65">
                    {[t.addressLine1, t.addressLine2, `${t.city} ${t.pincode}`].filter(Boolean).join(", ")} · {placeOfSupplyLabel(t.stateCode)}
                  </p>
                  <p className="text-xs text-black/55">
                    {t.gstin ? `GSTIN ${t.gstin}` : "Unregistered"}
                    {t.phone ? ` · ${t.phone}` : ""} · {t._count.challans} {t._count.challans === 1 ? "challan" : "challans"}
                  </p>
                </div>
                <button type="button" onClick={() => edit(t)} className={`${btn.secondary} !px-3 !py-1.5 !text-xs`}>
                  <Pencil className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden /> Edit
                </button>
              </li>
            ))}
          </ul>
        )}
      </Card>

      <Card title="With the tailors now" padded={false}>
        {!data ? (
          <div className="p-5">
            <Skeleton className="h-6" />
          </div>
        ) : data.open.length === 0 ? (
          <p className="px-5 py-4 font-jost text-sm text-black/60">No fabric is out with a tailor.</p>
        ) : (
          <ul className="divide-y divide-black/5">
            {data.open.map((c) => (
              <li key={c.number} className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1 px-5 py-3 font-jost text-sm">
                <div>
                  <Link href={`/admin/orders/${c.order.orderCode}`} className="font-semibold underline underline-offset-4 hover:text-black/70">
                    {c.number}
                  </Link>
                  <span className="text-black/65">
                    {" "}
                    · order {c.order.orderCode} · {c.tailorName}
                  </span>
                  <p className="text-xs text-black/55">{challanPiecesText(parsePieces(c.pieces))}</p>
                </div>
                <span className={`text-xs ${dueSoon(c) ? "font-semibold text-red-700" : "text-black/55"}`}>
                  Sent {day(c.date)} · due back by {day(returnDeadline(c.date))}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>

      {editing && (
        <TailorDialog
          id={editing.id}
          initial={editing.form}
          onClose={() => setEditing(null)}
          onSaved={(name) => {
            setEditing(null)
            setFlash(`${name} saved.`)
            load()
          }}
        />
      )}
    </div>
  )
}

function TailorDialog({ id, initial, onClose, onSaved }: { id: string | null; initial: Form; onClose: () => void; onSaved: (name: string) => void }) {
  const [form, setForm] = useState<Form>(initial)
  const [error, setError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const set = (k: keyof Form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }))

  const submit = async () => {
    setError(null)
    setSaving(true)
    try {
      const saved = await adminFetch<{ name: string }>(id ? `/api/admin/tailors/${id}` : "/api/admin/tailors", {
        method: id ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      onSaved(saved.name)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the tailor")
    } finally {
      setSaving(false)
    }
  }

  const field = (k: keyof Form, text: string, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <div>
      <label htmlFor={`tailor-${k}`} className={label}>{text}</label>
      <input id={`tailor-${k}`} value={String(form[k])} onChange={(e) => set(k, e.target.value)} className={`${input} mt-2 w-full`} {...props} />
    </div>
  )

  return (
    <Dialog
      open
      onClose={onClose}
      title={id ? "Edit tailor" : "Add tailor"}
      description="Use the workshop address the fabric is sent to. Changes apply to new challans; challans already issued keep the details they were issued with."
      footer={
        <>
          <button type="button" onClick={onClose} className={btn.secondary} disabled={saving}>
            Cancel
          </button>
          <button type="button" onClick={submit} className={btn.primary} disabled={saving}>
            {saving ? "Saving…" : "Save tailor"}
          </button>
        </>
      }
    >
      <div className="space-y-4 font-jost text-sm">
        {error && <Alert onDismiss={() => setError(null)}>{error}</Alert>}
        {field("name", "Name", { placeholder: "Tailor or workshop name" })}
        {field("phone", "Mobile (optional)", { inputMode: "tel" })}
        {field("addressLine1", "Address")}
        {field("addressLine2", "Address line 2 (optional)")}
        <div className="grid gap-4 sm:grid-cols-2">
          {field("city", "City")}
          {field("pincode", "Pincode", { inputMode: "numeric", maxLength: 6 })}
        </div>
        <div>
          <label htmlFor="tailor-state" className={label}>State</label>
          <select id="tailor-state" value={form.stateCode} onChange={(e) => set("stateCode", e.target.value)} className={`${input} mt-2 w-full`}>
            {INDIAN_STATES.map((s) => (
              <option key={s.code} value={s.code}>{s.name}</option>
            ))}
          </select>
        </div>
        {field("gstin", "GSTIN (only if the tailor is registered)", { placeholder: "Leave empty if unregistered" })}
        {id && (
          <label className="flex items-center gap-2">
            <input type="checkbox" checked={form.active} onChange={(e) => set("active", e.target.checked)} />
            <span>Active (shown when issuing a challan)</span>
          </label>
        )}
      </div>
    </Dialog>
  )
}
