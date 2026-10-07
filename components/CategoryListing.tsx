import Image from "next/image"
import Link from "next/link"
import { Sparkles } from "lucide-react"
import FadeIn from "@/components/FadeIn"
import ProductCard from "@/components/ProductCard"
import EmptyState from "@/components/EmptyState"
import type { Product } from "@/lib/data/categories"

export interface ListingChip {
  label: string
  href: string
  active?: boolean
}

interface CategoryListingProps {
  title: string
  description?: string

  banner?: { src: string; alt?: string }

  eyebrow?: { label: string; href: string }

  chips?: ListingChip[]

  note?: string
  products: Product[]
  emptyMessage?: string
}

export default function CategoryListing({
  title,
  description,
  banner,
  eyebrow,
  chips,
  note,
  products,
  emptyMessage = "Nothing here yet. New pieces are added with each release.",
}: CategoryListingProps) {
  return (
    <div className="bg-white text-black">
      {banner && (
        <div className="relative aspect-[21/9] w-full overflow-hidden bg-stone-100 sm:aspect-[3/1]">
          <Image src={banner.src} alt={banner.alt ?? ""} fill priority sizes="100vw" quality={85} className="object-cover object-center" />
        </div>
      )}

      <section className="pb-20 pt-12 sm:pb-24 sm:pt-16 lg:pb-32 lg:pt-20">
        <div className="container-max">
          <FadeIn className="mx-auto max-w-3xl text-center">
            {eyebrow && (
              <Link href={eyebrow.href} className="font-jost text-xs font-semibold uppercase tracking-[0.25em] text-black/50 transition-colors hover:text-black">
                {eyebrow.label}
              </Link>
            )}
            <h1 className={`font-cinzel text-3xl font-bold uppercase tracking-[0.2em] sm:text-4xl lg:text-6xl lg:tracking-[0.25em] ${eyebrow ? "mt-3" : ""}`}>
              {title}
            </h1>
            <span aria-hidden className="mx-auto mt-6 block h-px w-16 bg-black/30" />
            {description && <p className="mt-6 font-jost text-base leading-relaxed text-black/70 sm:text-lg">{description}</p>}
            <p className="mt-5 font-jost text-sm uppercase tracking-[0.2em] text-black/50">
              {products.length} {products.length === 1 ? "piece" : "pieces"}
            </p>
          </FadeIn>

          {chips && chips.length > 0 && (
            <FadeIn delay={80} className="mt-10 flex flex-col items-center gap-3">
              <nav aria-label="Browse" className="flex flex-wrap justify-center gap-2">
                {chips.map((c) => (
                  <Link
                    key={c.href}
                    href={c.href}
                    aria-current={c.active ? "page" : undefined}
                    className={`inline-flex h-9 shrink-0 items-center rounded-full border px-4 font-jost text-xs font-semibold uppercase tracking-[0.12em] transition-colors focus-visible:ring-black ${
                      c.active ? "border-black bg-black text-white" : "border-black/20 text-black/70 hover:border-black hover:text-black"
                    }`}
                  >
                    {c.label}
                  </Link>
                ))}
              </nav>
              {note && <p className="font-jost text-xs text-black/50">{note}</p>}
            </FadeIn>
          )}

          {products.length === 0 ? (
            <div className="mt-14 lg:mt-16">
              <EmptyState icon={Sparkles} title="Coming soon" description={emptyMessage} ctaLabel="Browse all pieces" ctaHref="/shop" />
            </div>
          ) : (
            <ul className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 lg:mt-16 lg:grid-cols-3 lg:gap-x-8 xl:grid-cols-4">
              {products.map((product, index) => (
                <li key={product.slug}>
                  <FadeIn delay={(index % 4) * 60}>
                    <ProductCard product={product} priority={index < 4} />
                  </FadeIn>
                </li>
              ))}
            </ul>
          )}
        </div>
      </section>
    </div>
  )
}
