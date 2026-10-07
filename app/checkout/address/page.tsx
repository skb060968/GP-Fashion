"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useCart } from "@/context/CartContext"
import { validateAddress } from "@/lib/validation/addressValidation"
import CheckoutSteps from "@/components/checkout/CheckoutSteps"
import OrderSummary from "@/components/checkout/OrderSummary"
import Field from "@/components/checkout/Field"
import PageHeading from "@/components/PageHeading"
import FadeIn from "@/components/FadeIn"
import { ADDRESS_STORAGE_KEY, type CheckoutAddress as AddressForm } from "@/lib/checkout"
import { useUser } from "@/context/UserContext"
import type { SavedAddress } from "@/components/account/AddressForm"
import { Check } from "lucide-react"

const fromSaved = (a: SavedAddress, email: string): AddressForm => ({
  fullName: a.fullName,
  phone: a.phone,
  email,
  addressLine1: a.addressLine1,
  addressLine2: a.addressLine2 ?? "",
  city: a.city,
  state: a.state,
  pincode: a.pincode,
})

const EMPTY: AddressForm = {
  fullName: "",
  phone: "",
  email: "",
  addressLine1: "",
  addressLine2: "",
  city: "",
  state: "",
  pincode: "",
}

export default function AddressPage() {
  const router = useRouter()
  const { cart } = useCart()

  const { user, ready } = useUser()

  const [form, setForm] = useState<AddressForm>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [hydrated, setHydrated] = useState(false)
  const [saved, setSaved] = useState<SavedAddress[]>([])
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const [saveToBook, setSaveToBook] = useState(true)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ADDRESS_STORAGE_KEY)
      if (stored) setForm({ ...EMPTY, ...JSON.parse(stored) })
    } catch {

    }
    setHydrated(true)
  }, [])

  useEffect(() => {
    if (hydrated && cart.length === 0) router.replace("/bag")
  }, [hydrated, cart.length, router])

  useEffect(() => {
    if (!ready || !user) return
    fetch("/api/account/addresses", { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : { addresses: [] }))
      .then(({ addresses }: { addresses: SavedAddress[] }) => {
        setSaved(addresses)
        setForm((prev) => {
          const alreadyTyped = prev.fullName || prev.addressLine1
          const def = addresses.find((a) => a.isDefault) ?? addresses[0]
          if (alreadyTyped) return { ...prev, email: prev.email || user.email }
          if (def) {
            setSelectedId(def.id)
            return fromSaved(def, user.email)
          }
          return { ...prev, email: user.email, fullName: prev.fullName || user.name || "", phone: prev.phone || user.phone || "" }
        })
      })
      .catch(() => {})
  }, [ready, user])

  const applySaved = (a: SavedAddress) => {
    setSelectedId(a.id)
    setErrors({})
    setForm(fromSaved(a, user?.email ?? form.email))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const trimmed = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v.trim()])
    ) as AddressForm

    const result = validateAddress(trimmed)
    if (!result.valid) {
      setErrors(result.errors)
      const first = Object.keys(result.errors)[0]
      document.getElementById(`field-${first}`)?.focus()
      return
    }

    localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(trimmed))

    if (user && saveToBook && !selectedId) {
      const { email, ...book } = trimmed
      void email
      fetch("/api/account/addresses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...book, label: "" }),
      }).catch(() => {})
    }

    router.push("/checkout/payment")
  }

  if (!hydrated || cart.length === 0) return null

  return (
    <div className="bg-white text-black">
      <section className="pb-20 pt-12 sm:pb-24 sm:pt-16 lg:pb-32 lg:pt-20">
        <div className="container-max">
          <PageHeading title="Checkout" />

          <div className="mt-10 lg:mt-12">
            <CheckoutSteps current="address" />
          </div>

          <div className="mt-14 grid grid-cols-1 gap-12 lg:mt-16 lg:grid-cols-12 lg:gap-16">

            <FadeIn className="lg:col-span-7">
              {ready && !user && (
                <p className="mb-8 rounded-lg border border-black/10 bg-stone-50 p-4 font-jost text-sm text-black/70">
                  Have an account?{" "}
                  <Link href="/login?next=/checkout/address" className="font-semibold text-black underline underline-offset-4">
                    Sign in
                  </Link>{" "}
                  to use a saved address. Or carry on as a guest.
                </p>
              )}

              {user && saved.length > 0 && (
                <fieldset className="mb-10">
                  <legend className="mb-3 font-cinzel text-base font-bold uppercase tracking-[0.15em] sm:text-lg">Saved addresses</legend>
                  <div role="radiogroup" className="grid gap-3 sm:grid-cols-2">
                    {saved.map((a) => {
                      const active = selectedId === a.id
                      return (
                        <button
                          key={a.id}
                          type="button"
                          role="radio"
                          aria-checked={active}
                          onClick={() => applySaved(a)}
                          className={`relative rounded-lg border p-4 text-left font-jost text-sm transition-colors ${active ? "border-black bg-black/[0.03]" : "border-black/15 hover:border-black"}`}
                        >
                          <span className="block font-semibold">{a.label || a.fullName}</span>
                          <span className="mt-1 block leading-relaxed text-black/65">
                            {a.label && <>{a.fullName}<br /></>}
                            {a.addressLine1}
                            {a.addressLine2 ? `, ${a.addressLine2}` : ""}
                            <br />
                            {a.city}, {a.state} {a.pincode}
                          </span>
                          {active && (
                            <span className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-black" aria-hidden>
                              <Check className="h-3 w-3 text-white" strokeWidth={3} />
                            </span>
                          )}
                        </button>
                      )
                    })}
                    <button
                      type="button"
                      role="radio"
                      aria-checked={selectedId === null}
                      onClick={() => {
                        setSelectedId(null)
                        setForm({ ...EMPTY, email: user.email, fullName: user.name ?? "", phone: user.phone ?? "" })
                      }}
                      className={`rounded-lg border border-dashed p-4 text-left font-jost text-sm transition-colors ${selectedId === null ? "border-black" : "border-black/20 hover:border-black"}`}
                    >
                      <span className="font-semibold">Use a different address</span>
                    </button>
                  </div>
                </fieldset>
              )}

              <form onSubmit={handleSubmit} noValidate className="space-y-10">
                <fieldset className="space-y-5">
                  <legend className="mb-2 font-cinzel text-base font-bold uppercase tracking-[0.15em] sm:text-lg">
                    Contact
                  </legend>
                  <Field
                    label="Full name"
                    name="fullName"
                    autoComplete="name"
                    value={form.fullName}
                    onChange={handleChange}
                    error={errors.fullName}
                  />
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                    <Field
                      label="Mobile number"
                      name="phone"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel-national"
                      maxLength={10}
                      value={form.phone}
                      onChange={handleChange}
                      error={errors.phone}
                      hint="10-digit Indian mobile number"
                    />
                    <Field
                      label="Email"
                      name="email"
                      type="email"
                      autoComplete="email"
                      value={form.email}
                      onChange={handleChange}
                      error={errors.email}
                      hint="Order confirmation is sent here"
                    />
                  </div>
                </fieldset>

                <fieldset className="space-y-5">
                  <legend className="mb-2 font-cinzel text-base font-bold uppercase tracking-[0.15em] sm:text-lg">
                    Shipping address
                  </legend>
                  <Field
                    label="Address"
                    name="addressLine1"
                    autoComplete="address-line1"
                    placeholder="House no., street, area"
                    value={form.addressLine1}
                    onChange={handleChange}
                    error={errors.addressLine1}
                  />
                  <Field
                    label="Apartment, landmark"
                    name="addressLine2"
                    autoComplete="address-line2"
                    optional
                    value={form.addressLine2}
                    onChange={handleChange}
                    error={errors.addressLine2}
                  />
                  <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                    <Field
                      label="City"
                      name="city"
                      autoComplete="address-level2"
                      value={form.city}
                      onChange={handleChange}
                      error={errors.city}
                    />
                    <Field
                      label="State"
                      name="state"
                      autoComplete="address-level1"
                      value={form.state}
                      onChange={handleChange}
                      error={errors.state}
                    />
                    <Field
                      label="Pincode"
                      name="pincode"
                      inputMode="numeric"
                      autoComplete="postal-code"
                      maxLength={6}
                      value={form.pincode}
                      onChange={handleChange}
                      error={errors.pincode}
                    />
                  </div>
                </fieldset>

                {user && selectedId === null && (
                  <label className="flex cursor-pointer items-start gap-3">
                    <span className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                      <input
                        type="checkbox"
                        checked={saveToBook}
                        onChange={(e) => setSaveToBook(e.target.checked)}
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-black/30 transition-colors checked:border-black checked:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                      />
                      <Check className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100" strokeWidth={3} aria-hidden />
                    </span>
                    <span className="font-jost text-sm text-black/80">Save this address to my account for next time</span>
                  </label>
                )}

                <div className="flex flex-col-reverse items-center gap-4 pt-2 sm:flex-row sm:justify-between">
                  <Link
                    href="/bag"
                    className="font-jost text-sm text-black/60 underline-offset-4 transition-colors hover:text-black hover:underline"
                  >
                    ← Back to bag
                  </Link>
                  <button type="submit" className="btn-solid-dark w-full sm:w-auto">
                    Continue to payment
                  </button>
                </div>
              </form>
            </FadeIn>

            <FadeIn delay={120} className="lg:col-span-5">
              <OrderSummary />
            </FadeIn>
          </div>
        </div>
      </section>
    </div>
  )
}
