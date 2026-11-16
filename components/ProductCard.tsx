import Image from "next/image"
import Link from "next/link"
import WishlistButton from "@/components/WishlistButton"
import { formatRupees } from "@/lib/money"
import { isNewProduct, type StoreProduct } from "@/lib/data/categories"

interface ProductCardProps {
  product: StoreProduct
  priority?: boolean
}

export default function ProductCard({ product, priority = false }: ProductCardProps) {
  const href = `/shop/${product.slug}`
  const hoverImage = product.images.find((src) => src !== product.coverImage)
  const isNew = isNewProduct(product)
  const colourCount = product.colors.length

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
          {hoverImage && (
            <Image
              src={hoverImage}
              alt=""
              aria-hidden
              fill
              sizes="(max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
              className="object-cover opacity-0 transition-[opacity,transform] duration-700 ease-out group-hover:scale-[1.03] [@media(hover:hover)]:group-hover:opacity-100"
            />
          )}
        </Link>
        {product.soldOut ? (
          <span className="pointer-events-none absolute left-2 top-2 bg-black px-2 py-1 font-jost text-[10px] font-semibold uppercase tracking-[0.2em] text-white">
            Sold out
          </span>
        ) : (
          isNew && (
            <span className="pointer-events-none absolute left-2 top-2 bg-white px-2 py-1 font-jost text-[10px] font-semibold uppercase tracking-[0.2em] text-black">
              New in
            </span>
          )
        )}
        <WishlistButton
          item={{
            slug: product.slug,
            name: product.name,
            price: product.price,
            coverThumbnail: product.coverThumbnail,
            coverImage: product.coverImage,
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
        {colourCount > 1 && <p className="mt-1 font-jost text-xs text-black/60">{colourCount} colours</p>}
      </div>
    </article>
  )
}
