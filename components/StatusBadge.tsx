// components/StatusBadge.tsx
// Order status pill. One source of truth for colours and wording.

import { adminStatusLabel } from "@/lib/orders/labels"

const STYLES: Record<string, string> = {
  UNDER_VERIFICATION: "bg-amber-50 text-amber-800 ring-amber-200",
  VERIFIED: "bg-emerald-50 text-emerald-800 ring-emerald-200",
  REJECTED: "bg-red-50 text-red-800 ring-red-200",
  PROCESSING: "bg-sky-50 text-sky-800 ring-sky-200",
  SHIPPED: "bg-indigo-50 text-indigo-800 ring-indigo-200",
  DELIVERED: "bg-black text-white ring-black",
  CANCELLED: "bg-stone-100 text-stone-700 ring-stone-200",
  REFUNDED: "bg-stone-100 text-stone-700 ring-stone-200",
}

const DOTS: Record<string, string> = {
  UNDER_VERIFICATION: "bg-amber-500",
  VERIFIED: "bg-emerald-500",
  REJECTED: "bg-red-500",
  PROCESSING: "bg-sky-500",
  SHIPPED: "bg-indigo-500",
  DELIVERED: "bg-white",
  CANCELLED: "bg-stone-400",
  REFUNDED: "bg-stone-400",
}

export default function StatusBadge({ status, size = "sm" }: { status: string; size?: "sm" | "md" }) {
  const style = STYLES[status] ?? "bg-stone-100 text-stone-700 ring-stone-200"
  const dot = DOTS[status] ?? "bg-stone-400"
  const dims = size === "md" ? "px-3 py-1.5 text-sm" : "px-2.5 py-1 text-xs"
  return (
    <span
      className={`inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-jost font-medium ring-1 ring-inset ${dims} ${style}`}
    >
      <span aria-hidden className={`h-1.5 w-1.5 rounded-full ${dot}`} />
      {adminStatusLabel(status)}
    </span>
  )
}
