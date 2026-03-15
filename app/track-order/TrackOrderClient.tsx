"use client"

import { useState } from "react"

interface OrderItem {
  id: string
  name: string
  size: string
  quantity: number
}

interface OrderData {
  orderCode: string
  status: string
  createdAt: string
  items: OrderItem[]
}

export default function TrackOrderClient() {
  const [orderCode, setOrderCode] = useState("")
  const [phone, setPhone] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [order, setOrder] = useState<OrderData | null>(null)

  async function handleTrack(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setOrder(null)
    setLoading(true)

    const res = await fetch("/api/orders/track", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ orderCode, phone }),
    })

    if (!res.ok) {
      setLoading(false)
      setError("Order not found or phone number mismatch")
      return
    }

    const data = await res.json()
    setOrder(data)
    setLoading(false)
  }

  return (
    <div className="max-w-2xl mx-auto py-10 px-4">
      <h1 className="text-2xl font-semibold mb-6">Track Your Order</h1>

      <form onSubmit={handleTrack} className="space-y-4 mb-8">
        <input
          type="text"
          placeholder="Order Code"
          className="w-full border rounded px-3 py-2"
          value={orderCode}
          onChange={(e) => setOrderCode(e.target.value)}
          required
        />

        <input
          type="tel"
          placeholder="Phone Number"
          className="w-full border rounded px-3 py-2"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          required
        />

        {error && <p className="text-red-600 text-sm">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-lg py-3 font-semibold text-white
                  bg-gradient-to-r from-fashion-gold to-amber-500
                  hover:from-amber-500 hover:to-fashion-gold
                  shadow-md hover:shadow-xl
                  transform hover:-translate-y-0.5 active:translate-y-0
                  transition-all duration-300"
        >
          {loading ? "Checking..." : "Track Order"}
        </button>
      </form>

      {order && (
        <div className="border rounded-lg p-6 space-y-4">
          <div className="flex justify-between">
            <div>
              <p className="text-sm text-gray-500">Order Code</p>
              <p className="font-medium">{order.orderCode}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="font-semibold">{order.status.replace(/_/g, " ")}</p>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-500">Order Date</p>
            <p className="font-medium">
              {new Date(order.createdAt).toLocaleDateString()}
            </p>
          </div>

          <div>
            <p className="text-sm text-gray-500 mb-1">Items</p>
            <ul className="space-y-2">
              {order.items.map((item, idx) => (
                <li
                  key={`${item.id}-${idx}`}
                  className="grid grid-cols-3 gap-4 border rounded px-3 py-2 text-sm"
                >
                  <div>
                    <span className="font-medium">Item:</span> {item.name}
                  </div>
                  <div>
                    <span className="font-medium">Size:</span> {item.size}
                  </div>
                  <div>
                    <span className="font-medium">Quantity:</span> {item.quantity}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </div>
  )
}
