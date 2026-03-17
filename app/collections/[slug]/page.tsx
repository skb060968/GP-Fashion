import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import type { Metadata } from "next"
import { content } from "@/lib/data"
import { dresses } from "@/lib/data/shop"
import { formatRupees } from "@/lib/money"
import RevealWrapper from "@/components/RevealWrapper"
import GoldCornerFrame from "@/components/GoldCornerFrame"

const SITE_URL = process.env.SITE_URL || "https://gpfashion.in"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const collection = content.collections.find((c) => c.slug === slug)
  if (!collection) return {}

  const title = `${collection.name} | GP Fashion`
  const description = collection.description
  const imageUrl = `${SITE_URL}${collection.coverImage}`
  const pageUrl = `${SITE_URL}/collections/${collection.slug}`

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

export default async function CollectionDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  // ✅ unwrap the Promise
  const { slug } = await params

  const collection = content.collections.find((c) => c.slug === slug)

  if (!collection) {
    return notFound()
  }

  // Get dresses in this collection
  const collectionDresses = dresses.filter((dress) =>
    collection.dresses.includes(dress.slug)
  )

  return (
    <main>
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 bg-white">
        <div className="container-max">
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm font-medium tracking-wider uppercase text-fashion-gold mb-4">
              {collection.season}
            </p>
            <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-bold text-fashion-black mb-8">
              {collection.name}
            </h1>
            <p className="text-xl text-gray-600 leading-relaxed mb-6">
              {collection.description}
            </p>

            {/* Mood and Inspiration */}
            <div className="flex flex-col items-center gap-4 text-base text-gray-600 mb-6">
              <div className="flex flex-wrap items-center justify-center gap-6">
                <div>
                  <span className="font-semibold text-fashion-black">Mood:</span>{" "}
                  {collection.mood}
                </div>
                <div className="w-1 h-1 bg-gray-400 rounded-full" />
                <div>
                  <span className="font-semibold text-fashion-black">
                    {collectionDresses.length}
                  </span>{" "}
                  Pieces
                </div>
              </div>

              {/* Inspiration */}
              <div className="max-w-2xl">
                <p className="text-gray-600 leading-relaxed">
                  <span className="font-semibold text-fashion-black">
                    Inspiration:
                  </span>{" "}
                  {collection.inspiration}
                </p>
              </div>
            </div>

            <div className="w-24 h-1 bg-fashion-gold mx-auto mt-8" />
          </div>
        </div>
      </section>

      {/* Collection Pieces */}
      <section className="py-20 bg-stone-50">
        <div className="container-max">
          <h2 className="font-serif text-3xl font-bold text-center mb-16">
            The Collection
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-8 gap-y-16">
            {collectionDresses.map((dress, index) => (
              <RevealWrapper key={dress.slug} index={index}>
                <Link href={`/shop/${dress.slug}`} className="group block">
                  {/* Premium Frame Container */}
                  <GoldCornerFrame className="shadow-xl transition-all duration-500 ease-out group-hover:shadow-2xl group-hover:-translate-y-2">
                    {/* Inner frame with image */}
                    <div className="relative overflow-hidden rounded-xl sm:rounded-2xl shadow-lg ring-1 ring-stone-200">
                      <Image
    src={dress.coverImage}
    alt={dress.name}
    width={600}
    height={800}
    className="w-full aspect-[3/4] object-cover transition-transform duration-700 ease-out group-hover:scale-105"
    priority
  />


                      {/* Dress name overlay */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent p-6 translate-y-full group-hover:translate-y-0 transition-transform duration-500">
                        <h3 className="text-xl font-medium text-white">
                          {dress.name}
                        </h3>
                      </div>

                      {/* Hover CTA */}
                      <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
                        <span className="px-5 py-2 bg-white text-sm font-medium rounded-full shadow-lg">
                          View Details
                        </span>
                      </div>
                    </div>
                  </GoldCornerFrame>
                </Link>
              </RevealWrapper>
            ))}
          </div>
          <div className="text-center mt-16">
            <Link
              href="/collections"
              className="btn-secondary inline-flex items-center"
            >
              <svg
                className="w-5 h-5 mr-2"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 19l-7-7 7-7"
                />
              </svg>
              Back to All Collections
            </Link>
          </div>
        </div>
      </section>
    </main>
  )
}