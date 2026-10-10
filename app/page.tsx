import type { Metadata } from "next"
import Hero from "@/components/Hero"
import CategoryShowcase from "@/components/CategoryShowcase"
import AboutUs from "@/components/AboutUs"
import { ACTIVE_CATEGORY_SLUGS, categoryMeta, getCategoryImage } from "@/lib/data/categories"

const SITE_URL = process.env.SITE_URL || "https://gpfashion.in"

export const metadata: Metadata = {
  title: "Piyush Bholla | Contemporary Designer Label",
  description: "Bold, sensual, expressive dressing. Western silhouettes in dialogue with Indian craftsmanship.",
  openGraph: {
    title: "Piyush Bholla | Contemporary Designer Label",
    description: "Bold, sensual, expressive dressing. Western silhouettes in dialogue with Indian craftsmanship.",
    url: SITE_URL,
    images: [{ url: `${SITE_URL}/images/hero/poster.jpg` }],
  },
}

export default function Home() {
  return (
    <main>
      <Hero />

      {ACTIVE_CATEGORY_SLUGS.map((category, index) => {
        const meta = categoryMeta[category]
        return (
          <CategoryShowcase
            key={category}
            id={category}
            title={meta.title}
            description={meta.description}
            image={getCategoryImage(category)}
            imageAlt={`${meta.title} from the current collection`}
            ctaHref={`/${category}`}
            priority={index === 0}
          />
        )
      })}

      <AboutUs />
    </main>
  )
}
