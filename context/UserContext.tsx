"use client"

import { createContext, useCallback, useContext, useEffect, useState } from "react"

export type User = { id: string; email: string; name: string | null; phone: string | null }

type UserContextType = {
  user: User | null
  /** False until the first /api/account/me check completes. */
  ready: boolean
  refresh: () => Promise<void>
  setUser: (u: User | null) => void
  signOut: () => Promise<void>
}

const UserContext = createContext<UserContextType | null>(null)

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [ready, setReady] = useState(false)

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/account/me", { credentials: "same-origin" })
      const data = await res.json()
      setUser(data.user ?? null)
    } catch {
      setUser(null)
    } finally {
      setReady(true)
    }
  }, [])

  useEffect(() => {
    refresh()
  }, [refresh])

  const signOut = useCallback(async () => {
    await fetch("/api/auth/logout", { method: "POST" }).catch(() => {})
    setUser(null)
  }, [])

  return <UserContext.Provider value={{ user, ready, refresh, setUser, signOut }}>{children}</UserContext.Provider>
}

export const useUser = () => {
  const ctx = useContext(UserContext)
  if (!ctx) throw new Error("useUser must be used inside UserProvider")
  return ctx
}
