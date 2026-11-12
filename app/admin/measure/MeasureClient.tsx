"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/AdminShell"
import { Alert, btn } from "@/components/admin/ui"
import { adminFetch } from "@/lib/admin/fetch"
import { KIND_LABEL, isSnapshot, type MeasurementSnapshot } from "@/lib/measurements/fields"

type OrderForMeasure = {
  orderCode: string
  items: { id: string; name: string; measurements: unknown }[]
}

type Prefill = { orderCode: string; itemName: string; snapshot: MeasurementSnapshot }

export default function MeasureClient() {
  const params = useSearchParams()
  const orderCode = params.get("order")
  const itemId = params.get("item")
  const frame = useRef<HTMLIFrameElement>(null)
  const [prefill, setPrefill] = useState<Prefill | null>(null)
  const [frameReady, setFrameReady] = useState(false)
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    if (!orderCode || !itemId) return
    adminFetch<OrderForMeasure>(`/api/admin/orders/${encodeURIComponent(orderCode)}`)
      .then((o) => {
        const item = o.items.find((i) => i.id === itemId)
        if (!item || !isSnapshot(item.measurements)) throw new Error("That order item has no made-to-measure measurements.")
        setPrefill({ orderCode: o.orderCode, itemName: item.name, snapshot: item.measurements })
      })
      .catch((e) => setStatus({ tone: "error", text: e instanceof Error ? e.message : "Could not load the order" }))
  }, [orderCode, itemId])

  const send = useCallback(() => {
    const win = frame.current?.contentWindow
    if (!prefill || !win) return
    const s = prefill.snapshot
    win.postMessage(
      {
        type: "measureapp:prefill",
        payload: {
          category: s.kind,
          customer: `${s.name} · order ${prefill.orderCode}`.slice(0, 60),
          values: s.values,
          notes: s.notes,
          source: `${prefill.itemName}, order ${prefill.orderCode}`,
        },
      },
      window.location.origin
    )
  }, [prefill])

  useEffect(() => {
    try {
      const doc = frame.current?.contentDocument
      if (doc?.readyState === "complete" && doc.location.pathname === "/admin/measure-app") setFrameReady(true)
    } catch {

    }
  }, [])

  useEffect(() => {
    if (frameReady && prefill) send()
  }, [frameReady, prefill, send])

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return
      const d = e.data
      if (d?.type !== "measureapp:prefilled") return
      setStatus(
        d.ok
          ? { tone: "success", text: `Loaded the measurements for ${prefill?.snapshot.name ?? "the customer"}. Choose the dress and press Submit.` }
          : { tone: "error", text: d.error || "MeasureApp could not use these measurements." }
      )
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [prefill])

  return (
    <>
      {orderCode && (
        <Link href={`/admin/orders/${encodeURIComponent(orderCode)}`} className="mb-4 inline-flex items-center gap-1.5 font-jost text-sm text-black/60 hover:text-black">
          <ArrowLeft className="h-4 w-4" strokeWidth={1.75} aria-hidden />
          Order {orderCode}
        </Link>
      )}
      <AdminPageHeader
        title="Measurements"
        description={
          prefill
            ? `${prefill.itemName} · ${prefill.snapshot.name} (${KIND_LABEL[prefill.snapshot.kind]}) · order ${prefill.orderCode}`
            : "Garment measurements, patterns, fabric, cutting and sewing, and costing."
        }
        actions={
          <>
            {prefill && (
              <button type="button" onClick={send} className={btn.secondary}>
                Load measurements again
              </button>
            )}
            <a href="/admin/measure-app" target="_blank" rel="noopener" className={btn.secondary}>
              <ExternalLink className="h-4 w-4" strokeWidth={1.75} aria-hidden /> Open full screen
            </a>
          </>
        }
      />
      {status && (
        <div className="mb-4">
          <Alert tone={status.tone} onDismiss={() => setStatus(null)}>
            {status.text}
          </Alert>
        </div>
      )}
      <iframe
        ref={frame}
        src="/admin/measure-app"
        title="Measurements"
        onLoad={() => setFrameReady(true)}
        className="block h-[calc(100vh-13rem)] min-h-[640px] w-full rounded-xl border border-black/10 bg-white lg:h-[calc(100vh-15rem)]"
      />
    </>
  )
}
