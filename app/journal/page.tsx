import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import SectionHeading from "@/components/SectionHeading"
import RevealWrapper from "@/components/RevealWrapper"
import { content } from "@/lib/data"

const SITE_URL = process.env.SITE_URL || "https://gpfashion.in"

export const metadata: Metadata = {
  title: "Journal | GP Fashion",
  description:
    "Design insights, creative process, and inspiration from the GP Fashion studio.",
  openGraph: {
    title: "Journal | GP Fashion",
    description:
      "Design insights, creative process, and inspiration from the GP Fashion studio.",
    url: `${SITE_URL}/journal`,
    images: [{ url: `${SITE_URL}/images/hero/poster.jpg` }],
  },
}

export default function JournalPage() {
  const { journalPosts } = content

  return (
    <main>
      {/* Hero */}
      <section className="pt-32 pb-20 bg-stone-50">
        <div className="container-max">
          <SectionHeading
            as="h1"
            title="Journal"
            subtitle="Thoughts on design, process, and the creative journey. An intimate look behind the scenes of building a fashion brand."
          />
        </div>
      </section>

      {/* Posts Grid */}
      <section className="pb-24 bg-white">
        <div className="container-max">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
            {journalPosts.map((post, index) => (
              <RevealWrapper key={post.slug} index={index}>
                <article className="group card-base bg-stone-100 overflow-hidden">
                  <Link href={`/journal/${post.slug}`}>
                    <div className="relative aspect-[16/10] overflow-hidden bg-stone-100">
                     <Image
  src={post.coverImage}
  alt={post.title}
  fill
  className="object-cover transition-transform duration-700 group-hover:scale-105"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
/>
                    </div>

                    <div className="p-6">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-xs font-semibold text-fashion-gold uppercase tracking-wide">
                          {post.category}
                        </span>
                        <span className="text-xs text-gray-500">{post.readTime}</span>
                      </div>

                      <h2 className="font-serif text-2xl font-bold text-fashion-black mb-3 group-hover:text-fashion-gold transition-colors">
                        {post.title}
                      </h2>

                      <p className="text-sm text-gray-600 leading-relaxed mb-4">
                        {post.excerpt}
                      </p>

                      <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">{post.date}</span>
                        <span className="text-sm font-medium text-fashion-black group-hover:text-fashion-gold transition-colors">
                          Read More →
                        </span>
                      </div>
                    </div>
                  </Link>
                </article>
              </RevealWrapper>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
