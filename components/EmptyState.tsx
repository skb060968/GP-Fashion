import Link from "next/link"
import type { LucideIcon } from "lucide-react"
import FadeIn from "@/components/FadeIn"

interface EmptyStateProps {
  icon: LucideIcon
  title: string
  description: string
  ctaLabel: string
  ctaHref: string
}

export default function EmptyState({ icon: Icon, title, description, ctaLabel, ctaHref }: EmptyStateProps) {
  return (
    <FadeIn className="mx-auto flex max-w-md flex-col items-center py-16 text-center sm:py-24">
      <span className="flex h-20 w-20 items-center justify-center rounded-full border border-black/15">
        <Icon className="h-8 w-8 text-black/60" strokeWidth={1.25} aria-hidden />
      </span>
      <h2 className="mt-8 font-cinzel text-xl font-bold uppercase tracking-[0.15em] sm:text-2xl">
        {title}
      </h2>
      <p className="mt-4 font-jost text-base leading-relaxed text-black/65 sm:text-lg">
        {description}
      </p>
      <Link href={ctaHref} className="btn-outline-dark mt-10">
        {ctaLabel}
      </Link>
    </FadeIn>
  )
}
