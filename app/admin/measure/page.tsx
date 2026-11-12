import { Suspense } from "react"
import type { Metadata } from "next"
import MeasureClient from "./MeasureClient"

export const metadata: Metadata = {
  title: "Measurements | Admin | Piyush Bholla",
}

export default function AdminMeasurePage() {
  return (
    <Suspense fallback={null}>
      <MeasureClient />
    </Suspense>
  )
}
