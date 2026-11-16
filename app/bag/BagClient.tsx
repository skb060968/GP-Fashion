"use client"

import Image from "next/image"
import Link from "next/link"
import { Minus, Plus, ShoppingBag, X } from "lucide-react"
import { cartLineKey, useCart } from "@/context/CartContext"
import { formatRupees } from "@/lib/money"
import { MTM_LEAD_TIME, itemSizeLabel } from "@/lib/measurements/fields"
import FadeIn from "@/components/FadeIn"
import PageHeading from "@/components/PageHeading"
import EmptyState from "@/components/EmptyState"

export default function BagClient({ hiddenSlugs, soldOutSlugs }: { hiddenSlugs: string[]; soldOutSlugs: string[] }) {
  const { cart, removeFromCart, updateQuantity } = useCart()

  const hidden = new Set(hiddenSlugs)
  const soldOut = new Set(soldOutSlugs)
  const unavailableCount = cart.filter((i) => hidden.has(i.slug) || soldOut.has(i.slug)).length
  const itemCount = cart.reduce((n, i) => n + i.quantity, 0)
  const subtotal = cart.reduce((sum, i) => sum + i.price * i.quantity, 0)

  return (
    <div className="bg-white text-black">
      <section className="pb-20 pt-12 sm:pb-24 sm:pt-16 lg:pb-32 lg:pt-20">
        <div className="container-max">
          <PageHeading
            title="Shopping Bag"
            meta={cart.length ? `${itemCount} ${itemCount === 1 ? "item" : "items"}` : undefined}
          />

          {cart.length === 0 ? (
            <EmptyState
              icon={ShoppingBag}
              title="Your bag is empty"
              description="Pieces you add to your bag will appear here, ready for checkout."
              ctaLabel="Continue browsing"
              ctaHref="/"
            />
          ) : (
            <div className="mt-14 grid grid-cols-1 gap-12 lg:mt-16 lg:grid-cols-12 lg:gap-16">

              <ul className="divide-y divide-black/10 lg:col-span-8">
                {cart.map((item, index) => {
                  const isHidden = hidden.has(item.slug)
                  const isSoldOut = !isHidden && soldOut.has(item.slug)
                  const unavailable = isHidden || isSoldOut
                  const image = (
                    <Image
                      src={item.coverThumbnail}
                      alt={item.name}
                      fill
                      sizes="(max-width: 640px) 6rem, 8rem"
                      className={`object-cover ${unavailable ? "opacity-50 grayscale" : ""}`}
                    />
                  )
                  return (
                  <li key={cartLineKey(item)} className="py-8 first:pt-0">
                    <FadeIn delay={index * 60}>
                      <div className="flex gap-5 sm:gap-8">
                        {isHidden ? (
                          <div className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden bg-stone-100 sm:w-32">{image}</div>
                        ) : (
                          <Link
                            href={`/shop/${item.slug}`}
                            className="relative aspect-[3/4] w-24 shrink-0 overflow-hidden bg-stone-100 sm:w-32"
                          >
                            {image}
                          </Link>
                        )}

                        <div className="flex min-w-0 flex-1 flex-col">
                          <div className="flex items-start justify-between gap-4">
                            <div className="min-w-0">
                              <h2 className="font-cinzel text-base font-bold uppercase tracking-[0.12em] sm:text-lg">
                                {isHidden ? (
                                  <span className="text-black/50">{item.name}</span>
                                ) : (
                                  <Link href={`/shop/${item.slug}`} className="hover:text-black/60">
                                    {item.name}
                                  </Link>
                                )}
                              </h2>
                              <p className="mt-1.5 font-jost text-sm text-black/60">
                                {itemSizeLabel(item)}
                                {item.color && <> · {item.color}</>}
                              </p>
                              {unavailable && (
                                <p className="mt-2 font-jost text-sm font-semibold text-red-700">
                                  {isSoldOut ? "Sold out" : "No longer available"}. Please remove it to check out.
                                </p>
                              )}
                              {item.profileId && !unavailable && (
                                <p className="mt-1 font-jost text-xs text-black/60">
                                  Ready in {MTM_LEAD_TIME}. We confirm your measurements before cutting.
                                </p>
                              )}
                            </div>
                            <button
                              type="button"
                              onClick={() => removeFromCart(item)}
                              aria-label={`Remove ${item.name} from bag`}
                              className="-mr-2 -mt-2 rounded p-2 text-black/60 transition-colors hover:text-black focus-visible:ring-black"
                            >
                              <X className="h-5 w-5" strokeWidth={1.5} aria-hidden />
                            </button>
                          </div>

                          <div className="mt-auto flex flex-wrap items-end justify-between gap-4 pt-4">

                            <div className="inline-flex items-center border border-black/20">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item, item.quantity - 1)}
                                disabled={item.quantity <= 1}
                                aria-label="Decrease quantity"
                                className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent focus-visible:ring-black"
                              >
                                <Minus className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                              </button>
                              <span
                                aria-live="polite"
                                className="w-10 text-center font-jost text-sm font-semibold tabular-nums"
                              >
                                {item.quantity}
                              </span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item, item.quantity + 1)}
                                disabled={unavailable}
                                aria-label="Increase quantity"
                                className="flex h-10 w-10 items-center justify-center transition-colors hover:bg-black/5 disabled:opacity-30 disabled:hover:bg-transparent focus-visible:ring-black"
                              >
                                <Plus className="h-4 w-4" strokeWidth={1.5} aria-hidden />
                              </button>
                            </div>

                            <div className="text-right font-jost">
                              <p className="text-base font-semibold tabular-nums sm:text-lg">
                                {formatRupees(item.price * item.quantity)}
                              </p>
                              {item.quantity > 1 && (
                                <p className="mt-0.5 text-xs text-black/60 tabular-nums">
                                  {formatRupees(item.price)} each
                                </p>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </FadeIn>
                  </li>
                  )
                })}
              </ul>

              <FadeIn delay={120} className="lg:col-span-4">
                <aside className="card-elevated p-8 lg:sticky lg:top-[calc(var(--nav-h)+2rem)]">
                  <h2 className="font-cinzel text-lg font-bold uppercase tracking-[0.15em]">
                    Summary
                  </h2>

                  <dl className="mt-6 space-y-3 font-jost text-sm text-black/70 sm:text-base">
                    <div className="flex justify-between">
                      <dt>Subtotal</dt>
                      <dd className="tabular-nums text-black">{formatRupees(subtotal)}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt>Shipping</dt>
                      <dd className="text-black/60">Calculated at checkout</dd>
                    </div>
                  </dl>

                  <div className="mt-6 flex justify-between border-t border-black/10 pt-6 font-jost">
                    <span className="text-base font-semibold uppercase tracking-[0.15em]">Total</span>
                    <span className="text-lg font-semibold tabular-nums">{formatRupees(subtotal)}</span>
                  </div>

                  {unavailableCount > 0 ? (
                    <>
                      <p role="alert" className="mt-6 font-jost text-sm text-red-700">
                        {unavailableCount === 1 ? "One piece in your bag is" : `${unavailableCount} pieces in your bag are`} sold out or no longer available. Remove{" "}
                        {unavailableCount === 1 ? "it" : "them"} to check out.
                      </p>
                      <button type="button" disabled className="btn-solid-dark mt-4 w-full cursor-not-allowed opacity-40 hover:bg-black hover:text-white">
                        Checkout
                      </button>
                    </>
                  ) : (
                    <Link href="/checkout/address" className="btn-solid-dark mt-8 w-full">
                      Checkout
                    </Link>
                  )}
                  <Link
                    href="/"
                    className="mt-4 block text-center font-jost text-sm text-black/60 underline-offset-4 transition-colors hover:text-black hover:underline"
                  >
                    Continue browsing
                  </Link>
                </aside>
              </FadeIn>
            </div>
          )}
        </div>
      </section>
    </div>
  )
}
