import type { Metadata } from "next"
import SectionHeading from "@/components/SectionHeading"
import CollectionCard from "@/components/CollectionCard"
import { content } from "@/lib/data"

const SITE_URL = process.env.SITE_URL || "https://gpfashion.in"

export const metadata: Metadata = {
  title: "Collections | GP Fashion",
  description:
    "Explore curated collections celebrating craftsmanship, innovation, and timeless elegance.",
  openGraph: {
    title: "Collections | GP Fashion",
    description:
      "Explore curated collections celebrating craftsmanship, innovation, and timeless elegance.",
    url: `${SITE_URL}/collections`,
    images: [{ url: `${SITE_URL}/images/hero/poster.jpg` }],
  },
}

export default function CollectionsPage() {
  const { collections } = content

  return (
    <main>
      {/* Hero Section */}
      <section className="pt-32 pb-20 bg-stone-50">
        <div className="container-max">
          <SectionHeading
            as="h1"
            title="Collections"
            subtitle="Each collection tells a story—of heritage, innovation, and the artistry of fashion. Explore curated pieces that transcend trends and celebrate timeless elegance."
          />
        </div>
      </section>

      {/* Collections Grid */}
      <section className="pb-24 bg-white">
        <div className="container-max">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-12">
            {collections.map((collection, index) => (
              <CollectionCard
                key={collection.slug}
                {...collection}
                index={index}
              />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-stone-50 text-black">
        <div className="container-max text-center">
          <h2 className="font-serif text-3xl sm:text-4xl font-bold mb-6">
            Interested in Custom Designs?
          </h2>
          <p className="text-lg text-black mb-8 max-w-2xl mx-auto">
            We offer bespoke design services for clients seeking one-of-a-kind pieces tailored to their vision.
          </p>
          <a
            href="/contact"
            className="btn-primary inline-block"
          >
            Get in Touch
          </a>
        </div>
      </section>
    </main>
  )
}
