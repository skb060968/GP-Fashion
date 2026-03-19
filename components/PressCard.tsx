import Image from "next/image"
import Link from "next/link"

interface PressCardProps {
  id: string
  publication: string
  title: string
  date: string
  excerpt: string
  image: string
}

export default function PressCard({
  id,
  publication,
  title,
  date,
  excerpt,
  image,
}: PressCardProps) {
  return (
    <article className="group card-base bg-stone-100 overflow-hidden">
      <div className="relative aspect-[16/9] overflow-hidden bg-stone-100">
      <Image
  src={image}
  alt={title}
  fill
  className="object-cover transition-transform duration-700 group-hover:scale-105"
  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
/>
      </div>
      
      <div className="p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-semibold text-fashion-gold uppercase tracking-wide">
            {publication}
          </span>
          <span className="text-xs text-gray-500">{date}</span>
        </div>
        
        <h3 className="font-serif text-xl font-bold text-fashion-black mb-3 group-hover:text-fashion-gold transition-colors">
          {title}
        </h3>
        
        <p className="text-sm text-gray-600 leading-relaxed mb-4">
          {excerpt}
        </p>
        
        {/* ✅ Link to dynamic press detail page */}
        <Link
          href={`/press/${id}`}
          className="inline-flex items-center text-sm font-medium text-fashion-black hover:text-fashion-gold transition-colors"
        >
          Read Article
          <svg
            className="w-4 h-4 ml-2 transition-transform group-hover:translate-x-1"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </Link>
      </div>
    </article>
  )
}