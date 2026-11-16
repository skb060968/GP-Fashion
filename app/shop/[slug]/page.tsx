import { notFound } from "next/navigation"
import type { Metadata } from "next"
import ProductDetailClient from "./ProductDetailClient"
import { categoryMeta, getAllProducts, getClassification, getProduct } from "@/lib/data/categories"
import { getVisibleCatalog } from "@/lib/catalog/visibility"
import { generateBreadcrumbJsonLd, generateProductJsonLd, serializeJsonLd } from "@/lib/seo/jsonld"

const SITE_URL = process.env.SITE_URL || "https://gpfashion.in"

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return getAllProducts().map((product) => ({ slug: product.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  if (!getProduct(slug)) return {}
  const product = (await getVisibleCatalog()).getProduct(slug)
  if (!product) return {}

  const title = `${product.name} | Piyush Bholla`
  const description = product.description.split(/\n+/).map((l) => l.trim()).filter(Boolean).join(" · ") || `${product.name} by Piyush Bholla. ₹${(product.price / 100).toLocaleString("en-IN")}.`

  return {
    title,
    description,
    alternates: { canonical: `/shop/${product.slug}` },
    openGraph: { title, description, url: `${SITE_URL}/shop/${product.slug}`, images: [{ url: `${SITE_URL}${product.coverImage}` }] },
  }
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  if (!getProduct(slug)) notFound()
  const catalog = await getVisibleCatalog()
  const product = catalog.getProduct(slug)
  if (!product) notFound()

  const category = categoryMeta[product.category]
  const classification = getClassification(product.classification)
  const breadcrumb = generateBreadcrumbJsonLd([
    { name: "Home", path: "/" },
    { name: category.title, path: `/${product.category}` },
    ...(classification ? [{ name: classification.title, path: `/${product.category}/${classification.slug}` }] : []),
    { name: product.name, path: `/shop/${product.slug}` },
  ])

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(generateProductJsonLd(product)) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(breadcrumb) }} />
      <ProductDetailClient product={product} related={catalog.getRelatedProducts(product, 4)} />
    </>
  )
}
