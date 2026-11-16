"use client"

import { useCallback, useEffect, useRef, useState } from "react"
import Image from "next/image"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Check, ChevronLeft, ChevronRight, Maximize2, Share2 } from "lucide-react"
import { formatRupees } from "@/lib/money"
import { useCart } from "@/context/CartContext"
import { categoryMeta, getClassification, getCollection, isNewProduct, type StoreProduct } from "@/lib/data/categories"
import NotifyMe from "@/components/product/NotifyMe"
import WishlistButton from "@/components/WishlistButton"
import SizeGuide from "@/components/SizeGuide"
import WhatsAppIcon from "@/components/WhatsAppIcon"
import FadeIn from "@/components/FadeIn"
import ProductCard from "@/components/ProductCard"
import ImageLightbox from "@/components/product/ImageLightbox"
import InfoSection from "@/components/product/InfoSection"
import StickyBuyBar from "@/components/product/StickyBuyBar"
import { whatsappHref } from "@/lib/whatsapp"
import { useUser } from "@/context/UserContext"
import MeasurementForm from "@/components/account/MeasurementForm"
import type { ProfileDTO } from "@/lib/measurements/profiles"
import { KINDS_FOR_CATEGORY, KIND_LABEL, MTM_LEAD_TIME, MTM_SIZE, fieldLabel, fieldsFor, formatInches } from "@/lib/measurements/fields"

function profileSummary(p: ProfileDTO) {
  const main = fieldsFor(p.kind)
    .filter((f) => f.required && f.key !== "height" && typeof p.values[f.key] === "number")
    .map((f) => `${fieldLabel(f, p.kind)} ${formatInches(p.values[f.key])}`)
  return `${KIND_LABEL[p.kind]} · ${main.join(" · ")}`
}

const FACT_KEY = /^[A-Za-z][A-Za-z &/()-]{0,39}$/

function splitDescription(description: string) {
  const prose: string[] = []
  const facts: { label: string; value: string }[] = []
  for (const raw of description.split("\n")) {
    const line = raw.trim()
    if (!line) continue
    const at = line.indexOf(": ")
    const label = at > 0 ? line.slice(0, at).trim() : ""
    const value = at > 0 ? line.slice(at + 2).trim() : ""
    if (label && value && FACT_KEY.test(label)) facts.push({ label, value })
    else prose.push(line)
  }
  return { prose: prose.join("\n"), facts }
}

type FitMode = "standard" | "mtm"

