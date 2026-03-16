import type { Metadata } from "next"
import Hero from "@/components/Hero"
import About from "@/components/About"
import Link from "next/link"
import SectionHeading from "@/components/SectionHeading"
import CollectionCard from "@/components/CollectionCard"
import RevealWrapper from "@/components/RevealWrapper"
import { content } from "@/lib/data"
import { achievements } from "@/lib/data/achievements"

const SITE_URL = process.env.SITE_URL || "https://gpfashion.in"

export const metadata: Metadata = {
  title: "GP Fashion | Premium Designer Wear",
  description:
    "Discover premium designer wear crafted with intention, texture, and timeless silhouettes.",
  openGraph: {
    title: "GP Fashion | Premium Designer Wear",
    description:
      "Discover premium designer wear crafted with intention, texture, and timeless silhouettes.",
    url: SITE_URL,
    images: [{ url: `${SITE_URL}/images/hero/poster.jpg` }],
  },
}

export default function Home() {
  const { collections, brandStory } = content

  // Featured collections (first 2)
  const featuredCollections = collections.slice(0, 2)

  return (
    <main>
      {/* Hero */}
      <Hero />

      {/* About Section */}
      <section className="bg-stone-50">
        <About />
      </section>

      {/* Featured Collections */}
      <section className="section-padding bg-white">
        <div className="container-max">
          <SectionHeading
            title="Featured Collections"
            subtitle="Curated pieces that tell stories of heritage, innovation, and timeless elegance."
            className="mb-16"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-12">
            {featuredCollections.map((collection, index) => (
              <CollectionCard
                key={collection.slug}
                {...collection}
                index={index}
              />
            ))}
          </div>

          <div className="text-center">
            <Link
              href="/collections"
              className="inline-block btn-secondary"
            >
              View All Collections
            </Link>
          </div>
        </div>
      </section>

      {/* Brand Values */}
      <section className="section-padding bg-stone-50">
        <div className="container-max">
          <SectionHeading
            title="Our Values"
            subtitle="The principles that guide every design decision and creative choice."
            className="mb-16"
          />

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {brandStory.values.map((value, index) => (
              <RevealWrapper key={value.title} index={index}>
                <div className="bg-white rounded-xl p-8 text-center hover:shadow-lg transition-shadow duration-300">
                  <h3 className="font-serif text-xl font-bold text-fashion-black mb-4">
                    {value.title}
                  </h3>
                  <p className="text-sm text-gray-600 leading-relaxed">
                    {value.description}
                  </p>
                </div>
              </RevealWrapper>
            ))}
          </div>
        </div>
      </section>

      {/* Recognition Section */}
      <section className="section-padding bg-white">
        <div className="container-max">
          <SectionHeading
            title="Recognition & Awards"
            subtitle="Honors and accolades celebrating design excellence and sustainability."
            className="mb-16"
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {achievements.map((award, i) => (
              <div
                key={i}
                className="bg-stone-100 rounded-xl shadow-sm p-6 hover:shadow-md transition-shadow"
              >
                <h3 className="font-serif text-xl font-bold text-fashion-gold mb-2">
                  {award.title}
                </h3>
                <p className="text-sm text-gray-500 mb-3">{award.year}</p>
                <p className="text-gray-700 leading-relaxed">{award.description}</p>
              </div>
            ))}
          </div>

        </div>
      </section>

      {/* CTA Section */}
      <section className="section-padding bg-stone-50 text-black">
        <div className="container-max text-center">
          <RevealWrapper>
            <h2 className="font-serif text-4xl sm:text-5xl font-bold mb-6">
              Let's Create Something Extraordinary
            </h2>
            <p className="text-lg text-black mb-10 max-w-2xl mx-auto">
              Whether you're interested in custom designs, collaborations, or simply want to learn more about our work, we'd love to hear from you.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/contact"
                className="inline-block btn-primary"
              >
                Get in Touch
              </Link>
              <Link
                href="/collections"
                className="inline-block btn-secondary"
              >
                Explore Collections
              </Link>
            </div>
          </RevealWrapper>
        </div>
      </section>
    </main>
  )
}