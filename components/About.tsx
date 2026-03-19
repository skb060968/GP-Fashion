import Link from "next/link"
import Image from "next/image"
import { content } from "@/lib/data"
import RevealWrapper from "@/components/RevealWrapper"

export default function AboutSection() {
  const { about } = content

  return (
    <section className="section-padding bg-stone-50">
      <div className="container-max">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          
          {/* Image */}
          <RevealWrapper>
            <div className="relative overflow-hidden rounded-lg shadow-sm group">
             <Image
  src="/images/about/piyush2.jpg"
  alt="Piyush Bholla"
  width={600}
  height={800}
  className="w-full h-96 lg:h-[480px] object-cover transition-transform duration-700 ease-out group-hover:scale-105"
  priority
/>

              <div className="absolute -bottom-6 -right-6 w-24 h-24 bg-fashion-gold rounded-full flex items-center justify-center shadow-md">
                <span className="text-white font-serif text-lg font-bold">
                  GP
                </span>
              </div>
            </div>
          </RevealWrapper>

          {/* Content */}
          <div className="bg-stone-100 rounded-xl p-8 lg:p-10 space-y-6">
            <div>
              <h2 className="font-serif text-3xl sm:text-4xl font-bold text-fashion-black mb-4">
                {about.heading}
              </h2>
              <div className="w-16 h-1 bg-fashion-gold" />
            </div>

            {/* Description */}
            <div className="space-y-4">
              <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
                {about.paragraph1}
              </p>
              <p className="text-gray-700 text-base sm:text-lg leading-relaxed">
                {about.paragraph2}
              </p>

              {/* Education one-liner */}
              <p className="text-sm sm:text-base text-gray-700 italic pt-2">
                Trained at National Institute of Fashion Technology (NIFT), Bengaluru
                &nbsp;and Fashion Institute of Technology (FIT), New York.
              </p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 gap-6 pt-4">
              <div>
                <h3 className="font-serif text-xl font-semibold text-fashion-black mb-1">
                  {about.stats.experience.label}
                </h3>
                <p className="text-gray-600">
                  {about.stats.experience.value}
                </p>
              </div>
              <div>
                <h3 className="font-serif text-xl font-semibold text-fashion-black mb-1">
                  {about.stats.projects.label}
                </h3>
                <p className="text-gray-600">
                  {about.stats.projects.value}
                </p>
              </div>
            </div>

            {/* CTA */}
            <div className="pt-6">
              <Link
                href="/about"
                className="inline-block btn-secondary"
              >
                Read Full Story →
              </Link>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}