export default function ProductDetailClient({ product, related }: { product: StoreProduct; related: StoreProduct[] }) {
  const router = useRouter()
  const { addToCart } = useCart()
  const { user, ready } = useUser()

  const [index, setIndex] = useState(0)
  const [size, setSize] = useState<string | null>(product.sizes.length === 1 ? product.sizes[0] : null)
  const [colorSlug, setColorSlug] = useState<string | null>(product.defaultColor)
  const [sizeError, setSizeError] = useState(false)
  const [added, setAdded] = useState(false)
  const [lightbox, setLightbox] = useState<number | null>(null)
  const [shareMsg, setShareMsg] = useState("")
  const shareTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const buyRef = useRef<HTMLDivElement>(null)

  const soldOut = product.soldOut === true
  const mtmKinds = KINDS_FOR_CATEGORY[product.category]
  const mtmAvailable = !soldOut && mtmKinds.length > 0
  const [mode, setMode] = useState<FitMode>("standard")
  const [profiles, setProfiles] = useState<ProfileDTO[] | null>(null)
  const [profilesError, setProfilesError] = useState("")
  const [profileId, setProfileId] = useState<string | null>(null)
  const [addingProfile, setAddingProfile] = useState(false)

  const loadProfiles = useCallback(() => {
    setProfilesError("")
    fetch("/api/account/measurements", { credentials: "same-origin" })
      .then(async (r) => {
        const d = await r.json().catch(() => ({}))
        if (!r.ok) throw new Error(d.error || "Could not load your measurements")
        const list = (d.profiles as ProfileDTO[]).filter((p) => mtmKinds.includes(p.kind))
        setProfiles(list)
        setProfileId((cur) => (cur && list.some((p) => p.id === cur) ? cur : list.length === 1 ? list[0].id : null))
      })
      .catch((e) => setProfilesError(e.message))
  }, [mtmKinds])

  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    if (mtmAvailable && params.get("fit") === "mtm") setMode("mtm")
    const wanted = params.get("color")
    if (wanted && product.colors.some((c) => c.slug === wanted)) setColorSlug(wanted)
  }, [mtmAvailable, product.colors])

  useEffect(() => {
    if (mode === "mtm" && user && profiles === null) loadProfiles()
  }, [mode, user, profiles, loadProfiles])

  useEffect(() => () => {
    if (shareTimer.current) clearTimeout(shareTimer.current)
  }, [])

  const chosenProfile = profiles?.find((p) => p.id === profileId) ?? null

  const mtmRef = useRef<HTMLDivElement>(null)
  const chooseCustom = () => {
    setMode("mtm")
    setSizeError(false)
    requestAnimationFrame(() => mtmRef.current?.focus({ preventScroll: true }))
  }

  const activeColor = product.colors.find((c) => c.slug === colorSlug) ?? null
  const selectColor = (slug: string) => {
    setColorSlug(slug)
    setIndex(0)
  }

  const category = product.category
  const classification = getClassification(product.classification)
  const collection = product.collection ? getCollection(product.collection) : undefined
  const isNew = isNewProduct(product)
  const { prose, facts } = splitDescription(product.description)
  const care = product.care || "Dry clean only"

  const crumbs = [
    { href: `/${category}`, label: categoryMeta[category].title },
    ...(classification ? [{ href: `/${category}/${classification.slug}`, label: classification.title }] : []),
  ]

  const imageSource = activeColor ?? product
  const gallery = Array.from(new Set([imageSource.coverImage, ...imageSource.images]))
  const active = gallery[index] ?? gallery[0]
  const hasMany = gallery.length > 1
  const step = (delta: number) => setIndex((i) => (i + delta + gallery.length) % gallery.length)

  const touchStartX = useRef<number | null>(null)
  const swiped = useRef(false)
  const onTouchStart = (e: React.TouchEvent) => {
    swiped.current = false
    touchStartX.current = e.touches[0].clientX
  }
  const onTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return
    const dx = e.changedTouches[0].clientX - touchStartX.current
    touchStartX.current = null
    if (Math.abs(dx) > 40) {
      swiped.current = true
      step(dx < 0 ? 1 : -1)
    }
  }

  const onGalleryKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") { e.preventDefault(); step(1) }
    if (e.key === "ArrowLeft") { e.preventDefault(); step(-1) }
  }

  const onMainImageClick = () => {
    if (swiped.current) {
      swiped.current = false
      return
    }
    setLightbox(index)
  }

  const flashShare = (msg: string) => {
    setShareMsg(msg)
    if (shareTimer.current) clearTimeout(shareTimer.current)
    shareTimer.current = setTimeout(() => setShareMsg(""), 2500)
  }

  const share = async () => {
    const url = window.location.href
    if (typeof navigator.share === "function") {
      try {
        await navigator.share({ title: product.name, url })
        return
      } catch (e) {
        if (e instanceof DOMException && e.name === "AbortError") return
      }
    }
    try {
      await navigator.clipboard.writeText(url)
      flashShare("Link copied")
    } catch {
      flashShare("Could not copy the link")
    }
  }

  const add = (thenGo?: "bag") => {
    const isMtm = mode === "mtm"
    if (isMtm ? !chosenProfile : !size) {
      setSizeError(true)
      document.getElementById("size-picker")?.scrollIntoView({ behavior: "smooth", block: "center" })
      return
    }
    addToCart({
      slug: product.slug,
      name: product.name,
      price: product.price,
      coverThumbnail: activeColor ? activeColor.coverThumbnail : product.coverThumbnail,
      size: isMtm ? MTM_SIZE : size!,
      quantity: 1,
      color: activeColor ? activeColor.name : undefined,
      ...(isMtm && chosenProfile ? { profileId: chosenProfile.id, profileName: chosenProfile.name } : {}),
    })
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
    coverThumbnail: activeColor ? activeColor.coverThumbnail : product.coverThumbnail,
    coverImage: activeColor ? activeColor.coverImage : product.coverImage,
    sizes: product.sizes,
  }

  const breadcrumb = (className: string, withCurrent: boolean) => (
    <nav aria-label="Breadcrumb" className={`font-jost text-xs uppercase tracking-[0.15em] text-black/60 ${className}`}>
      <ol className={`flex items-center gap-2 ${withCurrent ? "flex-wrap" : "overflow-x-auto whitespace-nowrap [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"}`}>
        <li><Link href="/" className="hover:text-black">Home</Link></li>
        {crumbs.map((c) => (
          <li key={c.href} className="contents">
            <span aria-hidden>/</span>
            <Link href={c.href} className="hover:text-black">{c.label}</Link>
          </li>
        ))}
        {withCurrent && (
          <>
            <li aria-hidden>/</li>
            <li className="text-black" aria-current="page">{product.name}</li>
          </>
        )}
      </ol>
    </nav>
  )

  const roundButton =
    "flex h-10 w-10 items-center justify-center rounded-full bg-white/85 text-black shadow-md backdrop-blur transition hover:bg-white focus-visible:ring-black sm:h-11 sm:w-11"

  return (
    <div className={`bg-white text-black ${soldOut ? "" : "pb-[calc(6rem+env(safe-area-inset-bottom))] [@media(orientation:landscape)_and_(min-width:1024px)]:pb-0"}`}>
      <section className={`pt-4 sm:pt-6 ${related.length > 0 ? "pb-16 lg:pb-24" : "pb-20 lg:pb-32"}`}>
        <div className="container-max">

          {breadcrumb("mb-4 twocol:hidden", false)}

          <div className="grid grid-cols-1 gap-8 twocol:grid-cols-12 lg:gap-16">

            <div className="pdp-gallery twocol:col-span-5 twocol:self-start lg:col-span-7">
              <div className="mx-auto flex max-w-[calc(var(--pdp-img-h)*0.75)] flex-col gap-3 twocol:mx-0 twocol:max-w-none twocol:flex-row-reverse twocol:justify-center">
                <div className="min-w-0 twocol:w-[min(calc(100%-4.25rem),calc(var(--pdp-img-h)*0.75))] lg:w-[min(calc(100%-5.75rem),calc(var(--pdp-img-h)*0.75))]">
                  <div
                    className="group relative aspect-[3/4] w-full max-w-[calc(var(--pdp-img-h)*0.75)] overflow-hidden bg-stone-100 focus-visible:ring-black"
                    role={hasMany ? "region" : undefined}
                    aria-roledescription={hasMany ? "carousel" : undefined}
                    aria-label={hasMany ? `${product.name} images` : undefined}
                    tabIndex={hasMany ? 0 : undefined}
                    onKeyDown={hasMany ? onGalleryKey : undefined}
                    onTouchStart={hasMany ? onTouchStart : undefined}
                    onTouchEnd={hasMany ? onTouchEnd : undefined}
                  >
                    <div className="absolute inset-0 cursor-zoom-in" onClick={onMainImageClick}>
                      <Image
                        key={active}
                        src={active}
                        alt={hasMany ? `${product.name}, image ${index + 1} of ${gallery.length}` : product.name}
                        fill
                        priority
                        sizes="(orientation: landscape) 45vw, 100vw"
                        className="object-cover"
                      />
                    </div>
                    <WishlistButton item={wishlistItem} className="absolute right-3 top-3" />

                    <button
                      type="button"
                      onClick={() => setLightbox(index)}
                      aria-label="Zoom image"
                      className={`absolute bottom-3 right-3 ${roundButton}`}
                    >
                      <Maximize2 className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                    </button>

                    {hasMany && (
                      <>
                        <button
                          type="button"
                          onClick={() => step(-1)}
                          aria-label="Previous image"
                          className={`absolute left-3 top-1/2 -translate-y-1/2 ${roundButton}`}
                        >
                          <ChevronLeft className="h-5 w-5" strokeWidth={1.75} aria-hidden />
                        </button>
                        <button
                          type="button"
                          onClick={() => step(1)}
                          aria-label="Next image"
                          className={`absolute right-3 top-1/2 -translate-y-1/2 ${roundButton}`}
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

                {hasMany && (
                  <div className="relative shrink-0 twocol:w-14 twocol:self-stretch lg:w-20">
                    <ul
                      className="flex gap-2 overflow-x-auto [scrollbar-width:none] twocol:absolute twocol:inset-0 twocol:flex-col twocol:overflow-y-auto twocol:overflow-x-hidden [&::-webkit-scrollbar]:hidden"
                      aria-label="Product images"
                    >
                      {gallery.map((src, i) => {
                        const isActive = i === index
                        return (
                          <li key={src} className="shrink-0">
                            <button
                              type="button"
                              onClick={() => setIndex(i)}
                              aria-pressed={isActive}
                              aria-label={`View image ${i + 1}`}
                              className={`relative block aspect-[3/4] w-14 overflow-hidden bg-stone-100 transition-opacity focus-visible:ring-black twocol:w-full ${isActive ? "ring-1 ring-inset ring-black" : "opacity-70 hover:opacity-100"}`}
                            >
                              <Image src={src} alt="" fill sizes="5rem" className="object-cover" />
                            </button>
                          </li>
                        )
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </div>

            <FadeIn delay={100} className="twocol:col-span-7 lg:col-span-5">
              <div className="pdp-panel wide:-ml-1 wide:-mt-1 wide:max-h-[var(--pdp-img-h)] wide:overflow-y-auto wide:pb-1 wide:pl-1 wide:pr-4 wide:pt-1 wide:[scrollbar-width:thin]">
                {breadcrumb("mb-6 hidden twocol:block", true)}
                {soldOut ? (
                  <p className="mb-2 font-jost text-xs font-semibold uppercase tracking-[0.25em] text-black">Sold out</p>
                ) : (
                  isNew && <p className="mb-2 font-jost text-xs font-semibold uppercase tracking-[0.25em] text-black/70">New in</p>
                )}
                <div className="flex items-start justify-between gap-4">
                  <h1 className="font-cinzel text-2xl font-bold uppercase tracking-[0.04em] sm:text-3xl">{product.name}</h1>
                  <div className="relative shrink-0">
                    <button
                      type="button"
                      onClick={share}
                      aria-label="Share"
                      className="flex h-10 w-10 items-center justify-center rounded-full border border-black/15 text-black transition-colors hover:border-black focus-visible:ring-black"
                    >
                      <Share2 className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                    </button>
                    <span
                      role="status"
                      aria-live="polite"
                      className={
                        shareMsg
                          ? "absolute right-0 top-full z-10 mt-2 whitespace-nowrap rounded-md bg-black px-2.5 py-1 font-jost text-xs text-white"
                          : "sr-only"
                      }
                    >
                      {shareMsg}
                    </span>
                  </div>
                </div>
                <p className="mt-3 font-jost text-xl tabular-nums">{formatRupees(product.price)}</p>
                <p className="mt-1 font-jost text-xs text-black/60">Inclusive of all taxes. Complimentary shipping in India.</p>

                {product.colors.length > 1 && (
                  <div className="mt-8">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="font-jost text-xs font-semibold uppercase tracking-[0.15em] text-black/70">Colour</span>
                      {activeColor && <span className="font-jost text-xs text-black/60">{activeColor.name}</span>}
                    </div>
                    <div role="radiogroup" aria-label="Colour" className="mt-3 flex flex-wrap gap-2.5">
                      {product.colors.map((c) => {
                        const on = c.slug === colorSlug
                        return (
                          <button
                            key={c.slug}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            aria-label={c.name}
                            title={c.name}
                            onClick={() => selectColor(c.slug)}
                            className={`relative h-9 w-9 rounded-full border transition focus-visible:ring-black ${
                              on ? "border-black ring-1 ring-black ring-offset-2" : "border-black/20 hover:border-black/50"
                            }`}
                          >
                            <span className="absolute inset-[3px] rounded-full" style={{ backgroundColor: c.hex }} aria-hidden />
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {mtmAvailable && (
                  <div className="mt-8">
                    <span className="font-jost text-xs font-semibold uppercase tracking-[0.15em] text-black/70">Fit</span>
                    <div role="radiogroup" aria-label="Fit" className="mt-3 grid grid-cols-2 gap-2">
                      {([
                        ["standard", "Standard size", "Ships within 4 weeks"],
                        ["mtm", "Made to measure", `Same price · ${MTM_LEAD_TIME}`],
                      ] as const).map(([m, title, sub]) => {
                        const on = mode === m
                        return (
                          <button
                            key={m}
                            type="button"
                            role="radio"
                            aria-checked={on}
                            onClick={() => {
                              setMode(m)
                              setSizeError(false)
                            }}
                            className={`rounded-lg border px-4 py-3 text-left font-jost transition-colors focus-visible:ring-black ${on ? "border-black bg-black/[0.03]" : "border-black/15 hover:border-black"}`}
                          >
                            <span className="block text-sm font-semibold">{title}</span>
                            <span className="mt-0.5 block text-xs text-black/60">{sub}</span>
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}

                {soldOut ? null : mode === "mtm" ? (
                  <div id="size-picker" ref={mtmRef} tabIndex={-1} className="mt-6 focus:outline-none focus-visible:ring-0 focus-visible:ring-offset-0">
                    <div className="flex items-baseline justify-between gap-4">
                      <span className="font-jost text-xs font-semibold uppercase tracking-[0.15em] text-black/70">Measurements</span>
                      {sizeError && <span role="alert" className="font-jost text-xs text-red-600">Please choose whose measurements to use</span>}
                    </div>

                    {!ready ? (
                      <div className="mt-3 h-16 animate-pulse rounded-lg bg-stone-100" />
                    ) : !user ? (
                      <p className="mt-3 rounded-lg border border-black/10 p-4 font-jost text-sm text-black/70">
                        <Link href={`/login?next=${encodeURIComponent(`/shop/${product.slug}?fit=mtm${activeColor && product.colors.length > 1 ? `&color=${activeColor.slug}` : ""}`)}`} className="font-semibold text-black underline underline-offset-4">Sign in</Link>{" "}
                        to save your measurements and order made to measure.
                      </p>
                    ) : profilesError ? (
                      <p role="alert" className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 font-jost text-sm text-red-800">{profilesError}</p>
                    ) : profiles === null ? (
                      <div className="mt-3 h-16 animate-pulse rounded-lg bg-stone-100" />
                    ) : addingProfile ? (
                      <div className="mt-3">
                        <MeasurementForm
                          allowedKinds={mtmKinds}
                          onCancel={() => setAddingProfile(false)}
                          onSaved={(p) => {
                            setAddingProfile(false)
                            setProfiles((list) => [...(list ?? []), p])
                            setProfileId(p.id)
                            setSizeError(false)
                          }}
                        />
                      </div>
                    ) : (
                      <div className="mt-3 space-y-2">
                        {profiles.length > 0 && (
                          <div role="radiogroup" aria-label="Measurements" className="space-y-2">
                            {profiles.map((p) => {
                              const on = p.id === profileId
                              return (
                                <button
                                  key={p.id}
                                  type="button"
                                  role="radio"
                                  aria-checked={on}
                                  onClick={() => {
                                    setProfileId(p.id)
                                    setSizeError(false)
                                  }}
                                  className={`flex w-full items-center justify-between gap-4 rounded-lg border px-4 py-3 text-left font-jost transition-colors focus-visible:ring-black ${
                                    on ? "border-black bg-black/[0.03]" : sizeError ? "border-red-400" : "border-black/15 hover:border-black"
                                  }`}
                                >
                                  <span className="min-w-0">
                                    <span className="block text-sm font-semibold">{p.name}</span>
                                    <span className="mt-0.5 block truncate text-xs text-black/60">{profileSummary(p)}</span>
                                  </span>
                                  {on && <Check className="h-4 w-4 shrink-0" strokeWidth={2.5} aria-hidden />}
                                </button>
                              )
                            })}
                          </div>
                        )}
                        <div className="flex flex-wrap gap-x-4 gap-y-1 pt-1 font-jost text-xs">
                          <button type="button" onClick={() => setAddingProfile(true)} className="underline underline-offset-4 hover:text-black">
                            {profiles.length ? "Add new measurements" : "Add your measurements"}
                          </button>
                          {profiles.length > 0 && (
                            <Link href="/account/measurements" className="text-black/60 underline underline-offset-4 hover:text-black">
                              Edit saved measurements
                            </Link>
                          )}
                        </div>
                      </div>
                    )}

                    <p className="mt-4 font-jost text-xs leading-relaxed text-black/60">
                      Same price as standard sizes. Ready in {MTM_LEAD_TIME}. We confirm your measurements with you before cutting.
                      Made-to-measure pieces cannot be returned, exchanged or altered.
                    </p>
                  </div>
                ) : (
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
                    {mtmAvailable && (
                      <button
                        type="button"
                        onClick={chooseCustom}
                        aria-label="Custom, made to measure"
                        title="Made to measure"
                        className={`h-11 min-w-[3rem] border px-4 font-jost text-sm font-semibold uppercase transition-colors focus-visible:ring-black ${
                          sizeError ? "border-red-400 text-black/70 hover:border-black" : "border-black/20 text-black/70 hover:border-black hover:text-black"
                        }`}
                      >
                        Custom
                      </button>
                    )}
                  </div>
                </div>
                )}

                {soldOut ? (
                  <div className="mt-8 flex flex-col gap-5">
                    <button
                      type="button"
                      disabled
                      className="inline-flex w-full cursor-not-allowed items-center justify-center rounded-full border border-black/15 bg-stone-100 px-10 py-3.5 font-jost text-sm font-semibold uppercase tracking-[0.2em] text-black/55 sm:px-12 sm:py-4 sm:text-base"
                    >
                      Sold out
                    </button>
                    <NotifyMe slug={product.slug} />
                    {related.length > 0 && (
                      <a
                        href="#related-heading"
                        className="self-start font-jost text-xs font-semibold uppercase tracking-[0.15em] text-black/70 underline underline-offset-4 transition-colors hover:text-black"
                      >
                        Shop similar pieces
                      </a>
                    )}
                  </div>
                ) : (
                <div ref={buyRef} className="mt-8 flex flex-col gap-3">
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
                )}

                <div className="mt-10 border-y border-black/10">
                  {(prose || collection) && (
                    <InfoSection title="Description" defaultOpen>
                      {prose && <p className="whitespace-pre-line">{prose}</p>}
                      {collection && (
                        <p className={prose ? "mt-3" : undefined}>
                          From the{" "}
                          <Link href={`/collections/${collection.slug}`} className="underline underline-offset-4 hover:text-black">
                            {collection.name}
                          </Link>{" "}
                          collection.
                        </p>
                      )}
                    </InfoSection>
                  )}

                  <InfoSection title="Details and care">
                    <dl className="space-y-2.5">
                      {[...facts, { label: "Care", value: care }, { label: "Origin", value: "Designed and made in New Delhi, India" }].map((f) => (
                        <div key={f.label} className="grid grid-cols-[6.5rem_minmax(0,1fr)] gap-4">
                          <dt className="text-black/60">{f.label}</dt>
                          <dd>{f.value}</dd>
                        </div>
                      ))}
                    </dl>
                  </InfoSection>

                  <InfoSection title="Delivery and returns">
                    <ul className="space-y-2">
                      <li>
                        {mtmAvailable ? "Standard sizes are" : "This piece is"} dispatched within 4 weeks of payment verification.
                      </li>
                      {mtmAvailable && <li>Made to measure is dispatched within {MTM_LEAD_TIME} after we confirm your measurements.</li>}
                      <li>Shipping within India is complimentary and usually takes 2 to 7 working days after dispatch.</li>
                      <li>
                        Unworn ready-to-wear pieces with tags attached can be exchanged within 7 days of delivery. We do not give refunds, except for damaged or incorrect items.
                      </li>
                      {mtmAvailable && <li>Made-to-measure pieces cannot be returned or exchanged.</li>}
                      <li>We do not offer alterations on any order.</li>
                    </ul>
                    <Link href="/policies/shipping-returns" className="mt-4 inline-block underline underline-offset-4 hover:text-black">
                      Read the full Shipping &amp; Returns policy
                    </Link>
                  </InfoSection>

                  <InfoSection title="Need help?">
                    <p>
                      Questions about fit or customisation?{" "}
                      <a
                        href={whatsappHref(`Hello, I have a question about the ${product.name}.`)}
                        onClick={(e) => {
                          e.currentTarget.href = whatsappHref(`Hello, I have a question about the ${product.name} (${window.location.href}).`)
                        }}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 underline underline-offset-4 hover:text-black"
                      >
                        <WhatsAppIcon className="h-3.5 w-3.5" /> Chat on WhatsApp
                      </a>{" "}
                      or{" "}
                      <Link href={`/contact?design=${product.slug}`} className="underline underline-offset-4 hover:text-black">
                        write to us
                      </Link>
                      .
                    </p>
                  </InfoSection>
                </div>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="border-t border-black/10 pb-20 pt-16 sm:pt-20 lg:pb-32 lg:pt-24">
          <div className="container-max">
            <FadeIn className="text-center">
              <h2 id="related-heading" className="font-cinzel text-2xl font-bold uppercase tracking-[0.04em] sm:text-3xl">
                You may also like
              </h2>
              <span aria-hidden className="mx-auto mt-6 block h-px w-16 bg-black/30" />
            </FadeIn>
            <ul className="mt-12 grid grid-cols-2 gap-x-6 gap-y-12 lg:mt-14 lg:grid-cols-4 lg:gap-x-8">
              {related.map((p, i) => (
                <li key={p.slug}>
                  <FadeIn delay={(i % 4) * 60}>
                    <ProductCard product={p} />
                  </FadeIn>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {!soldOut && <StickyBuyBar name={product.name} price={product.price} added={added} onAdd={() => add()} targetRef={buyRef} />}

      {lightbox !== null && (
        <ImageLightbox images={gallery} startIndex={lightbox} alt={product.name} onClose={() => setLightbox(null)} />
      )}
    </div>
  )
}
