"use client"

import Image from "next/image"
import Link from "next/link"

interface JournalPost {
  slug: string
  title: string
  date: string
  category: string
  excerpt: string
  coverImage: string
  readTime: string
  content: string
}

export default function JournalDetailClient({ post }: { post: JournalPost }) {
  return (
    <main className="bg-stone-50">
      {/* Hero with contained width */}
      <section className="container-max pt-32 pb-12">
        <div className="rounded-xl overflow-hidden shadow bg-stone-100">
          <Image
            src={post.coverImage}
            alt={post.title}
            width={800}
            height={600}
            className="w-full h-auto object-cover"
          />
        </div>
        <h1 className="font-serif text-3xl md:text-4xl font-bold text-fashion-black mt-8">
          {post.title}
        </h1>
      </section>

      {/* Meta (simplified: category + date only) */}
      <section className="container-max pb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex gap-6 text-sm text-gray-600">
            <span className="font-semibold text-fashion-gold uppercase tracking-wide">
              {post.category}
            </span>
            <span>{post.date}</span>
          </div>
          <Link
            href="/journal"
            className="text-sm font-medium text-fashion-gold hover:underline"
          >
            ← Back to Journal
          </Link>
        </div>
      </section>

      {/* Content */}
      <section className="container-max pb-24">
        <article className="prose prose-lg max-w-none text-gray-800 leading-relaxed">
          {post.content.split("\n\n").map((para, i) => (
            <p key={i}>{para}</p>
          ))}
        </article>
      </section>
    </main>
  )
}
