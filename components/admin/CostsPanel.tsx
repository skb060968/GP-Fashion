"use client"

import { useState } from "react"
import Link from "next/link"
import { Plus } from "lucide-react"
import { Card, btn } from "@/components/admin/ui"
import PurchaseDialog, { type AdminPurchase } from "@/components/admin/PurchaseDialog"
import { formatRupeesExact } from "@/lib/money"
import { PURCHASE_CATEGORY_LABEL, purchaseCost, type PurchaseCategory } from "@/lib/purchases/purchases"

const day = (iso: string) => new Date(iso).toLocaleDateString("en-IN", { timeZone: "Asia/Kolkata", day: "numeric", month: "short" })

export default function CostsPanel({
  orderCode,
  taxableValue,
  purchases,
  challans,
  onChanged,
}: {
  orderCode: string
  taxableValue: number
  purchases: AdminPurchase[]
  challans: { number: string; tailorName: string; cancelledAt: string | null }[]
  onChanged: (message: string) => void
}) {
  const [adding, setAdding] = useState(false)
  const cost = purchases.reduce((n, p) => n + purchaseCost(p), 0)
  const margin = taxableValue - cost

  return (
    <Card
      title="Costs"
      action={
        <button type="button" onClick={() => setAdding(true)} className={`${btn.secondary} !px-3 !py-1.5 !text-xs`}>
          <Plus className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> Add cost
        </button>
      }
    >
      {purchases.length === 0 ? (
        <p className="font-jost text-sm text-black/60">No fabric bills or expenses linked to this order yet.</p>
      ) : (
        <ul className="divide-y divide-black/5 font-jost text-sm">
          {purchases.map((p) => (
            <li key={p.id} className="flex flex-wrap items-baseline justify-between gap-x-4 py-2">
              <span>
                <span className="font-semibold">{PURCHASE_CATEGORY_LABEL[p.category as PurchaseCategory] ?? p.category}</span>
                <span className="text-black/60">
                  {" "}
                  · {p.supplierName} · {day(p.date)}
                  {p.challan?.number ? ` · ${p.challan.number}` : ""}
                </span>
                <span className="block text-xs text-black/50">
                  {p.description}
                  {p.claimItc ? " · GST claimed as credit" : p.kind === "NO_GST" ? " · no GST bill" : ""}
                </span>
              </span>
              <span className="tabular-nums">{formatRupeesExact(purchaseCost(p))}</span>
            </li>
          ))}
        </ul>
      )}
      <dl className="mt-3 space-y-1 border-t border-black/10 pt-3 font-jost text-sm">
        <div className="flex justify-between text-black/65">
          <dt>Sale value before GST</dt>
          <dd className="tabular-nums text-black">{formatRupeesExact(taxableValue)}</dd>
        </div>
        <div className="flex justify-between text-black/65">
          <dt>Cost (GST credit taken off)</dt>
          <dd className="tabular-nums text-black">{formatRupeesExact(cost)}</dd>
        </div>
        <div className="flex justify-between font-semibold">
          <dt>Margin</dt>
          <dd className={`tabular-nums ${margin < 0 ? "text-red-700" : ""}`}>{formatRupeesExact(margin)}</dd>
        </div>
      </dl>
      <p className="mt-2 font-jost text-xs text-black/50">
        Edit or delete entries on the <Link href="/admin/purchases" className="underline underline-offset-4">Purchases</Link> page.
      </p>
      {adding && (
        <PurchaseDialog
          order={{ orderCode, challans: challans.filter((c) => !c.cancelledAt).map((c) => ({ number: c.number, label: `${c.number} · ${c.tailorName}` })) }}
          onClose={() => setAdding(false)}
          onSaved={() => {
            setAdding(false)
            onChanged("Cost added.")
          }}
        />
      )}
    </Card>
  )
}
