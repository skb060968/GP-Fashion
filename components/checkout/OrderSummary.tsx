"use client"

import Image from "next/image"
import type { ReactNode } from "react"
import { useCart } from "@/context/CartContext"
import { formatRupees } from "@/lib/money"

interface OrderSummaryProps {
  /** Discount in the same unit as prices (paise), already validated by the server. */
  discount?: number
  /** Optional slot rendered between the line items and the totals (e.g. coupon input). */
  children?: ReactNode
  /** Optional slot rendered after the totals (e.g. the primary action button). */
  footer?: ReactNode
}

/** Sticky order summary card used on the address and payment steps. */
export default function OrderSummary({ discount = 0, children, footer }: OrderSummaryProps) {
  const { cart } = useCart()
  const itemCount = cart.reduce((n, i) => n + i.quantity, 0)
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)
  const total = Math.max(0, subtotal - discount)

  return (
    <aside className="card-elevated p-6 sm:p-8 lg:sticky lg:top-[calc(var(--nav-h)+2rem)]">
      <div className="flex items-baseline justify-between">
        <h2 className="font-cinzel text-base font-bold uppercase tracking-[0.15em] sm:text-lg">
          Your Order
        </h2>
        <span className="font-jost text-xs uppercase tracking-[0.15em] text-black/50">
          {itemCount} {itemCount === 1 ? "item" : "items"}
        </span>
      </div>

      <ul className="mt-6 max-h-72 space-y-4 overflow-y-auto pr-1">
        {cart.map((item) => (
          <li key={`${item.slug}-${item.size}`} className="flex gap-4">
            <div className="relative aspect-[3/4] w-14 shrink-0 overflow-hidden bg-stone-200">
              <Image src={item.coverThumbnail} alt={item.name} fill sizes="3.5rem" className="object-cover" />
              {item.quantity > 1 && (
                <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 font-jost text-[10px] font-semibold text-white">
                  {item.quantity}
                </span>
              )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col justify-center font-jost">
              <p className="truncate text-sm font-semibold">{item.name}</p>
              <p className="mt-0.5 text-xs text-black/60">Size {item.size}</p>
            </div>
            <p className="self-center font-jost text-sm tabular-nums">
              {formatRupees(item.price * item.quantity)}
            </p>
          </li>
        ))}
      </ul>

      {children && <div className="mt-6 border-t border-black/10 pt-6">{children}</div>}

      <dl className="mt-6 space-y-3 border-t border-black/10 pt-6 font-jost text-sm text-black/70">
        <div className="flex justify-between">
          <dt>Subtotal</dt>
          <dd className="tabular-nums text-black">{formatRupees(subtotal)}</dd>
        </div>
        {discount > 0 && (
          <div className="flex justify-between">
            <dt>Discount</dt>
            <dd className="tabular-nums text-black">−{formatRupees(discount)}</dd>
          </div>
        )}
        <div className="flex justify-between">
          <dt>Shipping</dt>
          <dd className="text-black/50">Complimentary</dd>
        </div>
      </dl>

      <div className="mt-6 flex items-baseline justify-between border-t border-black/10 pt-6 font-jost">
        <span className="text-sm font-semibold uppercase tracking-[0.15em]">Total</span>
        <span className="text-lg font-semibold tabular-nums">{formatRupees(total)}</span>
      </div>

      {footer && <div className="mt-8">{footer}</div>}
    </aside>
  )
}
