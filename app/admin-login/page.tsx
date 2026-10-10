"use client"

import { Suspense, useEffect, useState } from "react"
import Image from "next/image"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle, Eye, EyeOff } from "lucide-react"
import Field from "@/components/checkout/Field"

type Phase = "password" | "otp"

function LoginForm() {
  const router = useRouter()
  const params = useSearchParams()
  const next = params.get("next")
  const expired = params.get("expired") === "1"
  const target = next === "/admin" || next?.startsWith("/admin/") ? next : "/admin"
  const challengeParam = params.get("challenge")
  const resumableChallengeId = challengeParam && /^[a-f0-9]{64}$/.test(challengeParam) ? challengeParam : ""

  const [phase, setPhase] = useState<Phase>(resumableChallengeId ? "otp" : "password")
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordVisible, setPasswordVisible] = useState(false)
  const [code, setCode] = useState("")
  const [challengeId, setChallengeId] = useState(resumableChallengeId)
  const [destination, setDestination] = useState(resumableChallengeId ? "your admin email" : "")
  const [error, setError] = useState("")
  const [loading, setLoading] = useState(false)
  const [checking, setChecking] = useState(true)

  useEffect(() => {
    fetch("/api/admin/session")
      .then((response) => response.json())
      .then((data) => (data.authenticated ? router.replace(target) : setChecking(false)))
      .catch(() => setChecking(false))
  }, [router, target])

  function replaceChallengeInUrl(value?: string) {
    const updated = new URLSearchParams(params.toString())
    if (value) updated.set("challenge", value)
    else updated.delete("challenge")
    const query = updated.toString()
    router.replace(`/admin-login${query ? `?${query}` : ""}`, { scroll: false })
  }

  async function handlePassword(event: React.FormEvent) {
    event.preventDefault()
    setError("")
    setLoading(true)
    try {
      const response = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok || !data.challengeId) {
        setError(data.error || "Unable to sign in. Please try again.")
        return
      }
      replaceChallengeInUrl(data.challengeId)
      setChallengeId(data.challengeId)
      setDestination(data.destination || "your admin email")
      setPassword("")
      setPasswordVisible(false)
      setCode("")
      setPhase("otp")
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  async function handleCode(event: React.FormEvent) {
    event.preventDefault()
    setError("")
    setLoading(true)
    try {
      const response = await fetch("/api/admin/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ challengeId, code }),
      })
      const data = await response.json().catch(() => ({}))
      if (!response.ok) {
        setError(data.error || "Unable to verify the code.")
        return
      }
      router.replace(target)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setLoading(false)
    }
  }

  function startOver() {
    replaceChallengeInUrl()
    setPhase("password")
    setPassword("")
    setPasswordVisible(false)
    setCode("")
    setChallengeId("")
    setDestination("")
    setError("")
  }

  if (checking) return null

  return (
    <form onSubmit={phase === "password" ? handlePassword : handleCode} noValidate className="card-elevated w-full max-w-sm bg-white p-8">
      <div className="flex flex-col items-center text-center">
        <Image src="/images/brand/logo-mark.png" alt="" width={213} height={320} priority className="h-12 w-auto" />
        <span className="mt-2 font-cinzel text-sm font-bold uppercase tracking-[0.04em]">Piyush Bholla</span>
        <span className="mt-1 font-jost text-[11px] uppercase tracking-[0.2em] text-black/50">Admin</span>
      </div>

      {expired && phase === "password" && !error && (
        <p className="mt-6 rounded-md border border-black/10 bg-stone-50 p-3 font-jost text-sm text-black/70">
          Your session has expired. Please sign in again.
        </p>
      )}

      {phase === "password" ? (
        <div className="mt-8 space-y-5">
          <Field label="Email" name="email" type="email" autoComplete="username" value={email} onChange={(event) => setEmail(event.target.value)} required />
          <Field
            label="Password"
            name="password"
            type={passwordVisible ? "text" : "password"}
            autoComplete="current-password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            endAdornment={(
              <button
                type="button"
                aria-label={passwordVisible ? "Hide password" : "Show password"}
                aria-controls="field-password"
                aria-pressed={passwordVisible}
                onClick={() => setPasswordVisible((visible) => !visible)}
                className="rounded p-2 text-black/50 transition-colors hover:text-black focus-visible:ring-black"
              >
                {passwordVisible ? <EyeOff className="h-5 w-5" strokeWidth={1.5} aria-hidden /> : <Eye className="h-5 w-5" strokeWidth={1.5} aria-hidden />}
              </button>
            )}
            required
          />
        </div>
      ) : (
        <div className="mt-8">
          <p className="mb-3 font-jost text-sm leading-relaxed text-black/65">
            Enter the six-digit verification code sent to {destination}. It expires in five minutes.
          </p>
          <p className="mb-5 font-jost text-xs leading-relaxed text-black/50">
            You can leave this page to read the email. Copy the code, then use the Continue verification link in that email to reopen this screen.
          </p>
          <Field
            label="Verification code"
            name="code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            maxLength={6}
            value={code}
            onChange={(event) => setCode(event.target.value.replace(/\D/g, "").slice(0, 6))}
            required
          />
        </div>
      )}

      {error && (
        <div role="alert" className="mt-5 flex items-start gap-3 rounded-md border border-red-200 bg-red-50 p-3 font-jost text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
          <p>{error}</p>
        </div>
      )}

      <button
        type="submit"
        disabled={loading || (phase === "password" ? !email || !password : code.length !== 6)}
        className="btn-solid-dark mt-6 w-full disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black disabled:hover:text-white"
      >
        {loading ? (phase === "password" ? "Sending code…" : "Verifying…") : phase === "password" ? "Continue" : "Verify and sign in"}
      </button>

      {phase === "otp" && (
        <button type="button" onClick={startOver} className="mt-4 w-full font-jost text-sm text-black/60 underline underline-offset-4 hover:text-black">
          Start over
        </button>
      )}
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
