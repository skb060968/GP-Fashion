"use client"

import { useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { ArrowLeft, Check, ChevronLeft, ChevronRight, Minus, Plus } from "lucide-react"
import { formatRupees } from "@/lib/money"
import { useCart } from "@/context/CartContext"
import { categoryMeta, getClassification, getCollection, type Product } from "@/lib/data/categories"
import WishlistButton from "@/components/WishlistButton"
import SizeGuide from "@/components/SizeGuide"
import FadeIn from "@/components/FadeIn"

const MAX_QTY = 10

const DETAILS = [
  "Dispatched within 3 to 5 working days of payment confirmation",
  "Made to measure available on request",
  "Designed and made in Delhi",
  "Dry clean only",
]

export default function ProductDetailClient({ product }: { product: Product }) {
  const router = useRouter()
  const { addToCart } = useCart()

  const [index, setIndex] = useState(0)
  const [size, setSize] = useState<string | null>(product.sizes.length === 1 ? product.sizes[0] : null)
  const [qty, setQty] = useState(1)
  const [sizeError, setSizeError] = useState(false)
  const [added, setAdded] = useState(false)

  const category = product.category
  const classification = getClassification(product.classification)
  const collection = product.collection ? getCollection(product.collection) : undefined
  // Breadcrumb: Home / Menswear / Cocktail & Formalwear / Product
  const crumbs = [
    { href: `/${category}`, label: categoryMeta[category].title },
    ...(classification ? [{ href: `/${category}/${classification.slug}`, label: classification.title }] : []),
  ]
  const crumb = crumbs[crumbs.length - 1]

  // Gallery: cover first, then the rest in order, de-duplicated.
  const gallery = Array.from(new Set([product.coverImage, ...product.images]))
  const active = gallery[index] ?? gallery[0]
  const hasMany = gallery.length > 1
  const step = (delta: number) => setIndex((i) => (i + delta + gallery.length) % gallery.length)

  // Swipe on touch devices.
  const touchStartX = useRef<number | null>(null)
  const onTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(dx) > 40) step(dx < 0 ? 1 : -1)
  }

  const onGalleryKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); step(1) }
    if (e.key === "ArrowLeft") { e.preventDefault(); step(-1) }
  }

  const add = (thenGo?: "bag") => {
    if (!size) {
      setSizeError(true)
      document.getElementById("size-picker")?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }
    addToCart({ slug: product.slug, name: product.name, price: product.price, coverThumbnail: product.coverThumbnail, size, quantity: qty })
    if (thenGo === "bag") {
      router.push("/bag")
      return
    }
    setAdded(true)
    setTimeout(() => setAdded(false), 2000)
  }

  const wishlistItem = {
    slug: product.slug,
    name: product.name,
    price: product.price,
    coverThumbnail: product.coverThumbnail,
    coverImage: product.coverImage,
    sizes: product.sizes,
  }

  return (
    <div className="bg-white text-black">
      <section className="pb-20 pt-6 sm:pt-10 lg:pb-32 lg:pt-12">
        <div className="container-max">
          {/* Breadcrumb */}
          <nav aria-label="Breadcrumb" className="mb-6 font-jost text-xs uppercase tracking-[0.15em] text-black/50 lg:mb-10">
            <ol className="flex flex-wrap items-center gap-2">
              <li><Link href="/" className="hover:text-black">Home</Link></li>
              {crumbs.map((c) => (
                <li key={c.href} className="contents">
                  <span aria-hidden>/</span>
                  <Link href={c.href} className="hover:text-black">{c.label}</Link>
                </li>
              ))}
              <li aria-hidden>/</li>
              <li className="text-black" aria-current="page">{product.name}</li>
            </ol>
          </nav>

          <div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:gap-16">
            {/* Gallery */}
            <FadeIn className="lg:col-span-7">
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-[4.5rem_1fr]">
                {/* Thumbnails (left on desktop, below on phones) */}
                {gallery.length > 1 && (
                  <ul className="order-2 flex gap-2 overflow-x-auto sm:order-1 sm:flex-col sm:overflow-visible" aria-label="Product images">
                    {gallery.map((src, i) => {
                      const isActive = i === index
                      return (
                        <li key={src} className="shrink-0">
                          <button
                            type="button"
                            onClick={() => setIndex(i)}
                            aria-pressed={isActive}
                            aria-label={`View image ${i + 1}`}
                            className={`relative aspect-[3/4] w-16 overflow-hidden bg-stone-100 transition-opacity sm:w-full ${isActive ? "ring-1 ring-black" : "opacity-70 hover:opacity-100"}`}
                          >
                            <Image src={src} alt="" fill sizes="4.5rem" className="object-cover" />
                          </button>
                        </li>
                      )
                    })}
                  </ul>
                )}
                <div
                  className="group relative order-1 aspect-[3/4] overflow-hidden bg-stone-100 focus-visible:ring-black sm:order-2"
                  role={hasMany ? "region" : undefined}
                  aria-roledescription={hasMany ? "carousel" : undefined}
                  aria-label={hasMany ? `${product.name} images` : undefined}
                  tabIndex={hasMany ? 0 : undefined}
                  onKeyDown={hasMany ? onGalleryKey : undefined}
                  onTouchStart={hasMany ? onTouchStart : undefined}
                  onTouchEnd={hasMany ? onTouchEnd : undefined}
                >
                  <Image
                    key={active}
                    src={active}
                    alt={hasMany ? `${product.name}, image ${index + 1} of ${gallery.length}` : product.name}
                    fill
                    priority
                    sizes="(max-width: 1024px) 100vw, 55vw"
                    quality={90}
                    className="object-cover"
                  />
                  <WishlistButton item={wishlistItem} className="absolute right-3 top-3" />

                  {hasMany && (
                    <>
                      <button
                        type="button"
                        onClick={() => step(-1)}
                        aria-label="Previous image"
                        className="absolute left-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-black shadow-md backdrop-blur transition hover:bg-white focus-visible:ring-black sm:h-11 sm:w-11 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100"
                      >
                        <ChevronLeft className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                      </button>
                      <button
                        type="button"
                        onClick={() => step(1)}
                        aria-label="Next image"
                        className="absolute right-3 top-1/2 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-black shadow-md backdrop-blur transition hover:bg-white focus-visible:ring-black sm:h-11 sm:w-11 lg:opacity-0 lg:group-hover:opacity-100 lg:group-focus-within:opacity-100"
                      >
                        <ChevronRight className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                      </button>
                      <span
                        aria-live="polite"
                        className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-2.5 py-1 font-jost text-[11px] font-medium tabular-nums text-white"
                      >
                        {index + 1} / {gallery.length}
                      </span>
                    </>
                  )}
                </div>
              </div>
            </FadeIn>

            {/* Details */}
            <FadeIn delay={100} className="lg:col-span-5">
              <div className="lg:sticky lg:top-[calc(var(--nav-h)+2rem)]">
                <p className="font-jost text-xs font-semibold uppercase tracking-[0.25em] text-black/50">
                  {categoryMeta[category].title}
                  {classification && <> · {classification.title}</>}
                </p>
                <h1 className="mt-2 font-cinzel text-2xl font-bold uppercase tracking-[0.15em] sm:text-3xl">{product.name}</h1>
                <p className="mt-3 font-jost text-xl tabular-nums">{formatRupees(product.price)}</p>
                <p className="mt-1 font-jost text-xs text-black/50">Inclusive of all taxes. Complimentary shipping.</p>

                {product.description && <p className="mt-6 font-jost text-base leading-relaxed text-black/75">{product.description}</p>}

                {collection && (
                  <p className="mt-4 font-jost text-sm text-black/60">
                    From the{" "}
                    <Link href={`/collections/${collection.slug}`} className="underline underline-offset-4 hover:text-black">
                      {collection.name}
                    </Link>{" "}
                    collection.
                  </p>
                )}

                {/* Size */}
                <div id="size-picker" className="mt-8">
                  <div className="flex items-baseline justify-between gap-4">
                    <span className="font-jost text-xs font-semibold uppercase tracking-[0.15em] text-black/70">Size</span>
                    {sizeError ? (
                      <span role="alert" className="font-jost text-xs text-red-600">Please choose a size</span>
                    ) : (
                      <SizeGuide category={category} availableSizes={product.sizes} />
                    )}
                  </div>
                  <div role="radiogroup" aria-label="Size" className="mt-3 flex flex-wrap gap-2">
                    {product.sizes.map((s) => {
                      const on = s === size
                      return (
                        <button
                          key={s}
                          type="button"
                          role="radio"
                          aria-checked={on}
                          onClick={() => { setSize(s); setSizeError(false) }}
                          className={`h-11 min-w-[3rem] border px-4 font-jost text-sm font-semibold uppercase transition-colors focus-visible:ring-black ${
                            on ? "border-black bg-black text-white" : sizeError ? "border-red-400 text-black/70 hover:border-black" : "border-black/20 text-black/70 hover:border-black hover:text-black"
                          }`}
                        >
                          {s}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Quantity */}
                <div className="mt-6">
                  <span className="font-jost text-xs font-semibold uppercase tracking-[0.15em] text-black/70">Quantity</span>
                  <div className="mt-3 inline-flex items-center border border-black/20">
                    <button type="button" onClick={() => setQty((q) => Math.max(1, q - 1))} disabled={qty <= 1} aria-label="Decrease quantity" className="flex h-11 w-11 items-center justify-center transition-colors hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent">
                      <Minus className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                    </button>
                    <span aria-live="polite" className="w-10 text-center font-jost text-sm font-semibold tabular-nums">{qty}</span>
                    <button type="button" onClick={() => setQty((q) => Math.min(MAX_QTY, q + 1))} disabled={qty >= MAX_QTY} aria-label="Increase quantity" className="flex h-11 w-11 items-center justify-center transition-colors hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent">
                      <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                    </button>
                  </div>
                </div>

                {/* Actions */}
                <div className="mt-8 flex flex-col gap-3">
                  <button type="button" onClick={() => add()} className="btn-solid-dark w-full">
                    {added ? (
                      <span className="inline-flex items-center gap-2"><Check className="h-4 w-4" strokeWidth={2.5} aria-hidden /> Added to bag</span>
                    ) : (
                      "Add to bag"
                    )}
                  </button>
                  <button type="button" onClick={() => add("bag")} className="btn-outline-dark w-full">
                    Buy now
                  </button>
                </div>

                {/* Details */}
                <ul className="mt-10 space-y-2 border-t border-black/10 pt-6 font-jost text-sm text-black/70">
                  {DETAILS.map((d) => (
                    <li key={d} className="flex gap-3">
                      <span aria-hidden className="mt-[0.6em] h-1 w-1 shrink-0 rounded-full bg-black/60" />
                      {d}
                    </li>
                  ))}
                </ul>

                <p className="mt-6 font-jost text-sm text-black/60">
                  Questions about fit or customisation?{" "}
                  <Link href={`/contact?design=${product.slug}`} className="underline underline-offset-4 hover:text-black">
                    Get in touch
                  </Link>
                  .
                </p>

                <Link href={crumb.href} className="mt-8 inline-flex items-center gap-2 font-jost text-sm text-black/60 hover:text-black">
                  <ArrowLeft className="h-4 w-4" strokeWidth={1.5} aria-hidden /> Back to {crumb.label}
                </Link>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>
    </div>
  )
}
