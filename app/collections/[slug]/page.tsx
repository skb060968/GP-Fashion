import type { Metadata } from "next"
import { notFound } from "next/navigation"
import CategoryListing from "@/components/CategoryListing"
import { getCollection, getCollectionProducts, getCollections } from "@/lib/data/categories"

const SITE_URL = process.env.SITE_URL || "https://gpfashion.in"

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return getCollections().map((c) => ({ slug: c.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const c = getCollection(slug)
  if (!c) return {}
  const title = `${c.name} | Piyush Bholla`
  const description = c.description || `The ${c.name} collection by Piyush Bholla.`
  return {
    title,
    description,
    openGraph: { title, description, url: `${SITE_URL}/collections/${c.slug}`, images: [{ url: `${SITE_URL}${c.coverImage}` }] },
  }
}

export default async function CollectionPage({ params }: Props) {
  const { slug } = await params
  const collection = getCollection(slug)
  if (!collection) notFound()

  return (
    <CategoryListing
      eyebrow={{ label: collection.season || "Collection", href: "/collections" }}
      title={collection.name}
      description={collection.description || undefined}
      banner={{ src: collection.coverImage, alt: collection.name }}
      products={getCollectionProducts(slug)}
      emptyMessage="Pieces from this collection are being added."
    />
  )
}
