import type { Metadata } from "next"
import Image from "next/image"
import Link from "next/link"
import PageHeading from "@/components/PageHeading"
import FadeIn from "@/components/FadeIn"
import EmptyState from "@/components/EmptyState"
import { Layers } from "lucide-react"
import { getCollections, getCollectionProducts } from "@/lib/data/categories"

const SITE_URL = process.env.SITE_URL || "https://gpfashion.in"

const DESCRIPTION = "Every release from PIYUSH BHOLLA LABEL, newest first. Each collection brings menswear and womenswear together around one idea."

export const metadata: Metadata = {
  title: "Collections | Piyush Bholla",
  description: DESCRIPTION,
  openGraph: { title: "Collections | Piyush Bholla", description: DESCRIPTION, url: `${SITE_URL}/collections`, images: [{ url: `${SITE_URL}/images/hero/poster.jpg` }] },
}

function formatRelease(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { month: "long", year: "numeric", timeZone: "UTC" })
}

export default function CollectionsPage() {
  const collections = getCollections()

  return (
    <div className="bg-white text-black">
      <section className="pb-20 pt-12 sm:pt-16 lg:pb-32 lg:pt-20">
        <div className="container-max">
          <PageHeading title="Collections" meta={`${collections.length} ${collections.length === 1 ? "release" : "releases"}`} />

          {collections.length === 0 ? (
            <EmptyState icon={Layers} title="First release coming soon" description="Collections appear here as they are released." ctaLabel="Browse all pieces" ctaHref="/shop" />
          ) : (
            <ul className="mt-14 grid grid-cols-1 gap-10 lg:mt-16 lg:grid-cols-2 lg:gap-12">
              {collections.map((c, i) => {
                const count = getCollectionProducts(c.slug).length
                return (
                  <li key={c.slug}>
                    <FadeIn delay={(i % 2) * 100}>
                      <Link href={`/collections/${c.slug}`} className="group block focus-visible:ring-black">
                        <div className="relative aspect-[16/9] overflow-hidden bg-stone-100">
                          <Image
                            src={c.coverImage}
                            alt={c.name}
                            fill
                            priority={i < 2}
                            sizes="(max-width: 1024px) 100vw, 50vw"
                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
                          />
                        </div>
                        <div className="mt-5">
                          <p className="font-jost text-xs font-semibold uppercase tracking-[0.25em] text-black/50">
                            {c.season || formatRelease(c.releaseDate)}
                          </p>
                          <h2 className="mt-2 font-cinzel text-xl font-bold uppercase tracking-[0.15em] transition-colors group-hover:text-black/60 sm:text-2xl">
                            {c.name}
                          </h2>
                          {c.description && <p className="mt-3 font-jost text-base leading-relaxed text-black/70">{c.description}</p>}
                          <p className="mt-3 font-jost text-sm uppercase tracking-[0.2em] text-black/50">
                            {count} {count === 1 ? "piece" : "pieces"}
                          </p>
                        </div>
                      </Link>
                    </FadeIn>
                  </li>
                )
              })}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
