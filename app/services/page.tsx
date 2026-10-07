import type { Metadata } from "next"
import Link from "next/link"
import {
  Shirt,
  Ruler,
  PenTool,
  Scissors,
  CalendarDays,
  Handshake,
  Sparkles,
  type LucideIcon,
} from "lucide-react"
import { content } from "@/lib/data"
import FadeIn from "@/components/FadeIn"

const SITE_URL = process.env.SITE_URL || "https://gpfashion.in"

const DESCRIPTION =
  "Ready-to-wear, made to measure, bespoke commissions, alterations and private appointments at the PIYUSH BHOLLA LABEL studio in Delhi."

export const metadata: Metadata = {
  title: "Services | Piyush Bholla",
  description: DESCRIPTION,
  openGraph: {
    title: "Services | Piyush Bholla",
    description: DESCRIPTION,
    url: `${SITE_URL}/services`,
    images: [{ url: `${SITE_URL}/images/hero/poster.jpg` }],
  },
}

const iconMap: Record<string, LucideIcon> = {
  "ready-to-wear": Shirt,
  "made-to-measure": Ruler,
  bespoke: PenTool,
  "alterations-aftercare": Scissors,
  appointments: CalendarDays,
  collaborations: Handshake,
}

export default function ServicesPage() {
  const { services, servicesPage } = content

  return (
    <div className="bg-white text-black">

      <section className="pb-20 pt-12 sm:pb-24 sm:pt-16 lg:pb-32 lg:pt-20">
        <div className="container-max">
          <FadeIn className="mx-auto mb-16 max-w-3xl text-center lg:mb-20">
            <h1 className="font-cinzel text-3xl font-bold uppercase tracking-[0.04em] sm:text-4xl lg:text-5xl">
              {servicesPage.heroTitle}
            </h1>
            <span aria-hidden className="mx-auto mt-6 block h-px w-16 bg-black/30" />
            <p className="mt-6 font-jost text-base leading-relaxed text-black/70 sm:text-lg">
              {servicesPage.heroDescription}
            </p>
          </FadeIn>

          <div className="grid grid-cols-1 gap-8 lg:grid-cols-2 lg:gap-10">
            {services.map((service, index) => {
              const Icon = iconMap[service.slug] || Sparkles
              return (
                <FadeIn key={service.slug} delay={(index % 2) * 100} className="h-full">
                  <article
                    id={service.slug}
                    className="card-elevated flex h-full flex-col p-8 lg:p-10"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-black">
                        <Icon className="h-5 w-5 text-white" strokeWidth={1.5} aria-hidden />
                      </div>
                      <h2 className="font-cinzel text-lg font-bold uppercase tracking-[0.12em] sm:text-xl">
                        {service.title}
                      </h2>
                    </div>

                    <p className="mt-6 font-jost text-base leading-relaxed text-black/75">
                      {service.description}
                    </p>

                    <ul className="mt-6 space-y-2.5">
                      {service.features.map((feature) => (
                        <li
                          key={feature}
                          className="flex items-start gap-3 font-jost text-sm text-black/70 sm:text-base"
                        >
                          <span
                            aria-hidden
                            className="mt-[0.6em] h-1.5 w-1.5 shrink-0 rounded-full bg-black"
                          />
                          {feature}
                        </li>
                      ))}
                    </ul>
                  </article>
                </FadeIn>
              )
            })}
          </div>
        </div>
      </section>

      <section>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="section-divider" />
        </div>

        <div className="container-max section-padding text-center">
          <FadeIn className="mx-auto max-w-2xl">
            <h2 className="font-cinzel text-2xl font-bold uppercase tracking-[0.04em] sm:text-3xl lg:text-3xl">
              {servicesPage.processHeading}
            </h2>
            <span aria-hidden className="mx-auto mt-6 block h-px w-16 bg-black/30" />
            <p className="mt-6 font-jost text-base leading-relaxed text-black/70 sm:text-lg">
              {servicesPage.processDescription}
            </p>
          </FadeIn>

          <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-16 lg:grid-cols-5 lg:gap-8">
            {servicesPage.processSteps.map((step, i) => (
              <FadeIn key={step} delay={i * 80} className="h-full">
                <div className="card-elevated flex h-full flex-col items-center p-6 text-center">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-black">
                    <span className="font-cinzel text-base font-bold text-white">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                  </div>
                  <p className="mt-4 font-jost text-sm font-semibold leading-snug sm:text-base">
                    {step}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>

          <FadeIn className="mt-16 lg:mt-20">
            <p className="mx-auto max-w-2xl font-jost text-base text-black/75 sm:text-lg">
              {servicesPage.ctaText}
            </p>
            <Link href="/contact" className="btn-outline-dark mt-8">
              {servicesPage.ctaButton}
            </Link>
          </FadeIn>
        </div>
      </section>
    </div>
  )
}
