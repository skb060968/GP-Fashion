"use client"

import { useEffect, useRef, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { AlertCircle } from "lucide-react"
import { useUser } from "@/context/UserContext"
import PageHeading from "@/components/PageHeading"
import FadeIn from "@/components/FadeIn"
import Field from "@/components/checkout/Field"

const RESEND_SECONDS = 30

export default function LoginClient() {
  const router = useRouter()
  const params = useSearchParams()
  const { user, ready, setUser } = useUser()
  const nextRaw = params.get("next") ?? "/account"
  const next = nextRaw.startsWith("/") && !nextRaw.startsWith("//") ? nextRaw : "/account"

  const [step, setStep] = useState<"email" | "code">("email")
  const [email, setEmail] = useState("")
  const [code, setCode] = useState("")
  const [error, setError] = useState("")
  const [busy, setBusy] = useState(false)
  const [cooldown, setCooldown] = useState(0)
  const codeRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (ready && user) router.replace(next)
  }, [ready, user, next, router])

  useEffect(() => {
    if (cooldown <= 0) return
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000)
    return () => clearTimeout(t)
  }, [cooldown])

  useEffect(() => {
    if (step === "code") codeRef.current?.focus()
  }, [step])

  const requestCode = async () => {
    setError("")
    setBusy(true)
    try {
      const res = await fetch("/api/auth/request-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim() }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || "We couldn't send the code. Please try again.")
        return
      }
      setStep("code")
      setCode("")
      setCooldown(RESEND_SECONDS)
    } catch {
      setError("We couldn't send the code. Check your connection and try again.")
    } finally {
      setBusy(false)
    }
  }

  const verify = async (value = code) => {
    const digits = value.replace(/\D/g, "")
    if (digits.length !== 6) return
    setError("")
    setBusy(true)
    try {
      const res = await fetch("/api/auth/verify-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), code: digits }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data.error || "That code isn't right.")
        if (data.reason === "expired" || data.reason === "too_many_attempts") setCooldown(0)
        setCode("")
        codeRef.current?.focus()
        return
      }
      setUser(data.user)
      router.replace(next)
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setBusy(false)
    }
  }

  if (!ready || user) return null

  return (
    <div className="bg-white text-black">
      <section className="pb-24 pt-12 sm:pt-16 lg:pb-32 lg:pt-20">
        <div className="container-max">
          <PageHeading title="Sign in" meta="No password needed. We'll email you a one-time code." />

          <FadeIn className="mx-auto mt-14 max-w-md lg:mt-16">
            <div className="card-elevated p-8">
              {step === "email" ? (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    requestCode()
                  }}
                  noValidate
                  className="space-y-6"
                >
                  <Field
                    label="Email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    inputMode="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    autoFocus
                    hint="Use the email you order with to see your past orders."
                  />
                  {error && <ErrorNote text={error} />}
                  <button type="submit" disabled={busy || !email.trim()} className="btn-solid-dark w-full disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black disabled:hover:text-white">
                    {busy ? "Sending…" : "Email me a code"}
                  </button>
                  <p className="text-center font-jost text-xs text-black/50">
                    First time here? Signing in creates your account.
                  </p>
                </form>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    verify()
                  }}
                  noValidate
                  className="space-y-6"
                >
                  <p className="font-jost text-sm text-black/70">
                    We sent a 6-digit code to <span className="font-semibold text-black">{email.trim()}</span>.{" "}
                    <button type="button" onClick={() => { setStep("email"); setError(""); setCode("") }} className="underline underline-offset-4 hover:text-black">
                      Change
                    </button>
                  </p>
                  <div>
                    <label htmlFor="login-code" className="block font-jost text-xs font-semibold uppercase tracking-[0.15em] text-black/70">
                      Code
                    </label>
                    <input
                      id="login-code"
                      ref={codeRef}
                      type="text"
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      pattern="[0-9]*"
                      maxLength={6}
                      value={code}
                      onChange={(e) => {
                        const v = e.target.value.replace(/\D/g, "").slice(0, 6)
                        setCode(v)
                        if (v.length === 6) verify(v)
                      }}
                      aria-invalid={Boolean(error)}
                      className={`mt-2 w-full rounded-lg border bg-white px-4 py-3 text-center font-jost text-2xl tracking-[0.5em] text-black focus:outline-none focus:ring-1 ${
                        error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "border-black/15 focus:border-black focus:ring-black"
                      }`}
                    />
                    <p className="mt-1.5 font-jost text-xs text-black/50">The code expires in 10 minutes. Check your spam folder if it hasn't arrived.</p>
                  </div>
                  {error && <ErrorNote text={error} />}
                  <button type="submit" disabled={busy || code.length !== 6} className="btn-solid-dark w-full disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black disabled:hover:text-white">
                    {busy ? "Checking…" : "Sign in"}
                  </button>
                  <p className="text-center font-jost text-xs text-black/50">
                    {cooldown > 0 ? (
                      <>Resend code in {cooldown}s</>
                    ) : (
                      <button type="button" onClick={requestCode} disabled={busy} className="underline underline-offset-4 hover:text-black">
                        Resend code
                      </button>
                    )}
                  </p>
                </form>
              )}
            </div>
          </FadeIn>
        </div>
      </section>
    </div>
  )
}

function ErrorNote({ text }: { text: string }) {
  return (
    <div role="alert" className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-3 font-jost text-sm text-red-800">
      <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
      <p>{text}</p>
    </div>
  )
}
