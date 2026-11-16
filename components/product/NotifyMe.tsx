"use client"

import { useEffect, useId, useState } from "react"
import Link from "next/link"
import { Check } from "lucide-react"
import { useUser } from "@/context/UserContext"

const STORAGE_KEY = "restock-requests"

function savedRequests(): Record<string, string> {
  try {
    const raw = JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}")
    return raw && typeof raw === "object" && !Array.isArray(raw) ? raw : {}
  } catch {
    return {}
  }
}

export default function NotifyMe({ slug, compact = false }: { slug: string; compact?: boolean }) {
  const { user } = useUser()
  const inputId = useId()
  const [open, setOpen] = useState(!compact)
  const [email, setEmail] = useState("")
  const [state, setState] = useState<"idle" | "sending" | "error">("idle")
  const [error, setError] = useState("")
  const [doneFor, setDoneFor] = useState<string | null>(null)

  useEffect(() => {
    setDoneFor(savedRequests()[slug] ?? null)
  }, [slug])

  useEffect(() => {
    if (user?.email) setEmail((current) => current || user.email)
  }, [user?.email])

  const submit = async (e: React.FormEvent) => {
    e.preventDefault()
    setState("sending")
    setError("")
    try {
      const res = await fetch("/api/restock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ slug, email }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) throw new Error(data.error || "Could not save your request. Please try again.")
      const saved = savedRequests()
      saved[slug] = email.trim().toLowerCase()
      localStorage.setItem(STORAGE_KEY, JSON.stringify(saved))
      setDoneFor(saved[slug])
      setState("idle")
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not save your request. Please try again.")
      setState("error")
    }
  }

  if (doneFor) {
    return (
      <p role="status" className={`flex items-start gap-2 font-jost text-black/75 ${compact ? "text-xs" : "text-sm"}`}>
        <Check className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
        <span>We will email {doneFor} once when it is back.</span>
      </p>
    )
  }

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="btn-outline-dark w-full !px-4 !py-3 !text-xs sm:!text-sm"
      >
        Notify me when it&apos;s back
      </button>
    )
  }

  return (
    <form onSubmit={submit} className="font-jost" noValidate>
      <label htmlFor={inputId} className={`block font-semibold uppercase tracking-[0.15em] text-black/70 ${compact ? "text-[11px]" : "text-xs"}`}>
        Notify me when it&apos;s back
      </label>
      <div className={`mt-2 flex gap-2 ${compact ? "flex-col" : "flex-col sm:flex-row"}`}>
        <input
          id={inputId}
          type="email"
          inputMode="email"
          autoComplete="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          placeholder="Your email"
          aria-invalid={state === "error" || undefined}
          className={`h-11 w-full min-w-0 shrink-0 rounded-full border border-black/20 bg-white px-4 text-sm text-black placeholder:text-black/40 focus:border-black focus:outline-none focus:ring-1 focus:ring-black ${compact ? "" : "sm:w-auto sm:flex-1"}`}
        />
        <button
          type="submit"
          disabled={state === "sending" || !email.trim()}
          className="btn-solid-dark shrink-0 !px-6 !py-3 !text-xs disabled:cursor-not-allowed disabled:opacity-40 sm:!text-sm"
        >
          {state === "sending" ? "Saving…" : "Notify me"}
        </button>
      </div>
      {error && <p role="alert" className="mt-2 text-xs text-red-700">{error}</p>}
      <p className="mt-2 text-xs leading-relaxed text-black/60">
        One email when it is back, then we delete your request.{" "}
        <Link href="/policies/privacy" className="underline underline-offset-4 hover:text-black">Privacy</Link>
      </p>
    </form>
  )
}
