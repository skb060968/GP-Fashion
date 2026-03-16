import type { Metadata } from "next"
import Link from "next/link"
import SectionHeading from "@/components/SectionHeading"
import { dresses } from "@/lib/data/shop"
import ShopClientWrapper from "./ShopClientWrapper"

const SITE_URL = process.env.SITE_URL || "https://gpfashion.in"

export const metadata: Metadata = {
  title: "Shop | GP Fashion",
  description:
    "Browse our curated collection of premium designer garments crafted with intention, texture, and timeless silhouettes.",
  openGraph: {
    title: "Shop | GP Fashion",
    description:
      "Browse our curated collection of premium designer garments crafted with intention, texture, and timeless silhouettes.",
    url: `${SITE_URL}/shop`,
    images: [{ url: `${SITE_URL}/images/hero/poster.jpg` }],
  },
}

export default function ShopPage() {
  return (
    <>
      <section className="bg-white pt-32 pb-24">
        <div className="container-max">
          {/* Header */}
          <SectionHeading
            title="Design Portfolio"
            subtitle="A curated showcase of garments designed with intention, texture, and timeless silhouettes. Each piece represents a commitment to craftsmanship and creative excellence."
            className="mb-20"
          />

          {/* Search, Filters, and Product Grid */}
          <ShopClientWrapper dresses={dresses} />
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-stone-50 py-20">
        <div className="container-max text-center">
          <div className="max-w-2xl mx-auto">
            <h3 className="font-serif text-3xl font-bold text-fashion-black mb-4">
              Interested in Custom Work?
            </h3>
            <p className="text-gray-600 mb-8">
              Each piece can be customized to your specifications. Contact us to discuss bespoke design services.
            </p>
            <Link
              href="/contact"
              className="inline-block btn-secondary"
            >
              Request Consultation
            </Link>
          </div>
        </div>
      </section>
    </>
  )
}
