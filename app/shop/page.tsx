import type { Metadata } from "next"
import { Suspense } from "react"
import ShopClient from "./ShopClient"
import { getVisibleCatalog } from "@/lib/catalog/visibility"

export const metadata: Metadata = {
  title: "All Pieces | Piyush Bholla",
  description: "Search every piece from Piyush Bholla by name, size and price.",
  alternates: { canonical: "/shop" },
}

export default async function ShopPage() {
  const catalog = await getVisibleCatalog()
  return (
    <Suspense fallback={null}>
      <ShopClient products={catalog.products} categories={catalog.activeCategorySlugs} />
    </Suspense>
  )
}
