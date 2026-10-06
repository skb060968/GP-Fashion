"use client"

import { useEffect, useRef } from "react"
import type { User } from "@/context/UserContext"

/**
 * Keeps a client-side list (wishlist / bag) in step with the signed-in
 * customer's account.
 *
 *  - Guest: the list lives only in localStorage (handled by the caller).
 *  - On sign-in: fetch the server copy, merge it with whatever is in the
 *    browser, push the merged result back, and hand it to the caller.
 *  - While signed in: every change is PUT to the server, debounced.
 *  - On sign-out: the caller is told to clear the browser copy, so the next
 *    person on this device does not inherit the previous customer's items.
 *
 * The server is a mirror of the client; the client remains the source of
 * truth for immediate UI responsiveness.
 */
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
  const syncedFor = useRef<string | null>(null) // user id the list has been merged for
  const prevUserId = useRef<string | null>(null)
  const pushTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const latest = useRef(items)
  latest.current = items

  // Sign-in / sign-out transitions
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
      // Explicit sign-out (we had a user, now we don't).
      prevUserId.current = null
      syncedFor.current = null
      onSignedOut()
    }
  }, [ready, loaded, user?.id, endpoint, merge, replace, onSignedOut])

  // Push changes while signed in
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
