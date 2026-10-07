"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"
import { useUser } from "@/context/UserContext"
import { useAccountSync } from "@/lib/accountSync"

export type CartItem = {
  slug: string
  name: string
  price: number
  coverThumbnail: string
  size: string
  quantity: number
}

type CartContextType = {
  cart: CartItem[]
  addToCart: (item: CartItem) => void
  removeFromCart: (slug: string, size: string) => void
  updateQuantity: (slug: string, size: string, qty: number) => void
  clearCart: () => void
}

const STORAGE_KEY = "cart"
const MAX_QTY = 10
const CartContext = createContext<CartContextType | null>(null)

const key = (i: Pick<CartItem, "slug" | "size">) => `${i.slug}|${i.size}`

const mergeCarts = (server: CartItem[], local: CartItem[]) => {
  const map = new Map<string, CartItem>()
  for (const i of server) map.set(key(i), { ...i })
  for (const i of local) {
    const k = key(i)
    const prev = map.get(k)
    map.set(k, prev ? { ...prev, quantity: Math.min(MAX_QTY, prev.quantity + i.quantity) } : { ...i })
  }
  return [...map.values()]
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, ready } = useUser()
  const [cart, setCart] = useState<CartItem[]>([])
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) setCart(JSON.parse(stored))
    } catch {

    }
    setLoaded(true)
  }, [])

  useEffect(() => {
    if (loaded) localStorage.setItem(STORAGE_KEY, JSON.stringify(cart))
  }, [cart, loaded])

  const replace = useCallback((items: CartItem[]) => setCart(items), [])
  const onSignedOut = useCallback(() => setCart([]), [])

  useAccountSync<CartItem>({
    user,
    ready,
    endpoint: "/api/account/bag",
    items: cart,
    loaded,
    merge: mergeCarts,
    replace,
    onSignedOut,
  })

  const addToCart = (item: CartItem) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.slug === item.slug && i.size === item.size)
      if (existing) {
        return prev.map((i) =>
          i.slug === item.slug && i.size === item.size ? { ...i, quantity: Math.min(MAX_QTY, i.quantity + (item.quantity || 1)) } : i
        )
      }
      return [...prev, { ...item, quantity: Math.min(MAX_QTY, item.quantity || 1) }]
    })
  }

  const removeFromCart = (slug: string, size: string) => setCart((prev) => prev.filter((i) => !(i.slug === slug && i.size === size)))

  const updateQuantity = (slug: string, size: string, qty: number) => {
    const q = Math.max(1, Math.min(MAX_QTY, Math.floor(qty) || 1))
    setCart((prev) => prev.map((i) => (i.slug === slug && i.size === size ? { ...i, quantity: q } : i)))
  }

  const clearCart = () => setCart([])

  return <CartContext.Provider value={{ cart, addToCart, removeFromCart, updateQuantity, clearCart }}>{children}</CartContext.Provider>
}

export const useCart = () => {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error("useCart must be used inside CartProvider")
  return ctx
}
