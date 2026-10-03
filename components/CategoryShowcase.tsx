import Image from "next/image"
import Link from "next/link"
import FadeIn from "@/components/FadeIn"

interface CategoryShowcaseProps {
  /** Anchor id so the navbar menu can jump here (e.g. "menswear"). */
  id: string
  /** Small index label shown above the title, e.g. "01". */
  index: string
  title: string
  description: string
  /** Wide image with the model centred and generous empty space either side.
      It is rendered full-bleed with object-cover, so phones simply clip the
      sides while large screens show the whole frame. */
  image: string
  imageAlt: string
  ctaLabel?: string
  ctaHref?: string
  /** Load eagerly for sections near the top of the page. */
  priority?: boolean
  /** Alternate the band colour so consecutive sections read as separate blocks. */
  tone?: "light" | "dark"
}

export default function CategoryShowcase({
  id,
  index,
  title,
  description,
  image,
  imageAlt,
  ctaLabel = "Discover the collection",
  ctaHref = "#",
  priority = false,
  tone = "light",
}: CategoryShowcaseProps) {
  const dark = tone === "dark"

  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className={`${dark ? "bg-black text-white" : "bg-white text-black"} pt-20 sm:pt-24 lg:pt-32`}
    >
      {/* Header band */}
      <div className="container-max">
        <FadeIn className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <span
            className={`font-jost text-xs font-semibold uppercase tracking-[0.3em] ${
              dark ? "text-white/60" : "text-black/50"
            }`}
          >
            {index} &mdash; Collection
          </span>
          <h2
            id={`${id}-heading`}
            className="mt-4 font-cinzel text-3xl font-bold uppercase tracking-[0.2em] sm:text-4xl lg:text-6xl lg:tracking-[0.25em] 2xl:text-7xl"
          >
            {title}
          </h2>
          <span
            aria-hidden
            className={`mt-6 h-px w-16 ${dark ? "bg-white/40" : "bg-black/30"}`}
          />
          <p
            className={`mt-6 max-w-xl font-jost text-base leading-relaxed sm:text-lg ${
              dark ? "text-white/75" : "text-black/70"
            }`}
          >
            {description}
          </p>
          <Link
            href={ctaHref}
            className={`group mt-8 inline-flex items-center gap-3 font-jost text-sm font-semibold uppercase tracking-[0.2em] sm:text-base ${
              dark ? "focus-visible:ring-white" : "focus-visible:ring-black"
            }`}
          >
            <span
              className={`border-b pb-1 transition-colors ${
                dark
                  ? "border-white/50 group-hover:border-white"
                  : "border-black/40 group-hover:border-black"
              }`}
            >
              {ctaLabel}
            </span>
            <span
              aria-hidden
              className="inline-block transition-transform duration-300 group-hover:translate-x-1"
            >
              →
            </span>
          </Link>
        </FadeIn>
      </div>

      {/* Full-bleed image */}
      <FadeIn delay={120} className="mt-12 sm:mt-16 lg:mt-20">
        <div className="relative h-[70svh] min-h-[440px] w-full overflow-hidden bg-stone-100 lg:h-[85vh]">
          <Image
            src={image}
            alt={imageAlt}
            fill
            priority={priority}
            sizes="100vw"
            quality={85}
            className="object-cover object-center"
          />
        </div>
      </FadeIn>
    </section>
  )
}
