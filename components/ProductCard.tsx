import Image from "next/image"
import Link from "next/link"
import WishlistButton from "@/components/WishlistButton"
import { formatRupees } from "@/lib/money"
import type { Product } from "@/lib/data/categories"

interface ProductCardProps {
  product: Product
  priority?: boolean
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const href = `/shop/${product.slug}`

  return (
    <article className="group flex flex-col">
      <div className="relative aspect-[3/4] overflow-hidden bg-stone-100">
        <Link href={href} className="absolute inset-0" aria-label={product.name}>
          <Image
            src={product.coverImage}
            alt={product.name}
            fill
            priority={priority}
            sizes="(max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        </Link>
        <WishlistButton
          item={{
            slug: product.slug,
            name: product.name,
            price: product.price,
            coverThumbnail: product.coverThumbnail,
            sizes: product.sizes,
          }}
          className="absolute right-2 top-2"
        />
      </div>

      <div className="mt-4">
        <h3 className="font-cinzel text-sm font-bold uppercase tracking-[0.12em] sm:text-base">
          <Link href={href} className="transition-colors hover:text-black/60">
            {product.name}
          </Link>
        </h3>
        <p className="mt-1 font-jost text-sm text-black/70 tabular-nums sm:text-base">
          {formatRupees(product.price)}
        </p>
      </div>
    </article>
  )
}
