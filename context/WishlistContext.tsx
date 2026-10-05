"use client"

import { createContext, useContext, useEffect, useState } from "react"

export type WishlistItem = {
  slug: string
  name: string
  price: number
  coverThumbnail: string
  /** Available sizes, so the wishlist page can add straight to the bag. */
  sizes: string[]
}

type WishlistContextType = {
  wishlist: WishlistItem[]
  addToWishlist: (item: WishlistItem) => void
  removeFromWishlist: (slug: string) => void
  toggleWishlist: (item: WishlistItem) => void
  isWishlisted: (slug: string) => boolean
  clearWishlist: () => void
}

const STORAGE_KEY = "wishlist"
const WishlistContext = createContext<WishlistContextType | null>(null)

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setWishlist(JSON.parse(stored))
    } catch {
      /* ignore corrupt storage */
    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist))
  }, [wishlist, loaded])

  const addToWishlist = (item: WishlistItem) =>
    setWishlist((prev) => (prev.some((i) => i.slug === item.slug) ? prev : [...prev, item]))

  const removeFromWishlist = (slug: string) =>
    setWishlist((prev) => prev.filter((i) => i.slug !== slug))

  const toggleWishlist = (item: WishlistItem) =>
    setWishlist((prev) =>
      prev.some((i) => i.slug === item.slug)
        ? prev.filter((i) => i.slug !== item.slug)
        : [...prev, item]
    )

  const isWishlisted = (slug: string) => wishlist.some((i) => i.slug === slug)

  const clearWishlist = () => setWishlist([])

  return (
    <WishlistContext.Provider
      value={{ wishlist, addToWishlist, removeFromWishlist, toggleWishlist, isWishlisted, clearWishlist }}
    >
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider")
  return ctx
}
