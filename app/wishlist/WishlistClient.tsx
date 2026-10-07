"use client"

import { useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { Heart, X } from "lucide-react"
import { useWishlist, type WishlistItem } from "@/context/WishlistContext"
import { useCart } from "@/context/CartContext"
import { formatRupees } from "@/lib/money"
import FadeIn from "@/components/FadeIn"
import PageHeading from "@/components/PageHeading"
import EmptyState from "@/components/EmptyState"

export default function WishlistClient() {
  const { wishlist } = useWishlist()

  return (
    <div className="bg-white text-black">
      <section className="pb-20 pt-12 sm:pb-24 sm:pt-16 lg:pb-32 lg:pt-20">
        <div className="container-max">
          <PageHeading
            title="Wishlist"
            meta={wishlist.length ? `${wishlist.length} ${wishlist.length === 1 ? "piece" : "pieces"}` : undefined}
          />

          {wishlist.length === 0 ? (
            <EmptyState
              icon={Heart}
              title="Your wishlist is empty"
              description="Save the pieces you love and they will be waiting for you here."
              ctaLabel="Continue browsing"
              ctaHref="/"
            />
          ) : (
            <ul className="mt-14 grid grid-cols-2 gap-x-6 gap-y-12 lg:mt-16 lg:grid-cols-3 lg:gap-x-8 xl:grid-cols-4">
              {wishlist.map((item, index) => (
                <li key={item.slug}>
                  <FadeIn delay={(index % 4) * 60} className="h-full">
                    <WishlistCard item={item} />
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

function WishlistCard({ item }: { item: WishlistItem }) {
  const { removeFromWishlist } = useWishlist()
  const { addToCart } = useCart()
  const [size, setSize] = useState<string>(item.sizes.length === 1 ? item.sizes[0] : "")
  const [added, setAdded] = useState(false)

  const handleAdd = () => {
    if (!size) return
    addToCart({
      slug: item.slug,
      name: item.name,
      price: item.price,
      coverThumbnail: item.coverThumbnail,
      size,
      quantity: 1,
    })
    setAdded(true)
    setTimeout(() => setAdded(false), 1800)
  }

  return (
    <article className="group flex h-full flex-col">
      <div className="relative aspect-[3/4] overflow-hidden bg-stone-100">
        <Link href={`/shop/${item.slug}`} className="absolute inset-0">
          <Image
            src={item.coverImage ?? item.coverThumbnail}
            alt={item.name}
            fill
            sizes="(max-width: 1024px) 50vw, (max-width: 1280px) 33vw, 25vw"
            className="object-cover transition-transform duration-700 ease-out group-hover:scale-[1.03]"
          />
        </Link>
        <button
          type="button"
          onClick={() => removeFromWishlist(item.slug)}
          aria-label={`Remove ${item.name} from wishlist`}
          className="absolute right-2 top-2 flex h-9 w-9 items-center justify-center rounded-full bg-white/90 text-black shadow-sm transition-colors hover:bg-white focus-visible:ring-black"
        >
          <X className="h-4 w-4" strokeWidth={1.5} aria-hidden />
        </button>
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        <h2 className="font-cinzel text-sm font-bold uppercase tracking-[0.12em] sm:text-base">
          <Link href={`/shop/${item.slug}`} className="hover:text-black/60">
            {item.name}
          </Link>
        </h2>
        <p className="mt-1 font-jost text-sm text-black/70 tabular-nums sm:text-base">
          {formatRupees(item.price)}
        </p>

        {item.sizes.length > 1 && (
          <div className="mt-4 flex flex-wrap gap-2" role="radiogroup" aria-label="Size">
            {item.sizes.map((s) => {
              const active = s === size
              return (
                <button
                  key={s}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  onClick={() => setSize(s)}
                  className={`h-9 min-w-9 border px-2 font-jost text-xs font-semibold uppercase transition-colors focus-visible:ring-black ${
                    active
                      ? "border-black bg-black text-white"
                      : "border-black/20 text-black/70 hover:border-black hover:text-black"
                  }`}
                >
                  {s}
                </button>
              )
            })}
          </div>
        )}

        <button
          type="button"
          onClick={handleAdd}
          disabled={!size}
          className="btn-outline-dark mt-4 w-full !px-4 !py-3 !text-xs disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-black sm:!text-sm"
        >
          {added ? "Added to bag" : size ? "Add to bag" : "Select a size"}
        </button>
      </div>
    </article>
  )
}
