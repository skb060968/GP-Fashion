import type { Metadata } from "next"
import Hero from "@/components/Hero"
import CategoryShowcase from "@/components/CategoryShowcase"
import AboutUs from "@/components/AboutUs"
import Link from "next/link"
import SectionHeading from "@/components/SectionHeading"
import RevealWrapper from "@/components/RevealWrapper"
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
  return (
    <main>
      {/* Hero */}
      <Hero />

      {/* Menswear / Womenswear showcases (anchored from the navbar menu) */}
      <CategoryShowcase
        id="menswear"
        title="Menswear"
        description="Refined tailoring that balances tradition with contemporary style. Pieces for the modern man who values quality, fit, and timeless elegance."
        image="/images/home/menswear.webp"
        imageAlt="Two models in looks from the menswear collection"
        priority
      />
      <CategoryShowcase
        id="womenswear"
        title="Womenswear"
        description="Timeless silhouettes reimagined with a contemporary sensibility. Every piece tells a story of refined craftsmanship and understated luxury."
        image="/images/home/womenswear.webp"
        imageAlt="Two models in trench coats from the womenswear collection"
      />

      {/* About Us (brand story + values, anchored from the navbar menu) */}
      <AboutUs />

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
                className="card-base bg-stone-100 p-6"
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