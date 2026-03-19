import Link from "next/link"
import Image from "next/image"
import RevealWrapper from "./RevealWrapper"
import GoldCornerFrame from "./GoldCornerFrame"

interface CollectionCardProps {
  slug: string
  name: string
  season: string
  description: string
  coverImage: string
  mood: string
  index?: number
}

export default function CollectionCard({
  slug,
  name,
  season,
  description,
  coverImage,
  mood,
  index = 0,
}: CollectionCardProps) {
  return (
    <RevealWrapper index={index}>
      <Link href={`/collections/${slug}`} className="group block">
        {/* Premium Frame Container */}
        <GoldCornerFrame className="shadow-xl transition-all duration-700 ease-out group-hover:shadow-2xl">
          {/* Inner frame with image */}
          <div className="relative overflow-hidden rounded-2xl ring-1 ring-stone-200 shadow-lg">
            {/* Image */}
            <div className="relative aspect-[4/5] overflow-hidden">
              <Image
  src={coverImage}
  alt={name}
  fill
  className="object-cover transition-transform duration-700 ease-out group-hover:scale-105"
  sizes="(max-width: 768px) 100vw, 50vw"
/>
              
              {/* Gradient overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-60 group-hover:opacity-80 transition-opacity duration-500" />
              
              {/* Content overlay */}
              <div className="absolute inset-0 flex flex-col justify-end p-8 text-white">
                <p className="text-sm font-medium tracking-wider uppercase mb-2 opacity-90">
                  {season}
                </p>
                <h3 className="font-serif text-3xl lg:text-4xl font-bold mb-3">
                  {name}
                </h3>
                <p className="text-sm text-gray-200 mb-4 line-clamp-2">
                  {description}
                </p>
                <p className="text-xs tracking-wide uppercase text-fashion-gold">
                  {mood}
                </p>
              </div>
            </div>

            {/* Hover CTA */}
            <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-500">
              <span className="px-8 py-3 bg-white text-fashion-black font-medium rounded-full shadow-lg transform translate-y-4 group-hover:translate-y-0 transition-transform duration-500">
                Explore Collection
              </span>
            </div>
          </div>
        </GoldCornerFrame>
      </Link>
    </RevealWrapper>
  )
}
