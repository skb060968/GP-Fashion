"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import { useCart } from "@/context/CartContext"
import { formatRupees } from "@/lib/money"

type Address = {
  fullName: string
  phone: string
  email: string
  addressLine1: string
  addressLine2?: string
  city: string
  state: string
  pincode: string
}

const COUPON_ERROR_MESSAGES: Record<string, string> = {
  NOT_FOUND: "Coupon not found",
  EXPIRED: "Coupon has expired",
  USAGE_LIMIT: "Coupon usage limit reached",
  MIN_ORDER_NOT_MET: "Minimum order amount not met",
  INACTIVE: "Coupon is not active",
}

export default function PaymentPage() {
  const router = useRouter()
  const { cart, clearCart } = useCart()

  const [address, setAddress] = useState<Address | null>(null)
  const [confirmChecked, setConfirmChecked] = useState(false)
  const [isPlacingOrder, setIsPlacingOrder] = useState(false)

  // Coupon state
  const [couponCode, setCouponCode] = useState("")
  const [couponDiscount, setCouponDiscount] = useState(0)
  const [couponError, setCouponError] = useState("")
  const [couponApplied, setCouponApplied] = useState(false)

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0)
  const discountAmount = couponDiscount
  const orderTotal = totalAmount - couponDiscount

  useEffect(() => {
    const storedAddress = localStorage.getItem("checkout_address")
    if (!storedAddress) return
    setAddress(JSON.parse(storedAddress))
  }, [])

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    setCouponError("")
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: couponCode.trim(), subtotal: totalAmount }),
      })
      const data = await res.json()
      if (data.valid) {
        setCouponDiscount(data.discountAmount ?? 0)
        setCouponApplied(true)
        setCouponError("")
      } else {
        setCouponDiscount(0)
        setCouponApplied(false)
        setCouponError(COUPON_ERROR_MESSAGES[data.error] ?? "Invalid coupon")
      }
    } catch {
      setCouponDiscount(0)
      setCouponApplied(false)
      setCouponError("Failed to validate coupon")
    }
  }

  const handlePlaceOrder = async () => {
    if (!address || cart.length === 0 || !confirmChecked) return
    try {
      setIsPlacingOrder(true)
      // 🔥 Step 1: Warm-up query (wake Neon branch)
      await fetch("/api/warmup", { method: "POST" })

      // 🔥 Step 2: Place actual order (retry up to 2 times for cold DB)
      let res: Response | null = null
      for (let attempt = 0; attempt < 3; attempt++) {
        res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: cart,
            address,
            amount: totalAmount,
            paymentMethod: "UPI_MANUAL",
            ...(couponApplied && couponCode.trim() ? { couponCode: couponCode.trim() } : {}),
          }),
        })
        if (res.ok || res.status < 500) break
        // Wait before retrying on server errors (likely cold DB)
        await new Promise((r) => setTimeout(r, 1500))
      }
      if (!res || !res.ok) throw new Error("Order creation failed")
      const data = await res.json()
      clearCart()
      localStorage.removeItem("checkout_address")
      router.push(`/checkout/success?orderId=${data.orderId}`)
      // ✅ keep isPlacingOrder true until navigation
    } catch (err) {
      alert("Something went wrong while placing your order.")
      setIsPlacingOrder(false) // only reset on error
    }
  }

  if (!address) return null

  return (
    <section className="bg-white pt-28 pb-16">
      <div className="mx-auto max-w-3xl space-y-8 px-4">
        <h1 className="font-serif text-3xl font-bold">Payment</h1>

        {/* Cart Items */}
        <div className="bg-white rounded-xl shadow p-6 space-y-6">
          <h2 className="font-semibold text-lg">Order Items</h2>

          {cart.map((item, idx) => (
            <div
              key={idx}
              className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6 bg-white rounded-xl shadow-sm p-4 border-b last:border-none"
            >
              <div className="flex items-start gap-4">
              <Image
  src={item.coverThumbnail}
  alt={item.name}
  width={60}
  height={80}
  className="rounded-md object-cover sm:w-[150px] sm:h-[200px]"
  
/>
                <div>
                  <p className="font-serif text-lg font-semibold text-fashion-black">
                    {item.name}
                  </p>
                  <p className="text-sm text-gray-600">Size: {item.size}</p>
                  <p className="text-sm text-gray-600">
                    Unit Price: {formatRupees(item.price)}
                  </p>
                  <p className="text-sm text-gray-600">Qty: {item.quantity}</p>
                </div>
              </div>

              <div className="mt-2 sm:mt-0 sm:text-right font-medium text-fashion-black self-end">
                Line Total: {formatRupees(item.price * item.quantity)}
              </div>
            </div>
          ))}
        </div>

        {/* Address */}
        <div className="bg-white rounded-xl shadow p-6 space-y-2">
          <div className="flex justify-between items-start">
            <h2 className="font-semibold text-lg">Shipping To</h2>
            <button
              onClick={() => router.push("/checkout/address")}
              className="text-sm text-fashion-gold hover:underline"
            >
              Change
            </button>
          </div>
          <p className="font-medium">{address.fullName}</p>
          <p className="text-sm text-gray-700">{address.phone}</p>
          <p className="text-sm text-gray-700">{address.email}</p>
          <p className="text-sm text-gray-700">
            {address.addressLine1}
            {address.addressLine2 && `, ${address.addressLine2}`}
          </p>
          <p className="text-sm text-gray-700">
            {address.city}, {address.state} – {address.pincode}
          </p>
        </div>

        {/* Amount Summary */}
        <div className="bg-white rounded-xl shadow p-6 space-y-4">
          <div className="flex justify-between">
            <span className="font-medium">Total Amount</span>
            <span className="font-semibold">{formatRupees(totalAmount)}</span>
          </div>

          {/* Coupon Input */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-gray-700">Coupon Code</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={couponCode}
                onChange={(e) => setCouponCode(e.target.value)}
                placeholder="Enter coupon code"
                disabled={couponApplied}
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fashion-gold disabled:bg-gray-100"
              />
              {couponApplied ? (
                <button
                  onClick={() => {
                    setCouponApplied(false)
                    setCouponDiscount(0)
                    setCouponCode("")
                    setCouponError("")
                  }}
                  className="rounded-lg bg-gray-200 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-300 transition"
                >
                  Remove
                </button>
              ) : (
                <button
                  onClick={handleApplyCoupon}
                  className="rounded-lg bg-fashion-gold px-4 py-2 text-sm font-medium text-white hover:bg-fashion-gold/90 transition"
                >
                  Apply
                </button>
              )}
            </div>
            {couponError && (
              <p className="text-sm text-red-600">{couponError}</p>
            )}
            {couponApplied && (
              <p className="text-sm text-green-600">Coupon applied successfully!</p>
            )}
          </div>

          {couponApplied && (
            <div className="flex justify-between text-gray-700">
              <span>Coupon Discount</span>
              <span>-{formatRupees(couponDiscount)}</span>
            </div>
          )}

          <div className="flex justify-between text-lg font-bold text-fashion-black">
            <span>Order Total</span>
            <span>{formatRupees(orderTotal)}</span>
          </div>
        </div>

        {/* UPI */}
        <div className="bg-white rounded-xl shadow p-6 text-center space-y-4">
          <h2 className="font-semibold text-lg">Pay via UPI</h2>
        <Image
  src="/payments/upi.jpg"
  alt="UPI QR Code"
  width={300}
  height={300}
  className="mx-auto object-contain"
  
/>
          <label className="flex items-center justify-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={confirmChecked}
              onChange={(e) => setConfirmChecked(e.target.checked)}
            />
            I confirm the order details are correct and I have completed the UPI payment.
          </label>
        </div>

        {/* Place Order */}
        <button
          onClick={handlePlaceOrder}
          disabled={!confirmChecked || isPlacingOrder}
          className="btn-primary w-full disabled:opacity-50"
        >
          {isPlacingOrder ? "Placing Order..." : "Place Order"}
        </button>
      </div>
    </section>
  )
}