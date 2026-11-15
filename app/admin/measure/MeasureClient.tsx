"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { ArrowLeft, ExternalLink } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/AdminShell"
import { Alert, btn } from "@/components/admin/ui"
import { adminFetch } from "@/lib/admin/fetch"
import { categoryOf } from "@/lib/data/categories"
import { KIND_LABEL } from "@/lib/measurements/fields"
import { measureAppPayload, type MeasureAppItem, type MeasureAppPayload } from "@/lib/measurements/measureApp"

type OrderForMeasure = {
  orderCode: string
  items: (MeasureAppItem & { id: string })[]
}

export default function MeasureClient() {
  const params = useSearchParams()
  const orderCode = params.get("order")
  const itemId = params.get("item")
  const frame = useRef<HTMLIFrameElement>(null)
  const [payload, setPayload] = useState<MeasureAppPayload | null>(null)
  const [frameReady, setFrameReady] = useState(false)
  const [status, setStatus] = useState<{ tone: "success" | "error"; text: string } | null>(null)

  useEffect(() => {
    if (!orderCode || !itemId) return
    adminFetch<OrderForMeasure>(`/api/admin/orders/${encodeURIComponent(orderCode)}`)
      .then((o) => {
        const item = o.items.find((i) => i.id === itemId)
        if (!item) throw new Error("That item is not on this order.")
        const p = measureAppPayload(o.orderCode, item, categoryOf(item.slug))
        if (!p) throw new Error("This item is not something the Measurements tool drafts.")
        setPayload(p)
      })
      .catch((e) => setStatus({ tone: "error", text: e instanceof Error ? e.message : "Could not load the order" }))
  }, [orderCode, itemId])

  const send = useCallback(() => {
    const win = frame.current?.contentWindow
    if (!payload || !win) return
    win.postMessage({ type: "measureapp:prefill", payload }, window.location.origin)
  }, [payload])

  useEffect(() => {
    try {
      const doc = frame.current?.contentDocument
      if (doc?.readyState === "complete" && doc.location.pathname === "/admin/measure-app") setFrameReady(true)
    } catch {

    }
  }, [])

  useEffect(() => {
    if (frameReady && payload) send()
  }, [frameReady, payload, send])

  useEffect(() => {
    const onMessage = (e: MessageEvent) => {
      if (e.origin !== window.location.origin || e.source !== frame.current?.contentWindow) return
      const d = e.data
      if (d?.type !== "measureapp:prefilled") return
      setStatus(
        d.ok
          ? { tone: "success", text: `Loaded ${payload?.productName ?? "the order item"}. Check the dress and size, then press Submit.` }
          : { tone: "error", text: d.error || "MeasureApp could not use these details." }
      )
    }
    window.addEventListener("message", onMessage)
    return () => window.removeEventListener("message", onMessage)
  }, [payload])

  const who = payload ? (payload.values ? payload.customer.split(" · ")[0] : `Size ${payload.size}`) : ""

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
          payload
            ? `${payload.productName} · ${who} (${KIND_LABEL[payload.category]}) · order ${orderCode}`
            : "Garment measurements, patterns, fabric, cutting and sewing, and costing."
        }
        actions={
          <>
            {payload && (
              <button type="button" onClick={send} className={btn.secondary}>
                Load again
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
