import { notFound } from "next/navigation"
import type { Metadata } from "next"
import DressDetailClient from "./DressDetailClient"
import { dresses } from "@/lib/data/shop"
import { generateProductJsonLd } from "@/lib/seo/jsonld"

const SITE_URL = process.env.SITE_URL || "https://gpfashion.in"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const dress = dresses.find((d) => d.slug === slug)
  if (!dress) return {}

  const title = `${dress.name} | GP Fashion`
  const description = dress.description
    ? dress.description
    : `Shop ${dress.name} at GP Fashion. Premium designer wear starting at ₹${(dress.price / 100).toLocaleString("en-IN")}.`
  const imageUrl = `${SITE_URL}${dress.coverImage}`
  const pageUrl = `${SITE_URL}/shop/${dress.slug}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      images: [{ url: imageUrl }],
    },
  }
}

export default async function DressDetailPage({ params }: Props) {
  const { slug } = await params
  const dress = dresses.find((d) => d.slug === slug)

  if (!dress) {
    return notFound()
  }

  const jsonLd = generateProductJsonLd(dress)

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <DressDetailClient dress={dress} />
    </>
  )
}
