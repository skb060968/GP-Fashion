import Image from "next/image"
import FadeIn from "@/components/FadeIn"
import ProductCard from "@/components/ProductCard"
import { categoryMeta, getCategoryProducts, type CategorySlug } from "@/lib/data/categories"

/** Standby category page: full-width banner, intro, then the product grid. */
export default function CategoryListing({ category }: { category: CategorySlug }) {
  const meta = categoryMeta[category]
  const products = getCategoryProducts(category)

  return (
    <div className="bg-white text-black">
      {/* Banner */}
      <div className="relative aspect-[21/9] w-full overflow-hidden bg-stone-100 sm:aspect-[3/1]">
        <Image
          src={meta.image}
          alt=""
          fill
          priority
          sizes="100vw"
          quality={85}
          className="object-cover object-center"
        />
      </div>

      <section className="pb-20 pt-12 sm:pb-24 sm:pt-16 lg:pb-32 lg:pt-20">
        <div className="container-max">
          <FadeIn className="mx-auto max-w-3xl text-center">
            <h1 className="font-cinzel text-3xl font-bold uppercase tracking-[0.2em] sm:text-4xl lg:text-6xl lg:tracking-[0.25em]">
              {meta.title}
            </h1>
            <span aria-hidden className="mx-auto mt-6 block h-px w-16 bg-black/30" />
            <p className="mt-6 font-jost text-base leading-relaxed text-black/70 sm:text-lg">
              {meta.description}
            </p>
            <p className="mt-5 font-jost text-sm uppercase tracking-[0.2em] text-black/50">
              {products.length} {products.length === 1 ? "piece" : "pieces"}
            </p>
          </FadeIn>

          <ul className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 lg:mt-16 lg:grid-cols-3 lg:gap-x-8 xl:grid-cols-4">
            {products.map((product, index) => (
              <li key={product.slug}>
                <FadeIn delay={(index % 4) * 60}>
                  <ProductCard product={product} priority={index < 4} />
                </FadeIn>
              </li>
            ))}
          </ul>
        </div>
      </section>
    </div>
  )
}
