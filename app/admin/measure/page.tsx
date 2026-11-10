import type { Metadata } from "next"
import MeasureClient from "./MeasureClient"

export const metadata: Metadata = {
  title: "Measurements | Admin | Piyush Bholla",
}

export default function AdminMeasurePage() {
  return <MeasureClient />
}
