import type { Metadata } from "next"
import { Suspense } from "react"
import ShopClient from "./ShopClient"

export const metadata: Metadata = {
  title: "All Pieces | Piyush Bholla",
  description: "Search every piece from Piyush Bholla by name, size and price.",
  alternates: { canonical: "/shop" },
}

export default function ShopPage() {
  return (
    <Suspense fallback={null}>
      <ShopClient />
    </Suspense>
  )
}
