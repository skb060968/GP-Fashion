import type { Metadata } from "next"
import Hero from "@/components/Hero"
import CategoryShowcase from "@/components/CategoryShowcase"
import AboutUs from "@/components/AboutUs"

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
    </main>
  )
}