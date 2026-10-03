import Image from "next/image"
import Link from "next/link"

interface CategoryShowcaseProps {
  /** Anchor id so the navbar menu can jump here (e.g. "menswear"). */
  id: string
  title: string
  /** Wide image with the model centred and generous empty space either side.
      It is rendered full-bleed with object-cover, so phones simply clip the
      sides while large screens show the whole frame. */
  image: string
  imageAlt: string
  ctaLabel?: string
  ctaHref?: string
  /** Load eagerly for sections near the top of the page. */
  priority?: boolean
}

export default function CategoryShowcase({
  id,
  title,
  image,
  imageAlt,
  ctaLabel = "Discover",
  ctaHref = "#",
  priority = false,
}: CategoryShowcaseProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="relative h-[85svh] min-h-[520px] w-full overflow-hidden bg-stone-100 lg:h-screen"
    >
      {/* Full-bleed image, always anchored to the centre so the model stays
          in frame at every aspect ratio. */}
      <Image
        src={image}
        alt={imageAlt}
        fill
        priority={priority}
        sizes="100vw"
        quality={85}
        className="object-cover object-center"
      />

      {/* Soft gradient so the caption reads over any image without hiding the model. */}
      <div
        aria-hidden
        className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-black/60 via-black/20 to-transparent"
      />

      {/* Caption */}
      <div className="absolute inset-x-0 bottom-0 flex flex-col items-center px-4 pb-10 text-center text-white sm:pb-14 lg:pb-20">
        <h2
          id={`${id}-heading`}
          className="font-cinzel text-3xl font-bold uppercase tracking-[0.2em] drop-shadow-md sm:text-4xl lg:text-6xl lg:tracking-[0.25em] 2xl:text-7xl"
        >
          {title}
        </h2>
        <Link
          href={ctaHref}
          className="group mt-5 inline-flex items-center gap-3 font-jost text-sm font-semibold uppercase tracking-[0.2em] focus-visible:ring-white sm:mt-6 sm:text-base lg:mt-8 lg:text-lg"
        >
          <span className="border-b border-white/70 pb-1 transition-colors group-hover:border-white">
            {ctaLabel}
          </span>
          <span
            aria-hidden
            className="inline-block transition-transform duration-300 group-hover:translate-x-1"
          >
            →
          </span>
        </Link>
      </div>
    </section>
  )
}
