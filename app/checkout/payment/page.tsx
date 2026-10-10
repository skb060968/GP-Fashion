"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { AlertCircle, Check, CreditCard, QrCode } from "lucide-react"
import { useCart } from "@/context/CartContext"
import { formatRupees } from "@/lib/money"
import CheckoutSteps from "@/components/checkout/CheckoutSteps"
import OrderSummary from "@/components/checkout/OrderSummary"
import PageHeading from "@/components/PageHeading"
import FadeIn from "@/components/FadeIn"
import { ADDRESS_STORAGE_KEY, type CheckoutAddress as Address } from "@/lib/checkout"

type PaymentMethod = "UPI_MANUAL" | "RAZORPAY"

const COUPON_ERROR_MESSAGES: Record<string, string> = {
  NOT_FOUND: "We couldn't find that code.",
  EXPIRED: "This code has expired.",
  USAGE_LIMIT: "This code has reached its usage limit.",
  MIN_ORDER_NOT_MET: "Your order doesn't meet the minimum for this code.",
  INACTIVE: "This code is no longer active.",
}

export default function PaymentPage() {
  const router = useRouter()
  const { cart, clearCart } = useCart()

  const [address, setAddress] = useState<Address | null>(null)
  const [hydrated, setHydrated] = useState(false)

  const [method, setMethod] = useState<PaymentMethod>("UPI_MANUAL")
  const [confirmed, setConfirmed] = useState(false)
  const [placing, setPlacing] = useState(false)
  const [orderError, setOrderError] = useState("")
  const [reviewBag, setReviewBag] = useState(false)

  const [couponInput, setCouponInput] = useState("")
  const [coupon, setCoupon] = useState<{ code: string; discount: number } | null>(null)
  const [couponError, setCouponError] = useState("")
  const [couponLoading, setCouponLoading] = useState(false)

  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const total = Math.max(0, subtotal - (coupon?.discount ?? 0))

  useEffect(() => {
    try {
      const stored = localStorage.getItem(ADDRESS_STORAGE_KEY)
      if (stored) setAddress(JSON.parse(stored))
    } catch {

    }
    setHydrated(true)

    fetch("/api/warmup", { method: "POST" }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!hydrated || placing) return
    if (cart.length === 0) router.replace("/bag")
    else if (!address) router.replace("/checkout/address")
  }, [hydrated, cart.length, address, router, placing])

  const applyCoupon = async () => {
    const code = couponInput.trim().toUpperCase()
    if (!code) return
    setCouponError("")
    setCouponLoading(true)
    try {
      const res = await fetch("/api/coupons/validate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code, subtotal }),
      })
      const data = await res.json()
      if (data.valid) {
        setCoupon({ code, discount: data.discountAmount ?? 0 })
      } else {
        setCoupon(null)
        setCouponError(COUPON_ERROR_MESSAGES[data.error] ?? "That code isn't valid.")
      }
    } catch {
      setCoupon(null)
      setCouponError("Couldn't check the code. Please try again.")
    } finally {
      setCouponLoading(false)
    }
  }

  const removeCoupon = () => {
    setCoupon(null)
    setCouponInput("")
    setCouponError("")
  }

  const placeOrder = async () => {
    if (!address || cart.length === 0 || !confirmed || placing) return
    setOrderError("")
    setReviewBag(false)
    setPlacing(true)
    try {
      let res: Response | null = null
      for (let attempt = 0; attempt < 3; attempt++) {
        res = await fetch("/api/orders", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            items: cart,
            address,
            amount: subtotal,
            paymentMethod: "UPI_MANUAL",
            ...(coupon ? { couponCode: coupon.code } : {}),
          }),
        })
        if (res.ok || res.status < 500) break
        await new Promise((r) => setTimeout(r, 1500))
      }

      if (!res) throw new Error("no response")

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        if (res.status === 429) {
          setOrderError("Too many attempts. Please wait a few minutes and try again.")
        } else if (data?.code && COUPON_ERROR_MESSAGES[data.code]) {
          setOrderError(`${COUPON_ERROR_MESSAGES[data.code]} Remove the code and try again.`)
          setCoupon(null)
        } else if (data?.errors) {
          const first = Object.values(data.errors as Record<string, string>)[0]
          setOrderError(first ? `Please check your details: ${first}` : "Please check your details and try again.")
        } else if (typeof data?.error === "string") {
          setOrderError(data.error)
          setReviewBag(true)
        } else {
          setOrderError("We couldn't place your order. Please try again.")
        }
        setPlacing(false)
        return
      }

      const data = await res.json()

      if (data.order) {
        try {
          sessionStorage.setItem(`order:${data.orderId}`, JSON.stringify(data.order))
        } catch {

        }
      }
      clearCart()
      localStorage.removeItem(ADDRESS_STORAGE_KEY)

      router.push(`/checkout/success?orderId=${data.orderId}&t=${data.accessToken}`)

    } catch {
      setOrderError("We couldn't place your order. Please check your connection and try again.")
      setPlacing(false)
    }
  }

  if (!hydrated || !address || cart.length === 0) return null

  return (
    <div className="bg-white text-black">
      <section className="pb-20 pt-12 sm:pb-24 sm:pt-16 lg:pb-32 lg:pt-20">
        <div className="container-max">
          <PageHeading title="Checkout" />

          <div className="mt-10 lg:mt-12">
            <CheckoutSteps current="payment" />
          </div>

          <div className="mt-14 grid grid-cols-1 gap-12 lg:mt-16 lg:grid-cols-12 lg:gap-16">

            <div className="space-y-12 lg:col-span-7">

              <FadeIn>
                <div className="flex items-baseline justify-between">
                  <h2 className="font-cinzel text-base font-bold uppercase tracking-[0.15em] sm:text-lg">
                    Shipping to
                  </h2>
                  <Link
                    href="/checkout/address"
                    className="font-jost text-sm text-black/60 underline-offset-4 transition-colors hover:text-black hover:underline"
                  >
                    Change
                  </Link>
                </div>
                <address className="mt-4 rounded-lg border border-black/10 p-5 font-jost text-sm not-italic leading-relaxed text-black/75 sm:text-base">
                  <p className="font-semibold text-black">{address.fullName}</p>
                  <p>
                    {address.addressLine1}
                    {address.addressLine2 ? `, ${address.addressLine2}` : ""}
                  </p>
                  <p>
                    {address.city}, {address.state} {address.pincode}
                  </p>
                  <p className="mt-2 text-black/60">
                    {address.phone} · {address.email}
                  </p>
                </address>
              </FadeIn>

              <FadeIn delay={80}>
                <h2 className="font-cinzel text-base font-bold uppercase tracking-[0.15em] sm:text-lg">
                  Payment method
                </h2>

                <div role="radiogroup" aria-label="Payment method" className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                  <MethodOption
                    icon={QrCode}
                    title="UPI"
                    description="Scan the QR code with any UPI app."
                    selected={method === "UPI_MANUAL"}
                    onSelect={() => setMethod("UPI_MANUAL")}
                  />
                  <MethodOption
                    icon={CreditCard}
                    title="Cards, net banking & wallets"
                    description="Secure online payment."
                    badge="Coming soon"
                    disabled
                    selected={false}
                    onSelect={() => {}}
                  />
                </div>

                <div className="mt-6 rounded-lg border border-black/10 p-6 sm:p-8">
                  <div className="grid grid-cols-1 items-center gap-8 sm:grid-cols-[auto_1fr]">
                    <div className="mx-auto w-56 shrink-0 overflow-hidden rounded-lg border border-black/10 bg-white p-2 sm:w-60">
                      <Image
                        src="/payments/upi.jpg"
                        alt="UPI QR code for Piyush Bholla"
                        width={300}
                        height={300}
                        className="h-auto w-full"
                      />
                    </div>
                    <div className="font-jost">
                      <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">
                        Amount to pay
                      </p>
                      <p className="mt-1 text-3xl font-semibold tabular-nums">{formatRupees(total)}</p>
                      <ol className="mt-6 space-y-3 text-sm leading-relaxed text-black/75">
                        <li className="flex gap-3">
                          <span className="font-semibold text-black">1.</span>
                          Open any UPI app (Paytm, Google Pay, PhonePe, BHIM) and scan the code.
                        </li>
                        <li className="flex gap-3">
                          <span className="font-semibold text-black">2.</span>
                          Pay exactly {formatRupees(total)}.
                        </li>
                        <li className="flex gap-3">
                          <span className="font-semibold text-black">3.</span>
                          Confirm below and place your order. We verify the payment and email you once it is confirmed.
                        </li>
                      </ol>
                    </div>
                  </div>

                  <label className="mt-8 flex cursor-pointer items-start gap-3 border-t border-black/10 pt-6">
                    <span className="relative mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                      <input
                        type="checkbox"
                        checked={confirmed}
                        onChange={(e) => setConfirmed(e.target.checked)}
                        className="peer h-5 w-5 cursor-pointer appearance-none rounded border border-black/30 transition-colors checked:border-black checked:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
                      />
                      <Check
                        className="pointer-events-none absolute h-3.5 w-3.5 text-white opacity-0 peer-checked:opacity-100"
                        strokeWidth={3}
                        aria-hidden
                      />
                    </span>
                    <span className="font-jost text-sm leading-relaxed text-black/80">
                      I have completed the UPI payment of {formatRupees(total)} and confirm my order details are correct.
                    </span>
                  </label>
                </div>
              </FadeIn>

              {orderError && (
                <div
                  role="alert"
                  className="flex items-start gap-3 rounded-lg border border-red-200 bg-red-50 p-4 font-jost text-sm text-red-800"
                >
                  <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={2} aria-hidden />
                  <div>
                    <p>{orderError}</p>
                    {reviewBag && <Link href="/bag" className="mt-2 inline-block font-semibold underline underline-offset-4">Review your bag</Link>}
                  </div>
                </div>
              )}
            </div>

            <FadeIn delay={120} className="lg:col-span-5">
              <OrderSummary
                discount={coupon?.discount ?? 0}
                footer={
                  <>
                    <button
                      type="button"
                      onClick={placeOrder}
                      disabled={!confirmed || placing}
                      className="btn-solid-dark w-full disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black disabled:hover:text-white"
                    >
                      {placing ? "Placing order…" : "Place order"}
                    </button>
                    {!confirmed && (
                      <p className="mt-3 text-center font-jost text-xs text-black/50">
                        Confirm your UPI payment above to continue.
                      </p>
                    )}
                  </>
                }
              >

                <div>
                  <p className="font-jost text-xs font-semibold uppercase tracking-[0.15em] text-black/70">
                    Promo code
                  </p>
                  {coupon ? (
                    <div className="mt-2 flex items-center justify-between rounded-lg border border-black bg-black/[0.03] px-4 py-3 font-jost text-sm">
                      <span>
                        <span className="font-semibold tracking-wide">{coupon.code}</span>
                        <span className="ml-2 text-black/60">−{formatRupees(coupon.discount)}</span>
                      </span>
                      <button
                        type="button"
                        onClick={removeCoupon}
                        className="text-black/60 underline-offset-4 hover:text-black hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <form
                      onSubmit={(e) => {
                        e.preventDefault()
                        applyCoupon()
                      }}
                      className="mt-2 flex gap-2"
                    >
                      <input
                        type="text"
                        value={couponInput}
                        onChange={(e) => {
                          setCouponInput(e.target.value.toUpperCase())
                          setCouponError("")
                        }}
                        placeholder="Enter code"
                        aria-label="Promo code"
                        aria-invalid={Boolean(couponError)}
                        className={`min-w-0 flex-1 rounded-lg border bg-white px-4 py-2.5 font-jost text-sm uppercase tracking-wide placeholder:normal-case placeholder:tracking-normal placeholder:text-black/35 focus:outline-none focus:ring-1 ${
                          couponError
                            ? "border-red-500 focus:border-red-500 focus:ring-red-500"
                            : "border-black/15 focus:border-black focus:ring-black"
                        }`}
                      />
                      <button
                        type="submit"
                        disabled={!couponInput.trim() || couponLoading}
                        className="btn-outline-dark !px-5 !py-2.5 !text-xs disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-transparent disabled:hover:text-black"
                      >
                        {couponLoading ? "…" : "Apply"}
                      </button>
                    </form>
                  )}
                  {couponError && (
                    <p role="alert" className="mt-2 font-jost text-xs text-red-600">
                      {couponError}
                    </p>
                  )}
                </div>
              </OrderSummary>
            </FadeIn>
          </div>
        </div>
      </section>
    </div>
  )
}

