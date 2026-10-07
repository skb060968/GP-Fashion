import FadeIn from "@/components/FadeIn"

interface PageHeadingProps {
  title: string

  meta?: string
  as?: "h1" | "h2"
}

export default function PageHeading({ title, meta, as: Tag = "h1" }: PageHeadingProps) {
  return (
    <FadeIn className="mx-auto max-w-3xl text-center">
      <Tag className="font-cinzel text-3xl font-bold uppercase tracking-[0.04em] sm:text-4xl lg:text-5xl">
        {title}
      </Tag>
      <span aria-hidden className="mx-auto mt-6 block h-px w-16 bg-black/30" />
      {meta && (
        <p className="mt-5 font-jost text-sm uppercase tracking-[0.2em] text-black/50">
          {meta}
        </p>
      )}
    </FadeIn>
  )
}
