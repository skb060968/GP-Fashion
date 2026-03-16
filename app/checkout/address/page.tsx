"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { validateAddress } from "@/lib/validation/addressValidation"

type AddressForm = {
  fullName: string
  phone: string
  email: string
  addressLine1: string
  city: string
  state: string
  pincode: string
}

export default function AddressPage() {
  const router = useRouter()

  const [form, setForm] = useState<AddressForm>({
    fullName: "",
    phone: "",
    email: "",
    addressLine1: "",
    city: "",
    state: "",
    pincode: "",
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    // Clear the field-specific error when the user types
    if (errors[name]) {
      setErrors(prev => {
        const next = { ...prev }
        delete next[name]
        return next
      })
    }
  }

  const handleContinue = () => {
    const result = validateAddress(form)

    if (!result.valid) {
      setErrors(result.errors)
      return
    }

    // Persist validated address and navigate to payment
    localStorage.setItem("checkout_address", JSON.stringify(form))
    router.push("/checkout/payment")
  }

  return (
    <section className="bg-white pt-24 pb-20">
      <div className="container-max max-w-3xl">
        <h1 className="font-serif text-3xl font-bold mb-10">
          Shipping Address
        </h1>

        <div className="bg-white rounded-2xl border border-stone-200 p-8 space-y-6">
          <div>
            <input
              type="text"
              name="fullName"
              placeholder="Full Name"
              value={form.fullName}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-lg border ${errors.fullName ? "border-red-400" : "border-gray-300"} focus:outline-none focus:border-fashion-gold`}
            />
            {errors.fullName && <p className="text-sm text-red-600 mt-1">{errors.fullName}</p>}
          </div>

          <div>
            <input
              type="tel"
              name="phone"
              placeholder="Phone Number"
              value={form.phone}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-lg border ${errors.phone ? "border-red-400" : "border-gray-300"} focus:outline-none focus:border-fashion-gold`}
            />
            {errors.phone && <p className="text-sm text-red-600 mt-1">{errors.phone}</p>}
          </div>

          <div>
            <input
              type="email"
              name="email"
              placeholder="Email Address"
              value={form.email}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-lg border ${errors.email ? "border-red-400" : "border-gray-300"} focus:outline-none focus:border-fashion-gold`}
            />
            {errors.email && <p className="text-sm text-red-600 mt-1">{errors.email}</p>}
          </div>

          <div>
            <textarea
              name="addressLine1"
              placeholder="Address (House no, Street, Area)"
              rows={3}
              value={form.addressLine1}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-lg border ${errors.addressLine1 ? "border-red-400" : "border-gray-300"} focus:outline-none focus:border-fashion-gold`}
            />
            {errors.addressLine1 && <p className="text-sm text-red-600 mt-1">{errors.addressLine1}</p>}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div>
              <input
                type="text"
                name="city"
                placeholder="City"
                value={form.city}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border ${errors.city ? "border-red-400" : "border-gray-300"} focus:outline-none focus:border-fashion-gold`}
              />
              {errors.city && <p className="text-sm text-red-600 mt-1">{errors.city}</p>}
            </div>

            <div>
              <input
                type="text"
                name="state"
                placeholder="State"
                value={form.state}
                onChange={handleChange}
                className={`w-full px-4 py-3 rounded-lg border ${errors.state ? "border-red-400" : "border-gray-300"} focus:outline-none focus:border-fashion-gold`}
              />
              {errors.state && <p className="text-sm text-red-600 mt-1">{errors.state}</p>}
            </div>
          </div>

          <div>
            <input
              type="text"
              name="pincode"
              placeholder="Pincode"
              value={form.pincode}
              onChange={handleChange}
              className={`w-full px-4 py-3 rounded-lg border ${errors.pincode ? "border-red-400" : "border-gray-300"} focus:outline-none focus:border-fashion-gold`}
            />
            {errors.pincode && <p className="text-sm text-red-600 mt-1">{errors.pincode}</p>}
          </div>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mt-10">
          <Link
            href="/cart"
            className="btn-secondary w-full sm:w-auto inline-flex items-center justify-center"
          >
            ← Back to Cart
          </Link>

          <button
            onClick={handleContinue}
            className="btn-primary w-full sm:w-auto inline-flex items-center justify-center"
          >
            Continue to Payment
          </button>
        </div>
      </div>
    </section>
  )
}
