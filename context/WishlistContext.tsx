"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { useUser } from "@/context/UserContext"
import { useAccountSync } from "@/lib/accountSync"

export type WishlistItem = {
  slug: string
  name: string
  price: number

  coverThumbnail: string

  coverImage?: string

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

const mergeWishlists = (server: WishlistItem[], local: WishlistItem[]) => {
  const out = [...server]
  const seen = new Set(server.map((i) => i.slug))
  for (const i of local) if (!seen.has(i.slug)) out.push(i)
  return out
}

export function WishlistProvider({ children }: { children: React.ReactNode }) {
  const { user, ready } = useUser()
  const [wishlist, setWishlist] = useState<WishlistItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setWishlist(JSON.parse(stored))
    } catch {

    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(wishlist))
  }, [wishlist, loaded])

  const replace = useCallback((items: WishlistItem[]) => setWishlist(items), [])
  const onSignedOut = useCallback(() => setWishlist([]), [])

  useAccountSync<WishlistItem>({
    user,
    ready,
    endpoint: "/api/account/wishlist",
    items: wishlist,
    loaded,
    merge: mergeWishlists,
    replace,
    onSignedOut,
  })

  const addToWishlist = (item: WishlistItem) =>
    setWishlist((prev) => (prev.some((i) => i.slug === item.slug) ? prev : [...prev, item]))

  const removeFromWishlist = (slug: string) => setWishlist((prev) => prev.filter((i) => i.slug !== slug))

  const toggleWishlist = (item: WishlistItem) =>
    setWishlist((prev) => (prev.some((i) => i.slug === item.slug) ? prev.filter((i) => i.slug !== item.slug) : [...prev, item]))

  const isWishlisted = (slug: string) => wishlist.some((i) => i.slug === slug)

  const clearWishlist = () => setWishlist([])

  return (
    <WishlistContext.Provider value={{ wishlist, addToWishlist, removeFromWishlist, toggleWishlist, isWishlisted, clearWishlist }}>
      {children}
    </WishlistContext.Provider>
  )
}

export const useWishlist = () => {
  const ctx = useContext(WishlistContext)
  if (!ctx) throw new Error("useWishlist must be used inside WishlistProvider")
  return ctx
}
