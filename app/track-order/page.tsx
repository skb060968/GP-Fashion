import type { Metadata } from "next"
import TrackOrderClient from "./TrackOrderClient"

export const metadata: Metadata = {
  title: "Track Order | Piyush Bholla",
  description: "Track the status of your Piyush Bholla order using your order number and mobile number.",
  robots: { index: false },
}

export default function TrackOrderPage() {
  return <TrackOrderClient />
}
