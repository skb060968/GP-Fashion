"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import Image from "next/image"
import { formatRupees } from "@/lib/money"
import { formatDateDDMMYYYY } from "@/lib/date"

type Order = {
  orderCode: string        // 👈 use orderCode instead of id
  amount: number           // final paid amount
  discount?: number        // discount applied
  couponCode?: string | null
  paymentMethod: string
  status: string
  createdAt: string
  address: {
    fullName: string
    phone: string
    addressLine1: string
    city: string
    state: string
    pincode: string
  }
  items: {
    name: string
    size: string
    price: number
    quantity: number
  }[]
}

export default function InvoicePage() {
  const { orderId } = useParams<{ orderId: string }>() // this is actually orderCode now
  const router = useRouter()
  const [order, setOrder] = useState<Order | null>(null)

  useEffect(() => {
    fetch(`/api/orders/${orderId}`)
      .then(res => res.json())
      .then(setOrder)
  }, [orderId])

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center text-gray-600 text-lg">
        Loading invoice…
      </div>
    )
  }

  // Use DB values directly
  const subtotal = order.amount + (order.discount ?? 0)
  const discountAmount = order.discount ?? 0
  const orderTotal = order.amount

  return (
    <div className="bg-white px-4 pt-32 pb-10 print:pb-0">
      <div
        id="invoice"
        className="invoice-card max-w-3xl mx-auto bg-white p-10 rounded-xl shadow print:shadow-none border-2 border-fashion-gold"
      >
        {/* HEADER BAR */}
        <div className="flex justify-between items-center border-b pb-4 mb-8">
          <div className="flex items-center gap-4">
        <Image
  src="/payments/logo.png"
  alt="Company Logo"
  width={80}
  height={80}
  className="object-contain"
  priority
/>
            <div>
              <h1 className="text-2xl font-bold text-fashion-black">GP Fashion</h1>
              <p className="text-sm text-gray-600">New Delhi, India</p>
            </div>
          </div>
          <div className="text-right">
            <h2 className="text-2xl font-bold text-fashion-gold">INVOICE</h2>
            <p className="text-sm text-gray-600">
              Date: {formatDateDDMMYYYY(order.createdAt)}
            </p>
          </div>
        </div>

        {/* META */}
        <div className="text-lg text-gray-800 space-y-2 mb-8">
          <p>
            <span className="font-medium">Order Code :</span>{" "}
            <span className="font-mono">{order.orderCode}</span>
          </p>
          <p>
            <span className="font-medium">Status :</span> {order.status}
          </p>
          <p>
            <span className="font-medium">Payment Method :</span>{" "}
            {order.paymentMethod}
          </p>
        </div>

        {/* ADDRESS */}
        <div className="mb-8">
          <h2 className="text-xl font-semibold mb-3">Billing Address</h2>
          <p className="text-base text-gray-700">{order.address.fullName}</p>
          <p className="text-base text-gray-700">{order.address.phone}</p>
          <p className="text-base text-gray-700">{order.address.addressLine1}</p>
          <p className="text-base text-gray-700">
            {order.address.city}, {order.address.state}
          </p>
          <p className="text-base text-gray-700">{order.address.pincode}</p>
        </div>

        {/* ITEMS */}
        <table className="w-full text-base border-t border-b mb-8">
          <thead className="text-left bg-gray-50">
            <tr>
              <th className="py-3 px-2">Item</th>
              <th className="py-3 px-2">Size</th>
              <th className="py-3 px-2 text-right">Unit Price</th>
              <th className="py-3 px-2 text-right">Qty</th>
              <th className="py-3 px-2 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {order.items.map((item, i) => (
              <tr key={i} className="border-t">
                <td className="py-3 px-2">{item.name}</td>
                <td className="py-3 px-2">{item.size}</td>
                <td className="py-3 px-2 text-right">
                  {formatRupees(item.price)}
                </td>
                <td className="py-3 px-2 text-right">{item.quantity}</td>
                <td className="py-3 px-2 text-right">
                  {formatRupees(item.price * item.quantity)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* TOTALS */}
        <div className="text-right text-lg font-semibold mb-10 space-y-1">
          <p>Subtotal : {formatRupees(subtotal)}</p>
          {discountAmount > 0 && (
            <p className="text-gray-700">
              Discount : -{formatRupees(discountAmount)}
              {order.couponCode && (
                <span className="text-sm text-gray-500 ml-1">({order.couponCode})</span>
              )}
            </p>
          )}
          <p className="text-fashion-black font-bold">
            Amount Paid : {formatRupees(orderTotal)}
          </p>
        </div>

        {/* FOOTER NOTES */}
        <div className="text-sm text-gray-600 space-y-2 mb-8">
          <p>Thank you for shopping with us!</p>
          <p>
            This invoice is generated electronically and does not require a
            signature.
          </p>
        </div>

        {/* ACTION BUTTONS */}
        <div className="flex gap-4 justify-center print:hidden">
          <button
            onClick={() => window.print()}
            className="btn-secondary"
          >
            Print / Save PDF
          </button>
          <button
            onClick={() => router.push("/shop")}
            className="btn-secondary"
          >
            Continue Shopping
          </button>
          <button
            onClick={() => router.push("/")}
            className="btn-secondary"
          >
            Go to Home
          </button>
        </div>
      </div>
    </div>
  )
}