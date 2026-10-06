import { notFound } from "next/navigation"
import type { Metadata } from "next"
import ProductDetailClient from "./ProductDetailClient"
import { getProduct } from "@/lib/data/categories"
import { generateProductJsonLd } from "@/lib/seo/jsonld"

const SITE_URL = process.env.SITE_URL || "https://gpfashion.in"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = getProduct(slug)
  if (!product) return {}

  const title = `${product.name} | Piyush Bholla`
  const description = product.description || `${product.name} by Piyush Bholla. ₹${(product.price / 100).toLocaleString("en-IN")}.`

  return {
    title,
    description,
    openGraph: { title, description, url: `${SITE_URL}/shop/${product.slug}`, images: [{ url: `${SITE_URL}${product.coverImage}` }] },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = getProduct(slug)
  if (!product) notFound()

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(generateProductJsonLd(product)) }} />
      <ProductDetailClient product={product} />
    </>
  )
}
