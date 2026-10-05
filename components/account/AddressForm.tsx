"use client"

import { useState } from "react"
import Field from "@/components/checkout/Field"

export type SavedAddress = {
  id: string
  label: string | null
  fullName: string
  phone: string
  addressLine1: string
  addressLine2: string | null
  city: string
  state: string
  pincode: string
  isDefault: boolean
  createdAt: string
}

type FormState = {
  label: string
  fullName: string
  phone: string
  addressLine1: string
  addressLine2: string
  city: string
  state: string
  pincode: string
}

const EMPTY: FormState = { label: "", fullName: "", phone: "", addressLine1: "", addressLine2: "", city: "", state: "", pincode: "" }

export default function AddressForm({
  initial,
  onCancel,
  onSaved,
  title,
}: {
  initial?: SavedAddress
  onCancel: () => void
  onSaved: (a: SavedAddress) => void
  title?: string
}) {
  const [form, setForm] = useState<FormState>(
    initial
      ? {
          label: initial.label ?? "",
          fullName: initial.fullName,
          phone: initial.phone,
          addressLine1: initial.addressLine1,
          addressLine2: initial.addressLine2 ?? "",
          city: initial.city,
          state: initial.state,
          pincode: initial.pincode,
        }
      : EMPTY
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [general, setGeneral] = useState("")
  const [saving, setSaving] = useState(false)

  const set = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    setForm((f) => ({ ...f, [name]: value }))
    setErrors((er) => ({ ...er, [name]: "" }))
  }

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setGeneral("")
    try {
      const url = initial ? `/api/account/addresses/${initial.id}` : "/api/account/addresses"
      const res = await fetch(url, {
        method: initial ? "PATCH" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, isDefault: initial?.isDefault ?? false }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (d.field) setErrors({ [d.field]: d.error })
        else setGeneral(d.error || "Could not save the address")
        return
      }
      onSaved(d.address)
    } catch {
      setGeneral("Could not save the address. Check your connection.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <form onSubmit={submit} noValidate className="card-elevated space-y-5 p-6 sm:p-8">
      <h3 className="font-cinzel text-base font-bold uppercase tracking-[0.15em]">{title ?? (initial ? "Edit address" : "New address")}</h3>
      <Field label="Label" name="label" placeholder="Home, Office…" value={form.label} onChange={set} error={errors.label} optional />
      <Field label="Full name" name="fullName" autoComplete="name" value={form.fullName} onChange={set} error={errors.fullName} />
      <Field label="Mobile number" name="phone" type="tel" inputMode="numeric" maxLength={10} autoComplete="tel-national" value={form.phone} onChange={set} error={errors.phone} />
      <Field label="Address" name="addressLine1" autoComplete="address-line1" placeholder="House no., street, area" value={form.addressLine1} onChange={set} error={errors.addressLine1} />
      <Field label="Apartment, landmark" name="addressLine2" autoComplete="address-line2" value={form.addressLine2} onChange={set} error={errors.addressLine2} optional />
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
        <Field label="City" name="city" autoComplete="address-level2" value={form.city} onChange={set} error={errors.city} />
        <Field label="State" name="state" autoComplete="address-level1" value={form.state} onChange={set} error={errors.state} />
        <Field label="Pincode" name="pincode" inputMode="numeric" maxLength={6} autoComplete="postal-code" value={form.pincode} onChange={set} error={errors.pincode} />
      </div>
      {general && <p role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 font-jost text-sm text-red-800">{general}</p>}
      <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
        <button type="button" onClick={onCancel} disabled={saving} className="btn-outline-dark">
          Cancel
        </button>
        <button type="submit" disabled={saving} className="btn-solid-dark disabled:opacity-40">
          {saving ? "Saving…" : "Save address"}
        </button>
      </div>
    </form>
  )
}
