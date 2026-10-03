import Image from "next/image"
import Link from "next/link"
import FadeIn from "@/components/FadeIn"

interface CategoryShowcaseProps {
  /** Anchor id so the navbar menu can jump here (e.g. "menswear"). */
  id: string
  title: string
  description: string
  /** Wide (16:9) editorial image. Shown uncropped on phones and tablets;
      on large screens it fills the viewport width and crops gently top/bottom. */
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
  description,
  image,
  imageAlt,
  ctaLabel = "Explore",
  ctaHref = "#",
  priority = false,
}: CategoryShowcaseProps) {
  return (
    <section
      id={id}
      aria-labelledby={`${id}-heading`}
      className="bg-white pt-20 text-black sm:pt-24 lg:pt-32"
    >
      {/* Header */}
      <div className="container-max">
        <FadeIn className="mx-auto flex max-w-3xl flex-col items-center text-center">
          <h2
            id={`${id}-heading`}
            className="font-cinzel text-3xl font-bold uppercase tracking-[0.2em] sm:text-4xl lg:text-6xl lg:tracking-[0.25em] 2xl:text-7xl"
          >
            {title}
          </h2>
          <span aria-hidden className="mt-6 h-px w-16 bg-black/30" />
          <p className="mt-6 max-w-xl font-jost text-base leading-relaxed text-black/70 sm:text-lg">
            {description}
          </p>
        </FadeIn>
      </div>

      {/* Full-bleed image */}
      <FadeIn delay={120} className="mt-10 sm:mt-12 lg:mt-16">
        <div className="relative aspect-video w-full overflow-hidden bg-stone-100 lg:aspect-auto lg:h-[85vh]">
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

      {/* Call to action, closing the section */}
      <FadeIn className="flex justify-center px-4 py-12 sm:py-14 lg:py-16">
        <Link
          href={ctaHref}
          className="group inline-flex items-center gap-3 font-jost text-sm font-semibold uppercase tracking-[0.2em] focus-visible:ring-black sm:text-base"
        >
          <span className="border-b border-black/40 pb-1 transition-colors group-hover:border-black">
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
    </section>
  )
}
