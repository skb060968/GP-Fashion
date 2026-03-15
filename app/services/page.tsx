import type { Metadata } from "next"
import Link from "next/link"
import {
  Sparkles,
  Scissors,
  Ruler,
  Users,
  Briefcase,
  Leaf,
  ArrowRight,
} from "lucide-react"
import { content } from "@/lib/data"
import RevealWrapper from "@/components/RevealWrapper"

const SITE_URL = process.env.SITE_URL || "https://gpfashion.in"

export const metadata: Metadata = {
  title: "Services | GP Fashion",
  description:
    "Explore our design services — from creative and technical design to production, styling, and brand consulting.",
  openGraph: {
    title: "Services | GP Fashion",
    description:
      "Explore our design services — from creative and technical design to production, styling, and brand consulting.",
    url: `${SITE_URL}/services`,
    images: [{ url: `${SITE_URL}/images/hero/poster.jpg` }],
  },
}

const iconMap: { [key: string]: any } = {
  "Creative Design": Sparkles,
  "Technical Design": Ruler,
  "Production & Sourcing": Scissors,
  "Styling & Personal Services": Users,
  "Consulting & Brand Development": Briefcase,
  "Specialized Services": Leaf,
}

export default function ServicesPage() {
  const { services, servicesPage } = content

  return (
    <div className="bg-stone-50">
      {/* ================= HERO ================= */}
      <section className="section-padding">
        <div className="container-max text-center max-w-3xl">
          <h1 className="font-serif text-4xl lg:text-6xl font-bold text-gray-900 mb-6">
            {servicesPage.heroTitle}
          </h1>
          <p className="text-gray-800 text-lg">
            {servicesPage.heroDescription}
          </p>
          <div className="w-24 h-1 bg-fashion-gold mt-8 mx-auto" />
        </div>
      </section>

      {/* ================= SERVICES GRID ================= */}
      <section className="pb-24">
        <div className="container-max grid grid-cols-1 lg:grid-cols-2 gap-10">
          {services.map((service, index) => {
            const Icon = iconMap[service.title] || Sparkles
            return (
              <RevealWrapper key={service.slug} index={index}>
                <div
                  id={service.slug} // <-- anchor target for footer links
                  className="bg-stone-100 p-10 rounded-2xl space-y-6 hover:bg-stone-200 hover:shadow-xl transition"
                >
                  <div className="flex items-center">
                    <div className="w-12 h-12 bg-fashion-gold rounded-full flex items-center justify-center mr-4">
                      <Icon className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="font-serif text-2xl font-semibold text-gray-900">
                      {service.title}
                    </h3>
                  </div>

                  <p className="text-gray-800 leading-relaxed">
                    {service.description}
                  </p>

                  <ul className="space-y-2">
                    {service.features.map((feature, i) => (
                      <li
                        key={i}
                        className="flex items-center text-gray-700"
                      >
                        <Sparkles className="w-4 h-4 text-fashion-gold mr-2" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>
              </RevealWrapper>
            )
          })}
        </div>
      </section>

      {/* ================= PROCESS ================= */}
      <section className="pb-28">
        <div className="container-max text-center">
          <h2 className="font-serif text-3xl lg:text-4xl font-bold text-gray-900 mb-6">
            {servicesPage.processHeading}
          </h2>
          <p className="text-gray-800 max-w-2xl mx-auto mb-16">
            {servicesPage.processDescription}
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-8 items-stretch">
            {servicesPage.processSteps.map((step, i) => (
              <RevealWrapper key={i} index={i}>
                <div
                  className="bg-stone-100 rounded-xl p-6 shadow-sm
                    hover:shadow-xl hover:bg-stone-200 transition text-center h-full"
                >
                  <div className="w-12 h-12 bg-fashion-gold rounded-full flex items-center justify-center mx-auto mb-4">
                    <span className="text-white font-bold text-lg">
                      {i + 1}
                    </span>
                  </div>
                  <p className="font-semibold text-gray-900 leading-snug">
                    {step}
                  </p>
                </div>
              </RevealWrapper>
            ))}
          </div>
        </div>
      </section>

      {/* ================= CTA ================= */}
      <section className="pb-32">
        <div className="container-max text-center">
          <p className="text-gray-800 mb-8 text-lg">
            {servicesPage.ctaText}
          </p>

          <Link
            href="/contact"
            className="inline-flex items-center gap-2
              border-2 border-fashion-gold text-fashion-gold
              px-10 py-4 rounded-full font-semibold
              transition-all hover:bg-fashion-gold hover:text-white hover:shadow-xl"
          >
            {servicesPage.ctaButton}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </div>
  )
}