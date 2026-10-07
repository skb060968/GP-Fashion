import Link from "next/link"
import { Check } from "lucide-react"

const STEPS = [
  { key: "bag", label: "Bag", href: "/bag" },
  { key: "address", label: "Address", href: "/checkout/address" },
  { key: "payment", label: "Payment", href: "/checkout/payment" },
  { key: "confirmation", label: "Confirmation", href: null },
] as const

export type CheckoutStep = (typeof STEPS)[number]["key"]

export default function CheckoutSteps({ current }: { current: CheckoutStep }) {
  const currentIndex = STEPS.findIndex((s) => s.key === current)

  return (
    <nav aria-label="Checkout progress" className="mx-auto max-w-2xl">
      <ol className="flex items-center">
        {STEPS.map((step, i) => {
          const done = i < currentIndex
          const active = i === currentIndex
          const content = (
            <span className="flex flex-col items-center gap-2">
              <span
                className={`flex h-8 w-8 items-center justify-center rounded-full border font-jost text-xs font-semibold transition-colors ${
                  done || active ? "border-black bg-black text-white" : "border-black/20 text-black/40"
                }`}
                aria-hidden
              >
                {done ? <Check className="h-4 w-4" strokeWidth={2} /> : i + 1}
              </span>
              <span
                className={`whitespace-nowrap font-jost text-[11px] uppercase tracking-[0.15em] sm:text-xs ${
                  active ? "font-semibold text-black" : done ? "text-black/70" : "text-black/40"
                }`}
              >
                {step.label}
              </span>
            </span>
          )

          return (
            <li
              key={step.key}
              className="flex flex-1 items-start last:flex-none"
              aria-current={active ? "step" : undefined}
            >
              {done && step.href ? (
                <Link href={step.href} className="rounded focus-visible:ring-black">
                  {content}
                </Link>
              ) : (
                content
              )}
              {i < STEPS.length - 1 && (
                <span
                  aria-hidden
                  className={`mx-2 mt-4 h-px flex-1 sm:mx-3 ${done ? "bg-black" : "bg-black/15"}`}
                />
              )}
            </li>
          )
        })}
      </ol>
    </nav>
  )
}
