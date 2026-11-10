"use client"

import { ExternalLink } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/AdminShell"
import { btn } from "@/components/admin/ui"

export default function MeasureClient() {
  return (
    <>
      <AdminPageHeader
        title="Measurements"
        description="Garment measurements, patterns, fabric, cutting and sewing, and costing."
        actions={
          <a href="/admin/measure-app" target="_blank" rel="noopener" className={btn.secondary}>
            <ExternalLink className="h-4 w-4" strokeWidth={1.75} aria-hidden /> Open full screen
          </a>
        }
      />
      <iframe
        src="/admin/measure-app"
        title="Measurements"
        className="block h-[calc(100vh-13rem)] min-h-[640px] w-full rounded-xl border border-black/10 bg-white lg:h-[calc(100vh-15rem)]"
      />
    </>
  )
}
