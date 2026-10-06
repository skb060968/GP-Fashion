import { Check, RotateCcw } from "lucide-react"
import { postDeliveryTracking } from "@/lib/orders/labels"

/** Secondary timeline shown after delivery when a return/exchange is opened. */
export default function ReturnTimeline({ status, history = [] }: { status: string; history?: string[] }) {
  const tracking = postDeliveryTracking(status, history)
  if (!tracking) return null

  return (
    <div className="mt-8 border-t border-black/10 pt-8">
      <div className="mb-5 flex items-center gap-2 font-jost text-xs font-semibold uppercase tracking-[0.18em] text-black/55">
        <RotateCcw className="h-4 w-4" strokeWidth={1.75} aria-hidden /> Return &amp; exchange
      </div>
      <ol
        className="grid gap-1 sm:gap-2"
        style={{ gridTemplateColumns: `repeat(${tracking.steps.length}, minmax(0, 1fr))` }}
        aria-label="Return and exchange progress"
      >
        {tracking.steps.map((step, i) => {
          const done = i <= tracking.progress
          const current = i === tracking.progress
          return (
            <li key={step.key} className="relative flex flex-col items-center text-center">
              {i > 0 && (
                <span aria-hidden className={`absolute right-1/2 top-4 h-px w-full ${i <= tracking.progress ? "bg-black" : "bg-black/15"}`} />
              )}
              <span
                className={`relative z-10 flex h-8 w-8 items-center justify-center rounded-full border font-jost text-xs font-semibold ${
                  done ? "border-black bg-black text-white" : "border-black/20 bg-white text-black/40"
                } ${current ? "ring-4 ring-black/10" : ""}`}
                aria-hidden
              >
                {done && !current ? <Check className="h-4 w-4" strokeWidth={2.5} /> : i + 1}
              </span>
              <span
                className={`mt-3 font-jost text-[11px] leading-tight sm:text-xs ${
                  current ? "font-semibold text-black" : done ? "text-black/70" : "text-black/40"
                }`}
                aria-current={current ? "step" : undefined}
              >
                {step.label}
              </span>
            </li>
          )
        })}
      </ol>
    </div>
  )
}
