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

  const [form, setForm] = useState<AddressForm>(EMPTY)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [hydrated, setHydrated] = useState(false)

  // Prefill from a previous attempt (e.g. user came back via "Change").
  useEffect(() => {
    try {
      const stored = localStorage.getItem(ADDRESS_STORAGE_KEY)
      if (stored) setForm({ ...EMPTY, ...JSON.parse(stored) })
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true)
  }, [])

  // Nothing to check out: send them back to the bag.
  useEffect(() => {
    if (hydrated && cart.length === 0) router.replace("/bag")
  }, [hydrated, cart.length, router])

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
            {/* Form */}
            <FadeIn className="lg:col-span-7">
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

            {/* Summary */}
            <FadeIn delay={120} className="lg:col-span-5">
              <OrderSummary />
            </FadeIn>
          </div>
        </div>
      </section>
    </div>
  )
}
