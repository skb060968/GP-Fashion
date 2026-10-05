"use client"

import { useEffect, useState } from "react"
import { MapPin, Plus } from "lucide-react"
import EmptyState from "@/components/EmptyState"
import AddressForm, { type SavedAddress } from "@/components/account/AddressForm"

export default function AddressesClient() {
  const [addresses, setAddresses] = useState<SavedAddress[] | null>(null)
  const [error, setError] = useState("")
  const [editing, setEditing] = useState<SavedAddress | "new" | null>(null)
  const [busyId, setBusyId] = useState<string | null>(null)

  const load = () =>
    fetch("/api/account/addresses", { credentials: "same-origin" })
      .then(async (r) => {
        if (r.status === 401) {
          window.location.href = "/login?next=/account/addresses"
          return
        }
        const d = await r.json()
        if (!r.ok) throw new Error(d.error || "Could not load addresses")
        setAddresses(d.addresses)
      })
      .catch((e) => setError(e.message))

  useEffect(() => {
    load()
  }, [])

  const remove = async (a: SavedAddress) => {
    if (!confirm(`Remove the address for ${a.fullName}?`)) return
    setBusyId(a.id)
    try {
      const r = await fetch(`/api/account/addresses/${a.id}`, { method: "DELETE" })
      if (!r.ok) throw new Error("Could not remove the address")
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not remove the address")
    } finally {
      setBusyId(null)
    }
  }

  const makeDefault = async (a: SavedAddress) => {
    setBusyId(a.id)
    try {
      const { id, isDefault, createdAt, ...rest } = a
      void id; void isDefault; void createdAt
      const r = await fetch(`/api/account/addresses/${a.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...rest, isDefault: true }),
      })
      if (!r.ok) throw new Error("Could not update the address")
      await load()
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not update the address")
    } finally {
      setBusyId(null)
    }
  }

  if (error) return <p className="rounded-lg border border-red-200 bg-red-50 p-4 font-jost text-sm text-red-800">{error}</p>
  if (!addresses) return <div className="h-40 animate-pulse rounded-xl bg-stone-100" />

  return (
    <>
      {addresses.length === 0 && editing === null ? (
        <div className="card-elevated">
          <EmptyState
            icon={MapPin}
            title="No saved addresses"
            description="Save an address and we'll fill it in for you at checkout."
            ctaLabel="Add address"
            ctaHref="#"
          />
          <div className="-mt-20 flex justify-center pb-10">
            <button type="button" onClick={() => setEditing("new")} className="btn-outline-dark">
              Add address
            </button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <ul className="grid gap-4 sm:grid-cols-2">
            {addresses.map((a) => (
              <li key={a.id} className="card-elevated flex flex-col p-5 font-jost text-sm">
                <div className="flex items-start justify-between gap-3">
                  <p className="font-semibold">{a.label || a.fullName}</p>
                  {a.isDefault && <span className="rounded-full border border-black px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em]">Default</span>}
                </div>
                <address className="mt-2 flex-1 not-italic leading-relaxed text-black/70">
                  {a.label && <span className="block text-black">{a.fullName}</span>}
                  {a.addressLine1}
                  {a.addressLine2 ? `, ${a.addressLine2}` : ""}
                  <br />
                  {a.city}, {a.state} {a.pincode}
                  <br />
                  {a.phone}
                </address>
                <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs">
                  <button type="button" onClick={() => setEditing(a)} className="underline underline-offset-4 hover:text-black">Edit</button>
                  {!a.isDefault && (
                    <button type="button" onClick={() => makeDefault(a)} disabled={busyId === a.id} className="underline underline-offset-4 hover:text-black disabled:opacity-40">
                      Make default
                    </button>
                  )}
                  <button type="button" onClick={() => remove(a)} disabled={busyId === a.id} className="text-red-700 underline underline-offset-4 disabled:opacity-40">
                    Remove
                  </button>
                </div>
              </li>
            ))}
          </ul>
          {editing === null && (
            <button type="button" onClick={() => setEditing("new")} className="btn-outline-dark">
              <Plus className="mr-2 h-4 w-4" strokeWidth={1.75} aria-hidden /> Add address
            </button>
          )}
        </div>
      )}

      {editing !== null && (
        <div className="mt-6">
          <AddressForm
            initial={editing === "new" ? undefined : editing}
            onCancel={() => setEditing(null)}
            onSaved={() => {
              setEditing(null)
              load()
            }}
          />
        </div>
      )}
    </>
  )
}
