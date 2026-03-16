"use client"

import { useCart } from "@/context/CartContext"
import Image from "next/image"
import Link from "next/link"
import { formatRupees } from "@/lib/money"

export default function CartPage() {
  const { cart, removeFromCart, updateQuantity } = useCart()

  // ✅ subtotal includes quantity
  const subtotal = cart.reduce(
    (sum: number, item) => sum + item.price * item.quantity,
    0
  )

  if (cart.length === 0) {
    return (
      <section className="bg-white pt-24 pb-16">
        <div className="container-max text-center">
          <h1 className="font-serif text-3xl font-bold mb-6">Your Cart</h1>
          <p className="text-gray-600 mb-8">Your cart is empty.</p>

          <Link
            href="/shop"
            className="btn-secondary inline-flex items-center justify-center"
          >
            Back to Shop
          </Link>
        </div>
      </section>
    )
  }

  return (
    <section className="bg-white pt-24 pb-20">
      <div className="container-max">
        <h1 className="font-serif text-3xl font-bold mb-10">Your Cart</h1>

        {/* Cart Items */}
        <div className="space-y-6">
          {cart.map((item, index) => (
            <div
              key={`${item.slug}-${item.size}-${index}`}
              className="
                flex flex-col sm:flex-row
                sm:items-center sm:justify-between
                gap-6
                bg-white
                rounded-2xl
                shadow-sm
                p-6
              "
            >
              <div className="flex items-center gap-5">
                <Image
  src={item.coverThumbnail}
  alt={item.name}
  width={75}
  height={100}
  className="rounded-xl object-cover"
  
/>

                <div>
                  <h2 className="font-serif text-xl font-semibold text-fashion-black">
                    {item.name}
                  </h2>
                  <p className="text-sm text-gray-600 mt-1">Size: {item.size}</p>

                  {/* ✅ Unit price */}
                  <p className="text-sm text-gray-500">
                    Unit Price: {formatRupees(item.price)}
                  </p>

                  {/* ✅ Line total */}
                  <p className="mt-1 text-fashion-gold font-semibold">
                    Total: {formatRupees(item.price * item.quantity)}
                  </p>

                  {/* ✅ Quantity selector */}
                  <div className="mt-2 flex items-center gap-2">
                    <label className="text-sm text-gray-600">Qty:</label>
                    <input
                      type="number"
                      min={1}
                      value={item.quantity}
                      onChange={(e) =>
                        updateQuantity(item.slug, item.size, parseInt(e.target.value))
                      }
                      className="w-16 border rounded px-2 py-1"
                    />
                  </div>
                </div>
              </div>

              <button
                onClick={() => removeFromCart(item.slug, item.size)}
                className="
                  self-start sm:self-auto
                  px-5 py-2.5
                  rounded-full
                  text-sm font-medium
                  text-red-600
                  border border-red-200
                  transition
                  hover:bg-red-50
                "
              >
                Remove
              </button>
            </div>
          ))}
        </div>

        {/* Cart Summary */}
        <div className="mt-16 border-t border-gray-200 pt-8">
          {/* ✅ Grand total */}
          <div className="max-w-xl ml-auto mb-10">
            <div className="flex items-center justify-between text-lg font-medium text-fashion-black">
              <span>Total Amount</span>
              <span>{formatRupees(subtotal)}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
            <Link
              href="/shop"
              className="btn-secondary w-full sm:w-auto inline-flex items-center justify-center"
            >
              Continue Shopping
            </Link>

            <Link
              href="/checkout/address"
              className="btn-primary w-full sm:w-auto inline-flex items-center justify-center"
            >
              Proceed to Checkout
            </Link>
          </div>
        </div>
      </div>
    </section>
  )
}