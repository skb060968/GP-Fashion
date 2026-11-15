"use client"

import { useEffect, useState, type RefObject } from "react"
import { Check } from "lucide-react"
import { formatRupees } from "@/lib/money"

interface StickyBuyBarProps {
  name: string
  price: number
  added: boolean
  onAdd: () => void
  targetRef: RefObject<HTMLElement | null>
}

export default function StickyBuyBar({ name, price, added, onAdd, targetRef }: StickyBuyBarProps) {
  const [offscreen, setOffscreen] = useState(false)
  const [wide, setWide] = useState(false)

  useEffect(() => {
    const el = targetRef.current
    if (!el) return
    const observer = new IntersectionObserver(([entry]) => setOffscreen(!entry.isIntersecting))
    observer.observe(el)
    return () => observer.disconnect()
  }, [targetRef])

  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)")
    const update = () => setWide(mq.matches)
    update()
    mq.addEventListener("change", update)
    return () => mq.removeEventListener("change", update)
  }, [])

  const show = offscreen && !wide

  useEffect(() => {
    const html = document.documentElement
    if (show) html.dataset.buybar = "1"
    else delete html.dataset.buybar
    return () => {
      delete html.dataset.buybar
    }
  }, [show])

  return (
    <div
      inert={!show}
      aria-hidden={!show}
      className={`fixed inset-x-0 bottom-0 z-30 border-t border-black/10 bg-white shadow-[0_-4px_16px_rgba(0,0,0,0.08)] transition-transform duration-300 ease-out motion-reduce:transition-none lg:hidden print:hidden ${
        show ? "translate-y-0" : "pointer-events-none translate-y-full"
      }`}
      style={{ paddingBottom: "calc(0.75rem + env(safe-area-inset-bottom))" }}
    >
      <div className="container-max flex items-center gap-4 pt-3">
        <div className="min-w-0 flex-1">
          <p className="truncate font-cinzel text-sm font-bold uppercase tracking-[0.08em]">{name}</p>
          <p className="font-jost text-sm tabular-nums text-black/70">{formatRupees(price)}</p>
        </div>
        <button type="button" onClick={onAdd} className="btn-solid-dark shrink-0 !px-6 !py-3 !text-sm sm:!px-8">
          {added ? (
            <span className="inline-flex items-center gap-2"><Check className="h-4 w-4" strokeWidth={2.5} aria-hidden /> Added</span>
          ) : (
            "Add to bag"
          )}
        </button>
      </div>
    </div>
  )
}
