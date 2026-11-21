"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useCart } from "@/context/CartContext"
import { validateAddress, validateBillingAddress } from "@/lib/validation/addressValidation"
import { findState } from "@/lib/gst/states"
import { placeOfSupply } from "@/lib/gst/placeOfSupply"
import CheckoutSteps from "@/components/checkout/CheckoutSteps"
import OrderSummary from "@/components/checkout/OrderSummary"
import Field from "@/components/checkout/Field"
import PageHeading from "@/components/PageHeading"
import FadeIn from "@/components/FadeIn"
import { ADDRESS_STORAGE_KEY, EMPTY_BILLING, canonicalState, type BillingFields, type CheckoutAddress as AddressForm } from "@/lib/checkout"
import { useUser } from "@/context/UserContext"
import type { SavedAddress } from "@/components/account/AddressForm"
import StateSelect from "@/components/checkout/StateSelect"
import { gstinError, normaliseGstin } from "@/lib/gst/gstin"
import { Check } from "lucide-react"

const fromSaved = (a: SavedAddress, email: string, business: Pick<AddressForm, "businessName" | "gstin">): AddressForm => ({
  fullName: a.fullName,
  phone: a.phone,
  email,
  addressLine1: a.addressLine1,
  addressLine2: a.addressLine2 ?? "",
  city: a.city,
  state: canonicalState(a.state),
  pincode: a.pincode,
  ...business,
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
  businessName: "",
  gstin: "",
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
  const [needsGst, setNeedsGst] = useState(false)
  const [sameBilling, setSameBilling] = useState(true)
  const [billing, setBilling] = useState<BillingFields>(EMPTY_BILLING)

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ADDRESS_STORAGE_KEY)
      if (stored) {
        const { billing: storedBilling, ...rest } = { ...EMPTY, ...JSON.parse(stored) } as AddressForm
        setForm({ ...rest, state: canonicalState(rest.state) })
        if (rest.gstin) setNeedsGst(true)
        if (storedBilling) {
          setSameBilling(false)
          setBilling({ ...EMPTY_BILLING, ...storedBilling, state: canonicalState(storedBilling.state) })
        }
      }
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
            return fromSaved(def, user.email, { businessName: prev.businessName, gstin: prev.gstin })
          }
          return { ...prev, email: user.email, fullName: prev.fullName || user.name || "", phone: prev.phone || user.phone || "" }
        })
      })
      .catch(() => {})
  }, [ready, user])

  const applySaved = (a: SavedAddress) => {
    setSelectedId(a.id)
    setErrors({})
    setForm(fromSaved(a, user?.email ?? form.email, { businessName: form.businessName, gstin: form.gstin }))
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    if (name === "state" && errors.gstin) {
      setErrors(({ gstin, ...rest }) => {
        void gstin
        return rest
      })
    }
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const clearError = (name: string) => {
    if (errors[name]) {
      setErrors((prev) => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const handleBillingChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target
    setBilling((prev) => ({ ...prev, [name.replace(/^billing\./, "")]: value }))
    clearError(name)
    if (name === "billing.state") clearError("gstin")
  }

  const billingFromSaved = (a: SavedAddress) => {
    setBilling({
      fullName: a.fullName,
      addressLine1: a.addressLine1,
      addressLine2: a.addressLine2 ?? "",
      city: a.city,
      state: canonicalState(a.state),
      pincode: a.pincode,
    })
    setErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => !k.startsWith("billing.") && k !== "gstin")))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const { billing: _ignored, ...shippingForm } = form
    void _ignored
    const trimmed = Object.fromEntries(
      Object.entries(shippingForm).map(([k, v]) => [k, (v ?? "").trim()])
    ) as unknown as AddressForm
    const billingTrimmed = sameBilling
      ? null
      : (Object.fromEntries(Object.entries(billing).map(([k, v]) => [k, (v ?? "").trim()])) as unknown as BillingFields)
    if (needsGst) {
      trimmed.gstin = normaliseGstin(trimmed.gstin ?? "")
    } else {
      trimmed.businessName = ""
      trimmed.gstin = ""
    }

    const result = validateAddress(trimmed)
    const found: Record<string, string> = { ...result.errors }
    if (!found.state && !canonicalState(trimmed.state)) found.state = "Choose your state from the list"
    if (billingTrimmed) {
      const b = validateBillingAddress(billingTrimmed)
      for (const [k, v] of Object.entries(b.errors)) found[`billing.${k}`] = v
      if (!found["billing.state"] && !canonicalState(billingTrimmed.state)) found["billing.state"] = "Choose the billing state from the list"
    }
    if (needsGst) {
      if ((trimmed.businessName ?? "").length < 2) found.businessName = "Enter the business name as registered for GST"
      const gstErr = gstinError(trimmed.gstin ?? "")
      if (gstErr) found.gstin = gstErr
      const shipCode = findState(trimmed.state)?.code
      const billCode = billingTrimmed ? findState(billingTrimmed.state)?.code : null
      if (!gstErr && shipCode && (!billingTrimmed || billCode)) {
        const pos = placeOfSupply({ shippingStateCode: shipCode, billingStateCode: billCode ?? null, gstin: trimmed.gstin })
        if (!pos.ok) found[pos.field] = pos.message
      }
    }
    if (Object.keys(found).length > 0) {
      setErrors(found)
      const first = Object.keys(found)[0]
      document.getElementById(`field-${first}`)?.focus()
      return
    }

    const toStore: AddressForm = billingTrimmed ? { ...trimmed, billing: billingTrimmed } : trimmed
    localStorage.setItem(ADDRESS_STORAGE_KEY, JSON.stringify(toStore))

    if (user && saveToBook && !selectedId) {
      const { email, businessName, gstin, ...book } = trimmed
      void email
      void businessName
      void gstin
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
                    <StateSelect value={form.state} onChange={handleChange} error={errors.state} />
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

                <fieldset className="space-y-5">
                  <label className="flex cursor-pointer items-start gap-3">
                    <span className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                      <input
                        type="checkbox"
                        checked={sameBilling}
                        onChange={(e) => {
                          setSameBilling(e.target.checked)
                          setErrors((prev) => Object.fromEntries(Object.entries(prev).filter(([k]) => !k.startsWith("billing.") && k !== "gstin")))
                        }}
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-black/30 transition-colors checked:border-black checked:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                      />
                      <Check className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100" strokeWidth={3} aria-hidden />
                    </span>
                    <span className="font-jost text-sm text-black/80">Billing address same as shipping</span>
                  </label>
                  {!sameBilling && (
                    <div className="space-y-5">
                      <h2 className="font-cinzel text-base font-bold uppercase tracking-[0.15em] sm:text-lg">Billing address</h2>
                      <p className="font-jost text-sm text-black/60">The name and address on your tax invoice. We ship to the address above.</p>
                      {user && saved.length > 0 && (
                        <div className="flex flex-wrap items-center gap-2 font-jost text-sm">
                          <span className="text-black/60">Fill from a saved address:</span>
                          {saved.map((a) => (
                            <button
                              key={a.id}
                              type="button"
                              onClick={() => billingFromSaved(a)}
                              className="rounded-full border border-black/15 px-3 py-1 transition-colors hover:border-black"
                            >
                              {a.label || a.fullName}, {a.city}
                            </button>
                          ))}
                        </div>
                      )}
                      <Field
                        label="Full name"
                        name="billing.fullName"
                        autoComplete="billing name"
                        value={billing.fullName}
                        onChange={handleBillingChange}
                        error={errors["billing.fullName"]}
                      />
                      <Field
                        label="Address"
                        name="billing.addressLine1"
                        autoComplete="billing address-line1"
                        placeholder="House no., street, area"
                        value={billing.addressLine1}
                        onChange={handleBillingChange}
                        error={errors["billing.addressLine1"]}
                      />
                      <Field
                        label="Apartment, landmark"
                        name="billing.addressLine2"
                        autoComplete="billing address-line2"
                        optional
                        value={billing.addressLine2}
                        onChange={handleBillingChange}
                        error={errors["billing.addressLine2"]}
                      />
                      <div className="grid grid-cols-1 gap-5 sm:grid-cols-3">
                        <Field
                          label="City"
                          name="billing.city"
                          autoComplete="billing address-level2"
                          value={billing.city}
                          onChange={handleBillingChange}
                          error={errors["billing.city"]}
                        />
                        <StateSelect name="billing.state" value={billing.state} onChange={handleBillingChange} error={errors["billing.state"]} />
                        <Field
                          label="Pincode"
                          name="billing.pincode"
                          inputMode="numeric"
                          autoComplete="billing postal-code"
                          maxLength={6}
                          value={billing.pincode}
                          onChange={handleBillingChange}
                          error={errors["billing.pincode"]}
                        />
                      </div>
                    </div>
                  )}
                </fieldset>

                <fieldset className="space-y-5">
                  <label className="flex cursor-pointer items-start gap-3">
                    <span className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                      <input
                        type="checkbox"
                        checked={needsGst}
                        onChange={(e) => {
                          setNeedsGst(e.target.checked)
                          setErrors(({ businessName, gstin, ...rest }) => {
                            void businessName
                            void gstin
                            return rest
                          })
                        }}
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-black/30 transition-colors checked:border-black checked:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                      />
                      <Check className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100" strokeWidth={3} aria-hidden />
                    </span>
                    <span className="font-jost text-sm text-black/80">
                      Buying for a business? Add your GSTIN to the tax invoice
                    </span>
                  </label>
                  {needsGst && (
                    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                      <Field
                        label="Business name"
                        name="businessName"
                        autoComplete="organization"
                        value={form.businessName ?? ""}
                        onChange={handleChange}
                        error={errors.businessName}
                        hint="As registered for GST"
                      />
                      <Field
                        label="GSTIN"
                        name="gstin"
                        autoCapitalize="characters"
                        maxLength={15}
                        value={form.gstin ?? ""}
                        onChange={handleChange}
                        error={errors.gstin}
                        hint="15 characters, e.g. 07AAAAA0000A1Z5. The billing address must be in the GSTIN's state"
                      />
                    </div>
                  )}
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
