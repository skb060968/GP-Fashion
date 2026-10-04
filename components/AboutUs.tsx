import Image from "next/image"
import FadeIn from "@/components/FadeIn"
import { aboutUs } from "@/lib/data/aboutUs"

/**
 * Homepage "About Us": brand story followed by the four brand values.
 * Anchored from the navbar menu via id="about-us".
 */
export default function AboutUs() {
  const { heading, paragraphs, founder, valuesHeading, values } = aboutUs

  return (
    <section
      id="about-us"
      aria-labelledby="about-us-heading"
      className="bg-white text-black"
    >
      {/* Hairline separating this section from the one above */}
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="section-divider" />
      </div>

      <div className="container-max py-20 sm:py-24 lg:py-32">
        {/* Brand story */}
        <FadeIn className="text-center">
          <h2
            id="about-us-heading"
            className="font-cinzel text-3xl font-bold uppercase tracking-[0.2em] sm:text-4xl lg:text-6xl lg:tracking-[0.25em] 2xl:text-7xl"
          >
            {heading}
          </h2>
          <span aria-hidden className="mx-auto mt-6 block h-px w-16 bg-black/30" />
        </FadeIn>

        <FadeIn delay={120} className="mx-auto mt-12 max-w-3xl lg:mt-16">
          <div className="space-y-6 text-center font-jost text-base leading-relaxed text-black/75 sm:text-lg lg:text-xl lg:leading-relaxed">
            {paragraphs.map((text, i) => (
              <p key={i} className={i === 0 ? "text-black" : undefined}>
                {text}
              </p>
            ))}
          </div>
        </FadeIn>

        {/* Founder */}
        <div className="mt-20 border-t border-black/10 pt-16 sm:mt-24 lg:mt-32 lg:pt-20">
          <div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-16">
            <FadeIn className="mx-auto w-full max-w-md lg:col-span-5 lg:max-w-none">
              <div className="relative aspect-square overflow-hidden bg-stone-100">
                <Image
                  src={founder.image}
                  alt={founder.imageAlt}
                  fill
                  sizes="(max-width: 1024px) 28rem, 40vw"
                  quality={85}
                  className="object-cover object-top"
                />
              </div>
            </FadeIn>

            <FadeIn delay={120} className="text-center lg:col-span-7 lg:text-left">
              <p className="font-jost text-xs font-semibold uppercase tracking-[0.3em] text-black/50">
                {founder.role}
              </p>
              <h3 className="mt-3 font-cinzel text-2xl font-bold uppercase tracking-[0.2em] sm:text-3xl lg:text-4xl lg:tracking-[0.25em]">
                {founder.name}
              </h3>
              <span aria-hidden className="mx-auto mt-6 block h-px w-16 bg-black/30 lg:mx-0" />
              <div className="mt-6 space-y-5 font-jost text-base leading-relaxed text-black/75 sm:text-lg">
                {founder.paragraphs.map((text, i) => (
                  <p key={i}>{text}</p>
                ))}
              </div>
            </FadeIn>
          </div>
        </div>

        {/* Values */}
        <div className="mt-20 border-t border-black/10 pt-16 sm:mt-24 lg:mt-32 lg:pt-20">
          <FadeIn className="text-center">
            <h3 className="font-cinzel text-2xl font-bold uppercase tracking-[0.2em] sm:text-3xl lg:text-4xl lg:tracking-[0.25em]">
              {valuesHeading}
            </h3>
            <span aria-hidden className="mx-auto mt-6 block h-px w-16 bg-black/30" />
          </FadeIn>

          <ul className="mt-14 grid grid-cols-1 gap-12 sm:grid-cols-2 lg:mt-20 lg:grid-cols-4 lg:gap-10">
            {values.map((value, i) => (
              <li key={value.title}>
                <FadeIn delay={i * 100} className="flex h-full flex-col">
                  <span
                    aria-hidden
                    className="font-jost text-xs font-semibold tracking-[0.3em] text-black/40"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h4 className="mt-4 font-cinzel text-lg font-bold uppercase tracking-[0.18em] sm:text-xl">
                    {value.title}
                  </h4>
                  <p className="mt-4 font-jost text-sm leading-relaxed text-black/70 sm:text-base">
                    {value.description}
                  </p>
                </FadeIn>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  )
}
