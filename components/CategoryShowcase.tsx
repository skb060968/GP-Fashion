import Image from "next/image"
import Link from "next/link"
import FadeIn from "@/components/FadeIn"

interface CategoryShowcaseProps {

  id: string
  title: string
  description: string

  image: string
  imageAlt: string
  ctaLabel?: string
  ctaHref?: string

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
      className="bg-white text-black"
    >

      <div className="px-4 sm:px-6 lg:px-8">
        <div className="section-divider" />
      </div>

      <div className="container-max pt-20 sm:pt-24 lg:pt-32">
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

      <FadeIn className="flex justify-center px-4 py-14 sm:py-16 lg:py-20">
        <Link href={ctaHref} className="btn-outline-dark">
          {ctaLabel}
        </Link>
      </FadeIn>
    </section>
  )
}
