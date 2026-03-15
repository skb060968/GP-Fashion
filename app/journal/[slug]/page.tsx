import { notFound } from "next/navigation"
import type { Metadata } from "next"
import { journalPosts } from "@/lib/data/journal"
import JournalDetailClient from "./JournalDetailClient"

const SITE_URL = process.env.SITE_URL || "https://gpfashion.in"

type Props = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = journalPosts.find((p) => p.slug === slug)
  if (!post) return {}

  const title = `${post.title} | GP Fashion`
  const description = post.excerpt
  const imageUrl = `${SITE_URL}${post.coverImage}`
  const pageUrl = `${SITE_URL}/journal/${post.slug}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      url: pageUrl,
      images: [{ url: imageUrl }],
    },
  }
}

export default async function JournalDetailPage({ params }: Props) {
  const { slug } = await params
  const post = journalPosts.find((p) => p.slug === slug)

  if (!post) {
    return notFound()
  }

  return <JournalDetailClient post={post} />
}
