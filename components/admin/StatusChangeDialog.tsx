"use client"

import { useEffect, useState } from "react"
import { Check } from "lucide-react"
import StatusBadge from "@/components/StatusBadge"
import { Dialog, btn, input } from "@/components/admin/ui"
import { adminStatusLabel, statusEmailSubject } from "@/lib/orders/labels"
import type { Transition } from "@/lib/orders/transitions"
import { adminFetch } from "@/lib/admin/fetch"

export type StatusChangeTarget = {
  orderCode: string
  status: string
  customerEmail: string | null
}

/**
 * Confirmation for moving an order to a new status. Lets the admin attach a
 * note and decide whether the customer is emailed. Performs the PATCH itself
 * and hands the updated order back.
 */
export default function StatusChangeDialog<T = unknown>({
  target,
  transition,
  onClose,
  onDone,
  onError,
}: {
  target: StatusChangeTarget | null
  transition: Transition | null
  onClose: () => void
  onDone: (updated: T, summary: string) => void
  onError: (message: string) => void
}) {
  const open = Boolean(target && transition)
  const [note, setNote] = useState("")
  const [notify, setNotify] = useState(true)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    if (open) {
      setNote("")
      setNotify(Boolean(target?.customerEmail))
    }
  }, [open, target?.customerEmail])

  const confirm = async () => {
    if (!target || !transition) return
    setSaving(true)
    try {
      const updated = await adminFetch<T>(`/api/admin/orders/${target.orderCode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "status", status: transition.to, note: note.trim() || undefined, notifyCustomer: notify }),
      })
      const emailed = notify && target.customerEmail
      onDone(updated, `Order ${target.orderCode} marked ${adminStatusLabel(transition.to).toLowerCase()}${emailed ? ". Customer emailed." : "."}`)
    } catch (e) {
      onError(e instanceof Error ? e.message : "Could not update the order.")
    } finally {
      setSaving(false)
    }
  }

  return (
    <Dialog
      open={open}
      onClose={() => !saving && onClose()}
      title={transition?.label ?? ""}
      description={transition?.description}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={saving} className={btn.secondary}>
            Cancel
          </button>
          <button type="button" onClick={confirm} disabled={saving} className={transition?.intent === "danger" ? btn.danger : btn.primary}>
            {saving ? "Saving…" : transition?.label}
          </button>
        </>
      }
    >
      {target && transition && (
        <div className="space-y-4 font-jost text-sm">
          <p className="flex flex-wrap items-center gap-2 text-black/70">
            <span className="font-semibold tracking-wide text-black">{target.orderCode}</span>
            <StatusBadge status={target.status} />
            <span aria-hidden>→</span>
            <StatusBadge status={transition.to} />
          </p>
          <label className="block">
            <span className="text-xs font-semibold uppercase tracking-[0.15em] text-black/60">Note (optional)</span>
            <input
              type="text"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              maxLength={500}
              placeholder="e.g. UTR 4123…, matched in Paytm"
              className={`${input} mt-1.5 w-full`}
            />
            <span className="mt-1 block text-xs text-black/45">Recorded in the order history. Not sent to the customer.</span>
          </label>
          {target.customerEmail ? (
            <label className="flex cursor-pointer items-start gap-3 rounded-md border border-black/10 p-3">
              <span className="relative mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
                <input
                  type="checkbox"
                  checked={notify}
                  onChange={(e) => setNotify(e.target.checked)}
                  className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-black/30 checked:border-black checked:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                />
                <Check className="pointer-events-none absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100" strokeWidth={3} aria-hidden />
              </span>
              <span>
                <span className="font-medium">Email the customer</span>
                <span className="mt-0.5 block text-xs text-black/55">
                  “{statusEmailSubject(transition.to, target.orderCode)}” to {target.customerEmail}
                </span>
              </span>
            </label>
          ) : (
            <p className="text-xs text-black/50">No email on this order, so the customer will not be notified.</p>
          )}
        </div>
      )}
    </Dialog>
  )
}