function MethodOption({
  icon: Icon,
  title,
  description,
  badge,
  selected,
  disabled = false,
  onSelect,
}: {
  icon: typeof QrCode
  title: string
  description: string
  badge?: string
  selected: boolean
  disabled?: boolean
  onSelect: () => void
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-disabled={disabled}
      disabled={disabled}
      onClick={onSelect}
      className={`relative flex items-start gap-4 rounded-lg border p-5 text-left transition-colors focus-visible:ring-black ${
        selected
          ? "border-black bg-black/[0.03]"
          : disabled
            ? "cursor-not-allowed border-black/10 opacity-60"
            : "border-black/15 hover:border-black"
      }`}
    >
      <span
        className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${
          selected ? "bg-black text-white" : "border border-black/20 text-black/60"
        }`}
      >
        <Icon className="h-5 w-5" strokeWidth={1.5} aria-hidden />
      </span>
      <span className="min-w-0 font-jost">
        <span className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-semibold sm:text-base">{title}</span>
          {badge && (
            <span className="rounded-full border border-black/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.15em] text-black/60">
              {badge}
            </span>
          )}
        </span>
        <span className="mt-1 block text-xs leading-relaxed text-black/60 sm:text-sm">{description}</span>
      </span>
      {selected && (
        <span className="absolute right-4 top-4 flex h-5 w-5 items-center justify-center rounded-full bg-black" aria-hidden>
          <Check className="h-3 w-3 text-white" strokeWidth={3} />
        </span>
      )}
    </button>
  )
}
