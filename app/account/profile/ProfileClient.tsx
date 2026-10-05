"use client"

import { useEffect, useState } from "react"
import { useUser } from "@/context/UserContext"
import Field from "@/components/checkout/Field"

export default function ProfileClient() {
  const { user, setUser } = useUser()
  const [name, setName] = useState("")
  const [phone, setPhone] = useState("")
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null)

  useEffect(() => {
    if (user) {
      setName(user.name ?? "")
      setPhone(user.phone ?? "")
    }
  }, [user])

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setMsg(null)
    try {
      const res = await fetch("/api/account/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), phone: phone.trim() }),
      })
      const d = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(d.error || "Could not save")
      setUser(d.user)
      setMsg({ ok: true, text: "Saved." })
    } catch (err) {
      setMsg({ ok: false, text: err instanceof Error ? err.message : "Could not save" })
    } finally {
      setSaving(false)
    }
  }

  if (!user) return null

  return (
    <form onSubmit={save} noValidate className="card-elevated space-y-6 p-8">
      <div>
        <p className="font-jost text-xs font-semibold uppercase tracking-[0.15em] text-black/70">Email</p>
        <p className="mt-2 font-jost text-black">{user.email}</p>
        <p className="mt-1 font-jost text-xs text-black/50">This is how you sign in and where order updates are sent.</p>
      </div>
      <Field label="Name" name="name" autoComplete="name" value={name} onChange={(e) => setName(e.target.value)} optional />
      <Field
        label="Mobile number"
        name="phone"
        type="tel"
        inputMode="numeric"
        maxLength={10}
        autoComplete="tel-national"
        value={phone}
        onChange={(e) => setPhone(e.target.value)}
        optional
        hint="Used to prefill checkout."
      />
      {msg && (
        <p role={msg.ok ? "status" : "alert"} className={`rounded-lg border p-3 font-jost text-sm ${msg.ok ? "border-emerald-200 bg-emerald-50 text-emerald-800" : "border-red-200 bg-red-50 text-red-800"}`}>
          {msg.text}
        </p>
      )}
      <div className="flex justify-end">
        <button type="submit" disabled={saving} className="btn-solid-dark disabled:opacity-40">
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </form>
  )
}
