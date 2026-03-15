import type { Metadata } from "next"
import TrackOrderClient from "./TrackOrderClient"

const SITE_URL = process.env.SITE_URL || "https://gpfashion.in"

export const metadata: Metadata = {
  title: "Track Order | GP Fashion",
  description:
    "Track your GP Fashion order status using your order code and phone number.",
  openGraph: {
    title: "Track Order | GP Fashion",
    description:
      "Track your GP Fashion order status using your order code and phone number.",
    url: `${SITE_URL}/track-order`,
    images: [{ url: `${SITE_URL}/images/hero/poster.jpg` }],
  },
}

export default function TrackOrderPage() {
  return <TrackOrderClient />
}
