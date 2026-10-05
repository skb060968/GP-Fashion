"use client"

import { useEffect, useRef, type ReactNode } from "react"
import { X } from "lucide-react"

/* ------------------------------ Card ------------------------------ */

export function Card({
  title,
  action,
  children,
  className = "",
  padded = true,
}: {
  title?: string
  action?: ReactNode
  children: ReactNode
  className?: string
  padded?: boolean
}) {
  return (
    <section className={`rounded-xl border border-black/10 bg-white ${className}`}>
      {(title || action) && (
        <header className="flex items-center justify-between gap-4 border-b border-black/10 px-5 py-3.5">
          {title && <h2 className="font-jost text-xs font-semibold uppercase tracking-[0.18em] text-black/60">{title}</h2>}
          {action}
        </header>
      )}
      <div className={padded ? "p-5" : ""}>{children}</div>
    </section>
  )
}

/* ---------------------------- Skeleton ---------------------------- */

export function Skeleton({ className = "" }: { className?: string }) {
  return <div aria-hidden className={`animate-pulse rounded bg-black/[0.06] ${className}`} />
}

/* --------------------------- EmptyState --------------------------- */

export function EmptyRow({ title, hint, action }: { title: string; hint?: string; action?: ReactNode }) {
  return (
    <div className="flex flex-col items-center px-6 py-16 text-center">
      <p className="font-jost text-sm font-semibold">{title}</p>
      {hint && <p className="mt-1 font-jost text-sm text-black/55">{hint}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  )
}

/* ------------------------------ Alert ----------------------------- */

export function Alert({
  tone = "error",
  children,
  onDismiss,
}: {
  tone?: "error" | "success" | "info"
  children: ReactNode
  onDismiss?: () => void
}) {
  const tones = {
    error: "border-red-200 bg-red-50 text-red-800",
    success: "border-emerald-200 bg-emerald-50 text-emerald-800",
    info: "border-black/10 bg-stone-50 text-black/75",
  }
  return (
    <div role={tone === "error" ? "alert" : "status"} className={`flex items-start justify-between gap-4 rounded-md border p-3 font-jost text-sm ${tones[tone]}`}>
      <div>{children}</div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} aria-label="Dismiss" className="-m-1 rounded p-1 opacity-70 hover:opacity-100">
          <X className="h-4 w-4" strokeWidth={2} />
        </button>
      )}
    </div>
  )
}

/* ------------------------------ Dialog ---------------------------- */

export function Dialog({
  open,
  onClose,
  title,
  description,
  children,
  footer,
  size = "md",
}: {
  open: boolean
  onClose: () => void
  title: string
  description?: string
  children?: ReactNode
  footer?: ReactNode
  size?: "sm" | "md" | "lg"
}) {
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const prevOverflow = document.body.style.overflow
    document.body.style.overflow = "hidden"
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose()
    document.addEventListener("keydown", onKey)
    // Focus the first focusable control in the panel.
    const first = panelRef.current?.querySelector<HTMLElement>(
      "input, textarea, select, button:not([data-dialog-close])"
    )
    first?.focus()
    return () => {
      document.body.style.overflow = prevOverflow
      document.removeEventListener("keydown", onKey)
    }
  }, [open, onClose])

  if (!open) return null
  const width = { sm: "max-w-sm", md: "max-w-md", lg: "max-w-2xl" }[size]

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center p-4 sm:items-center" onMouseDown={onClose}>
      <div className="absolute inset-0 bg-black/40" />
      <div
        ref={panelRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby="dialog-title"
        onMouseDown={(e) => e.stopPropagation()}
        className={`relative w-full ${width} max-h-[90vh] overflow-y-auto rounded-xl bg-white shadow-2xl`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-black/10 px-6 py-4">
          <div>
            <h2 id="dialog-title" className="font-cinzel text-base font-bold uppercase tracking-[0.12em]">{title}</h2>
            {description && <p className="mt-1 font-jost text-sm text-black/60">{description}</p>}
          </div>
          <button
            type="button"
            data-dialog-close
            onClick={onClose}
            aria-label="Close"
            className="-m-2 rounded p-2 text-black/50 hover:text-black focus-visible:ring-black"
          >
            <X className="h-5 w-5" strokeWidth={1.75} />
          </button>
        </div>
        {children && <div className="px-6 py-5">{children}</div>}
        {footer && <div className="flex flex-col-reverse gap-2 border-t border-black/10 px-6 py-4 sm:flex-row sm:justify-end">{footer}</div>}
      </div>
    </div>
  )
}

/* ----------------------------- Buttons ---------------------------- */

const BTN = "inline-flex items-center justify-center gap-2 rounded-md px-4 py-2 font-jost text-sm font-semibold transition-colors focus-visible:ring-black disabled:cursor-not-allowed disabled:opacity-40"
export const btn = {
  primary: `${BTN} bg-black text-white hover:bg-black/85 disabled:hover:bg-black`,
  secondary: `${BTN} border border-black/15 bg-white text-black hover:bg-black/5 disabled:hover:bg-white`,
  danger: `${BTN} bg-red-600 text-white hover:bg-red-700 disabled:hover:bg-red-600`,
  ghost: `${BTN} text-black/70 hover:bg-black/5 hover:text-black`,
}

/* ------------------------------ Inputs ---------------------------- */

export const input =
  "rounded-md border border-black/15 bg-white px-3 py-2 font-jost text-sm text-black placeholder:text-black/40 focus:border-black focus:outline-none focus:ring-1 focus:ring-black"
