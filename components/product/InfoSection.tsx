import type { ReactNode } from "react"
import { Minus, Plus } from "lucide-react"

interface InfoSectionProps {
  title: string
  defaultOpen?: boolean
  children: ReactNode
}

export default function InfoSection({ title, defaultOpen = false, children }: InfoSectionProps) {
  return (
    <details open={defaultOpen || undefined} className="group/info border-t border-black/10 first:border-t-0">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 font-jost text-xs font-semibold uppercase tracking-[0.15em] text-black/80 transition-colors hover:text-black focus-visible:ring-black [&::-webkit-details-marker]:hidden">
        <span>{title}</span>
        <Plus className="h-4 w-4 shrink-0 group-open/info:hidden" strokeWidth={1.5} aria-hidden />
        <Minus className="hidden h-4 w-4 shrink-0 group-open/info:block" strokeWidth={1.5} aria-hidden />
      </summary>
      <div className="pb-6 font-jost text-sm leading-relaxed text-black/75">{children}</div>
    </details>
  )
}
