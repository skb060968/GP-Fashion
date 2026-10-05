"use client"

import { Heart } from "lucide-react"
import { useWishlist, type WishlistItem } from "@/context/WishlistContext"

interface WishlistButtonProps {
  item: WishlistItem
  /** "overlay" sits on an image corner; "inline" sits next to text. */
  variant?: "overlay" | "inline"
  className?: string
}

/** Heart toggle for saving a product to the wishlist. */
export default function WishlistButton({ item, variant = "overlay", className = "" }: WishlistButtonProps) {
  const { isWishlisted, toggleWishlist } = useWishlist()
  const active = isWishlisted(item.slug)

  const base =
    variant === "overlay"
      ? "flex h-9 w-9 items-center justify-center rounded-full bg-white/90 shadow-sm hover:bg-white"
      : "flex h-11 w-11 items-center justify-center rounded-full border border-black/20 hover:border-black"

  return (
    <button
      type="button"
      onClick={(e) => {
        e.preventDefault()
        e.stopPropagation()
        toggleWishlist(item)
      }}
      aria-pressed={active}
      aria-label={active ? `Remove ${item.name} from wishlist` : `Add ${item.name} to wishlist`}
      className={`${base} text-black transition-colors focus-visible:ring-black ${className}`}
    >
      <Heart
        className={`h-[18px] w-[18px] transition-transform duration-200 ${active ? "scale-110" : ""}`}
        strokeWidth={1.5}
        fill={active ? "currentColor" : "none"}
        aria-hidden
      />
    </button>
  )
}
