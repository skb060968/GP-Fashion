import type { Metadata } from "next"
import Hero from "@/components/Hero"
import CategoryShowcase from "@/components/CategoryShowcase"
import AboutUs from "@/components/AboutUs"
import { categoryMeta } from "@/lib/data/categories"
import { getVisibleCatalog } from "@/lib/catalog/visibility"
import { generateOrganizationJsonLd, serializeJsonLd } from "@/lib/seo/jsonld"

const SITE_URL = process.env.SITE_URL || "https://gpfashion.in"

export const metadata: Metadata = {
  title: "Piyush Bholla | Contemporary Designer Label",
  description: "Bold, sensual, expressive dressing. Western silhouettes in dialogue with Indian craftsmanship.",
  alternates: { canonical: "/" },
  openGraph: {
    title: "Piyush Bholla | Contemporary Designer Label",
    description: "Bold, sensual, expressive dressing. Western silhouettes in dialogue with Indian craftsmanship.",
    url: SITE_URL,
    images: [{ url: `${SITE_URL}/images/hero/poster.jpg` }],
  },
}

export default async function Home() {
  const catalog = await getVisibleCatalog()
  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: serializeJsonLd(generateOrganizationJsonLd()) }} />
      <Hero />

      {catalog.activeCategorySlugs.map((category, index) => {
        const meta = categoryMeta[category]
        return (
          <CategoryShowcase
            key={category}
            id={category}
            title={meta.title}
            description={meta.description}
            image={catalog.getCategoryImage(category)}
            imageAlt={`${meta.title} from the current collection`}
            ctaHref={`/${category}#pieces`}
            priority={index === 0}
          />
        )
      })}

      <AboutUs />
    </main>
  )
}
