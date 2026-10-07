"use client"

import { Suspense, useEffect, useState } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle } from "lucide-react"
import Field from "@/components/checkout/Field"

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get("next")
  const expired = params.get("expired") === "1"
  const target = next && next.startsWith("/admin") ? next : "/admin"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    fetch("/api/admin/session")
      .then((r) => r.json())
      .then((d) => (d.authenticated ? router.replace(target) : setChecking(false)))
      .catch(() => setChecking(false))
  }, [router, target])

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setLoading(true)
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || "Incorrect email or password.")
        setLoading(false)
        return
      }
      router.replace(target)
    } catch {
      setError("Something went wrong. Please try again.")
      setLoading(false)
    }
  }

  if (checking) return null

  return (
    <form onSubmit={handleLogin} noValidate className="card-elevated w-full max-w-sm bg-white p-8">
      <div className="flex flex-col items-center text-center">
        <Image src="/images/brand/logo-mark.png" alt="" width={213} height={320} priority className="h-12 w-auto" />
        <span className="mt-2 font-cinzel text-sm font-bold uppercase tracking-[0.04em]">Piyush Bholla</span>
        <span className="mt-1 font-jost text-[11px] uppercase tracking-[0.2em] text-black/50">Admin</span>
      </div>

      {expired && !error && (
        <p className="mt-6 rounded-md border border-black/10 bg-stone-50 p-3 font-jost text-sm text-black/70">
          Your session has expired. Please sign in again.
        </p>
      )}

      <div className="mt-8 space-y-5">
        <Field
          label="Email"
          name="email"
          type="email"
          autoComplete="username"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <Field
          label="Password"
          name="password"
          type="password"
          autoComplete="current-password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
      </div>

      {error && (
        <div role="alert" className="mt-5 flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-3 font-jost text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          <p>{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || !email || !password}
        className="btn-solid-dark mt-6 w-full disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black disabled:hover:text-white"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  )
}

export default function AdminLoginPage() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-stone-50 px-4 py-12">
      <Suspense fallback={null}>
        <LoginForm />
      </Suspense>
    </div>
  )
}
