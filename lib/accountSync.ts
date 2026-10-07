"use client"

import { useEffect, useRef } from "react"
import type { User } from "@/context/UserContext"

export function useAccountSync<T>(opts: {
  user: User | null
  ready: boolean
  endpoint: string
  items: T[]
  loaded: boolean
  merge: (server: T[], local: T[]) => T[]
  replace: (items: T[]) => void
  onSignedOut: () => void
}) {
  const { user, ready, endpoint, items, loaded, merge, replace, onSignedOut } = opts
  const syncedFor = useRef<string | null>(null)
  const prevUserId = useRef<string | null>(null)
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latest = useRef(items)
  latest.current = items

  useEffect(() => {
    if (!ready || !loaded) return
    const uid = user?.id ?? null

    if (uid && syncedFor.current !== uid) {
      syncedFor.current = uid
      let cancelled = false
      fetch(endpoint, { credentials: "same-origin" })
        .then((r) => (r.ok ? r.json() : { items: [] }))
        .then(({ items: server }: { items: T[] }) => {
          if (cancelled) return
          const merged = merge(server ?? [], latest.current)
          replace(merged)
          return fetch(endpoint, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ items: merged }),
          })
        })
        .catch(() => {})
      prevUserId.current = uid
      return () => {
        cancelled = true
      }
    }

    if (!uid && prevUserId.current) {

      prevUserId.current = null
      syncedFor.current = null
      onSignedOut()
    }
  }, [ready, loaded, user?.id, endpoint, merge, replace, onSignedOut])

  useEffect(() => {
    if (!user || syncedFor.current !== user.id || !loaded) return
    if (pushTimer.current) clearTimeout(pushTimer.current)
    pushTimer.current = setTimeout(() => {
      fetch(endpoint, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items }),
        keepalive: true,
      }).catch(() => {})
    }, 400)
    return () => {
      if (pushTimer.current) clearTimeout(pushTimer.current)
    }
  }, [items, user, loaded, endpoint])
}
