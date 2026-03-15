import Image from "next/image"
import type { Metadata } from "next"
import {
    Sparkles,
  GraduationCap,
} from "lucide-react"
import { content } from "@/lib/data"
import RevealWrapper from "@/components/RevealWrapper"

const SITE_URL = process.env.SITE_URL || "https://gpfashion.in"

export const metadata: Metadata = {
  title: "About | GP Fashion",
  description:
    "Learn about GP Fashion — where heritage meets innovation in premium designer wear.",
  openGraph: {
    title: "About | GP Fashion",
    description:
      "Learn about GP Fashion — where heritage meets innovation in premium designer wear.",
    url: `${SITE_URL}/about`,
    images: [{ url: `${SITE_URL}/images/about/piyush1.jpg` }],
  },
}


export default function AboutPage() {
  const { aboutPage, experience, skills } = content

  return (
    <div>
      {/* ================= HERO + PHILOSOPHY ================= */}
      <section className="section-padding bg-stone-50">
        <div className="container-max space-y-20">
          {/* HERO */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="font-serif text-4xl lg:text-6xl font-bold text-fashion-black mb-6">
                {aboutPage.heroTitle}
              </h1>
              <div className="w-20 h-1 bg-fashion-gold mb-6" />
              <p className="text-gray-800 text-lg leading-relaxed mb-6">
                {aboutPage.heroParagraph1}
              </p>
              <p className="text-gray-800 text-lg leading-relaxed">
                {aboutPage.heroParagraph2}
              </p>
            </div>

            <RevealWrapper>
              <div className="relative overflow-hidden rounded-lg shadow-sm hover:shadow-lg transition group">
                <Image
  src="/images/about/piyush1.jpg"
  alt="Piyush Bholla"
  width={600}
  height={800}
  className="w-full h-96 lg:h-[500px] object-cover transition-transform duration-700 ease-out group-hover:scale-105"
  
/>
              </div>
            </RevealWrapper>
          </div>

          {/* PHILOSOPHY - MERGED CONTENT */}
          <div className="max-w-4xl mx-auto text-center">
            <p className="text-sm font-medium tracking-wider uppercase text-fashion-gold mb-4">
              Where Heritage Meets Innovation
            </p>
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-fashion-black mb-8">
              {aboutPage.philosophyHeading}
            </h2>
            <blockquote className="text-xl lg:text-2xl text-gray-800 italic leading-relaxed mb-8">
              "{aboutPage.philosophyQuote}"
            </blockquote>
            <p className="text-gray-700 text-lg leading-relaxed mb-6">
              {aboutPage.philosophyDescription}
            </p>
            
          </div>
        </div>
      </section>

      {/* ================= JOURNEY + EDUCATION ================= */}
      <section className="py-12 bg-stone-50">
        <div className="container-max space-y-20">
          {/* JOURNEY */}
          <div>
            <h2 className="font-serif text-3xl lg:text-4xl font-bold text-fashion-black text-center mb-12">
              {aboutPage.journeyHeading}
            </h2>

            <div className="max-w-4xl mx-auto space-y-12">
              {experience.map((item, index) => (
                <RevealWrapper key={index} index={index}>
                  <div className="relative pl-12 min-h-[180px] bg-stone-100 p-6 rounded-xl shadow-sm">
                    {/* Golden dot marker aligned with year text */}
                    <span className="absolute left-[1.25rem] top-[1.78rem] w-4 h-4 bg-fashion-gold rounded-full"></span>

                    <div>
                      <span className="text-fashion-gold font-semibold text-base sm:text-lg">
                        {item.year}
                      </span>
                      <h3 className="font-serif text-lg sm:text-xl font-semibold text-fashion-black mt-1 mb-2">
                        {item.role}
                      </h3>
                      <p className="text-gray-700 font-medium mb-3 text-sm sm:text-base">
                        {item.company}
                      </p>
                      <p className="text-gray-800 leading-relaxed text-sm sm:text-base">
                        {item.description}
                      </p>
                    </div>
                  </div>
                </RevealWrapper>
              ))}
            </div>
          </div>

          {/* EDUCATION */}
          <div>
            <h3 className="font-serif text-2xl lg:text-3xl font-bold text-fashion-black text-center mb-10">
              Education & Qualifications
            </h3>

            <div className="max-w-3xl mx-auto space-y-8">
              <RevealWrapper>
                <div className="flex items-start gap-4 bg-stone-100 p-4 sm:p-6 rounded-xl shadow-sm">
                  <GraduationCap className="w-6 h-6 text-fashion-gold mt-1" />
                  <div>
                    <h4 className="font-serif text-lg sm:text-xl font-semibold text-fashion-black">
                      Bachelor's of Design (Fashion Design)
                    </h4>
                    <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                      National Institute of Fashion Technology (NIFT), Bengaluru
                    </p>
                  </div>
                </div>
              </RevealWrapper>

              <RevealWrapper index={1}>
                <div className="flex items-start gap-4 bg-stone-100 p-4 sm:p-6 rounded-xl shadow-sm">
                  <GraduationCap className="w-6 h-6 text-fashion-gold mt-1" />
                  <div>
                    <h4 className="font-serif text-lg sm:text-xl font-semibold text-fashion-black">
                      Associate of Applied Science (Fashion Design)
                    </h4>
                    <p className="text-gray-700 text-sm sm:text-base leading-relaxed">
                      Fashion Institute of Technology (FIT), New York
                    </p>
                  </div>
                </div>
              </RevealWrapper>
            </div>
          </div>
        </div>
      </section>

       {/* SKILLS */}

      <section className="py-20 bg-stone-50">
        <div className="container-max space-y-20">
          
      
          <div>
            <h3 className="font-serif text-3xl font-bold text-center mb-12 text-fashion-black">
              {aboutPage.skillsHeading}
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 items-stretch">
              {Object.entries(skills).map(([key, list], i) => (
                <RevealWrapper key={key} index={i}>
                  <div className="bg-stone-100 rounded-xl p-6 shadow-sm hover:shadow-lg transition h-full">
                    <h4 className="font-serif text-xl font-semibold mb-4 capitalize text-fashion-black">
                      {key}
                    </h4>
                    <ul className="space-y-2 text-gray-800">
                      {(list as string[]).map((skill, j) => (
                        <li key={j} className="flex items-center gap-2">
                          <Sparkles className="w-4 h-4 text-fashion-gold" />
                          {skill}
                        </li>
                      ))}
                    </ul>
                  </div>
                </RevealWrapper>
              ))}
            </div>
          </div>
        </div>

      </section>
    </div>
  )
}
