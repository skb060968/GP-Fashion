"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import { Ruler, X } from "lucide-react"
import { sizeGuides } from "@/lib/data/sizeGuide"
import type { CategorySlug } from "@/lib/data/categories"

type Unit = "in" | "cm"

const fmt = (inches: number, unit: Unit) => (unit === "in" ? inches.toString() : Math.round(inches * 2.54).toString())

/**
 * "Size guide" link that opens a native <dialog> with the body-measurement
 * table for the product's category, a unit toggle, and how-to-measure tips.
 * Sizes the product doesn't come in are shown dimmed.
 */
export default function SizeGuide({ category, availableSizes }: { category: CategorySlug; availableSizes: string[] }) {
  const guide = sizeGuides[category]
  const ref = useRef<HTMLDialogElement>(null)
  const [unit, setUnit] = useState<Unit>("in")
  const [open, setOpen] = useState(false)

  const show = () => { ref.current?.showModal(); setOpen(true) }
  const close = () => ref.current?.close()

  // Keep `open` in sync when the dialog closes via Escape.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const onClose = () => setOpen(false)
    el.addEventListener("close", onClose)
    return () => el.removeEventListener("close", onClose)
  }, [])

  // Lock page scroll while open.
  useEffect(() => {
    if (!open) return
    const prev = document.body.style.overflow
    document.body.style.overflow = "hidden"
    return () => { document.body.style.overflow = prev }
  }, [open])

  return (
    <>
      <button
        type="button"
        onClick={show}
        className="inline-flex items-center gap-1.5 font-jost text-xs uppercase tracking-[0.15em] text-black/60 underline-offset-4 transition-colors hover:text-black hover:underline focus-visible:ring-black"
      >
        <Ruler className="h-3.5 w-3.5" strokeWidth={1.5} aria-hidden />
        Size guide
      </button>

      <dialog
        ref={ref}
        aria-labelledby="size-guide-title"
        onClick={(e) => { if (e.target === ref.current) close() }} // backdrop click
        className="m-0 max-h-[100dvh] w-full max-w-none bg-transparent p-0 backdrop:bg-black/50 backdrop:backdrop-blur-sm sm:m-auto sm:max-h-[90vh] sm:max-w-xl"
      >
        <div className="flex max-h-[100dvh] flex-col bg-white text-black sm:max-h-[90vh]">
          {/* Header */}
          <div className="flex items-start justify-between gap-4 border-b border-black/10 px-6 py-5 sm:px-8">
            <div>
              <h2 id="size-guide-title" className="font-cinzel text-lg font-bold uppercase tracking-[0.15em] sm:text-xl">Size Guide</h2>
              <p className="mt-1 font-jost text-xs uppercase tracking-[0.2em] text-black/50">{category === "menswear" ? "Menswear" : "Womenswear"} · body measurements</p>
            </div>
            <button type="button" onClick={close} aria-label="Close size guide" className="-mr-2 -mt-1 rounded p-2 text-black/60 transition-colors hover:text-black focus-visible:ring-black">
              <X className="h-5 w-5" strokeWidth={1.5} aria-hidden />
            </button>
          </div>

          <div className="overflow-y-auto px-6 py-6 sm:px-8">
            {/* Unit toggle */}
            <div role="radiogroup" aria-label="Units" className="inline-flex rounded-full border border-black/15 p-0.5 font-jost text-xs font-semibold uppercase tracking-[0.12em]">
              {(["in", "cm"] as Unit[]).map((u) => (
                <button
                  key={u}
                  type="button"
                  role="radio"
                  aria-checked={unit === u}
                  onClick={() => setUnit(u)}
                  className={`rounded-full px-4 py-1.5 transition-colors focus-visible:ring-black ${unit === u ? "bg-black text-white" : "text-black/60 hover:text-black"}`}
                >
                  {u === "in" ? "Inches" : "Centimetres"}
                </button>
              ))}
            </div>

            {/* Table */}
            <div className="mt-5 overflow-x-auto">
              <table className="w-full border-collapse font-jost text-sm">
                <thead>
                  <tr className="border-b border-black/15 text-left text-xs uppercase tracking-[0.15em] text-black/50">
                    <th scope="col" className="py-3 pr-4 font-semibold">Size</th>
                    {guide.measurements.map((m) => (
                      <th key={m} scope="col" className="py-3 pr-4 font-semibold">{m}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {guide.rows.map((row) => {
                    const available = availableSizes.includes(row.size)
                    return (
                      <tr key={row.size} className={`border-b border-black/5 ${available ? "" : "text-black/35"}`}>
                        <th scope="row" className="py-3 pr-4 text-left font-semibold">
                          {row.size}
                          {!available && <span className="ml-2 text-[10px] font-normal uppercase tracking-[0.12em]">n/a</span>}
                        </th>
                        {row.values.map((v, i) => (
                          <td key={i} className="py-3 pr-4 tabular-nums">{fmt(v, unit)}</td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>

            {/* How to measure */}
            <h3 className="mt-8 font-jost text-xs font-semibold uppercase tracking-[0.15em] text-black/70">How to measure</h3>
            <dl className="mt-3 space-y-3 font-jost text-sm text-black/75">
              {guide.measurements.map((m, i) => (
                <div key={m}>
                  <dt className="font-semibold text-black">{m}</dt>
                  <dd className="mt-0.5 leading-relaxed">{guide.howToMeasure[i]}</dd>
                </div>
              ))}
            </dl>

            <ul className="mt-6 space-y-2 border-t border-black/10 pt-5 font-jost text-sm text-black/65">
              {guide.notes.map((n) => (
                <li key={n} className="flex gap-3">
                  <span aria-hidden className="mt-[0.6em] h-1 w-1 shrink-0 rounded-full bg-black/50" />
                  {n}
                </li>
              ))}
            </ul>

            <p className="mt-6 font-jost text-sm text-black/65">
              Still unsure, or between sizes? Any piece can be{" "}
              <Link href="/services#made-to-measure" onClick={close} className="underline underline-offset-4 hover:text-black">made to your measurements</Link>, or{" "}
              <Link href="/contact" onClick={close} className="underline underline-offset-4 hover:text-black">send us your measurements</Link>{" "}
              and we will recommend a size.
            </p>
          </div>
        </div>
      </dialog>
    </>
  )
}
