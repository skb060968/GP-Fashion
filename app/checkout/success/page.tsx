"use client"

import { useEffect, useState, Suspense } from "react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"
import { formatRupees } from "@/lib/money"

type Order = {
  orderCode: string   // 👈 use orderCode instead of id
  amount: number
  discount?: number
  couponCode?: string | null
  paymentMethod: string
  status: string
}

function SuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("orderId") // this is actually orderCode now

  const [order, setOrder] = useState<Order | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!orderId) {
      setLoading(false)
      return
    }

    fetch(`/api/orders/${orderId}`)
      .then((res) => res.json())
      .then((data) => {
        setOrder(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [orderId])

  if (loading) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-gray-600 text-lg"
        aria-live="polite"
      >
        Loading order confirmation…
      </div>
    )
  }

  if (!order) {
    return (
      <div
        className="min-h-screen flex items-center justify-center text-red-600 text-lg"
        aria-live="polite"
      >
        No order found.
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-white px-4">
      <div className="bg-white rounded-2xl border-2 border-fashion-gold p-8 max-w-md w-full text-center space-y-6 shadow-sm">
        <h1 className="text-3xl font-semibold text-gray-900">
          Order Confirmed 🎉
        </h1>

        <div className="text-lg text-gray-800 space-y-3 text-left">
          <p>
            <span className="font-medium">Order Code :</span>{" "}
            <span className="font-mono">{order.orderCode}</span>
          </p>
          <p>
            <span className="font-medium">Status :</span> {order.status}
          </p>
          {order.discount && order.discount > 0 ? (
            <>
              <p>
                <span className="font-medium">Subtotal :</span>{" "}
                {formatRupees(order.amount + order.discount)}
              </p>
              <p>
                <span className="font-medium">Discount :</span>{" "}
                <span className="text-green-700">-{formatRupees(order.discount)}</span>
                {order.couponCode && (
                  <span className="text-sm text-gray-500 ml-1">({order.couponCode})</span>
                )}
              </p>
              <p>
                <span className="font-medium">Amount Paid :</span>{" "}
                {formatRupees(order.amount)}
              </p>
            </>
          ) : (
            <p>
              <span className="font-medium">Amount :</span>{" "}
              {formatRupees(order.amount)}
            </p>
          )}
          <p>
            <span className="font-medium">Payment Method :</span>{" "}
            {order.paymentMethod}
          </p>
        </div>

        <div className="pt-4 flex flex-col gap-3">
          <Link
            href={`/invoice/${order.orderCode}`} // 👈 use orderCode for invoice link
            className="btn-secondary w-full text-center"
          >
            Download Invoice
          </Link>

          <Link
            href="/shop"
            className="btn-secondary w-full text-center"
          >
            Continue Shopping
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading…</div>}>
      <SuccessContent />
    </Suspense>
  )
}