"use client"

import { Analytics } from "@vercel/analytics/next"
import { cleanAnalyticsEvent } from "@/lib/analytics"

export default function SiteAnalytics() {
  return <Analytics beforeSend={cleanAnalyticsEvent} />
}
