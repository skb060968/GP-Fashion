"use client"

import { Suspense, useEffect, useState } from "react"
import { useParams, useSearchParams } from "next/navigation"
import Image from "next/image"
import Link from "next/link"
import { Download, Printer } from "lucide-react"
import { formatRupees, formatRupeesExact } from "@/lib/money"
import { formatDateDDMMYYYY } from "@/lib/date"
import { orderDocument, type DocumentOrder } from "@/lib/orders/orderDocument"

export default function InvoicePage() {
  return (
    <Suspense fallback={null}>
      <InvoiceContent />
    </Suspense>
  )
}

const TH = "py-3 pr-4 font-semibold"
const TD = "py-3 pr-4 align-top"

function InvoiceContent() {
  const { orderId } = useParams<{ orderId: string }>()

  const token = useSearchParams().get("t")
  const query = token ? `?t=${token}` : ""
  const [order, setOrder] = useState<DocumentOrder | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch(`/api/orders/${orderId}${query}`, { credentials: "same-origin" })
      .then((r) => (r.ok ? r.json() : null))
      .then(setOrder)
      .catch(() => setOrder(null))
      .finally(() => setLoading(false))
  }, [orderId, query])

  const doc = order ? orderDocument(order) : null
  const fileName = doc?.fileName

  useEffect(() => {
    if (fileName) document.title = fileName
    return () => {
      document.title = "Piyush Bholla"
    }
  }, [fileName])

  if (loading) {
    return (
      <p className="py-40 text-center font-jost text-black/60" aria-live="polite">
        Loading…
      </p>
    )
  }

  if (!doc) {
    return (
      <div className="mx-auto max-w-md px-4 py-32 text-center">
        <h1 className="font-cinzel text-xl font-bold uppercase tracking-[0.04em]">Document not available</h1>
        <p className="mt-4 font-jost text-black/65">
          We couldn&apos;t find that order, or you need to verify it first. Track the order with your mobile number, or sign in to the account that placed it.
        </p>
        <div className="mt-8 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Link href="/track-order" className="btn-outline-dark">Track an order</Link>
          <Link href={`/login?next=/invoice/${orderId}`} className="btn-solid-dark">Sign in</Link>
        </div>
      </div>
    )
  }

  const isInvoice = doc.kind === "tax-invoice"

  return (
    <div className="bg-white text-black">
      <section className="pb-20 pt-12 sm:pb-24 sm:pt-16 lg:pb-32 lg:pt-20 print:p-0">
        <div className="container-max">

          <div className="mx-auto mb-8 flex max-w-4xl flex-col items-center gap-4 print:hidden sm:flex-row sm:justify-between">
            <Link
              href="/track-order"
              className="font-jost text-sm text-black/60 underline-offset-4 transition-colors hover:text-black hover:underline"
            >
              ← Track order
            </Link>
            <div className="flex flex-col items-center gap-3 sm:flex-row">
              <button type="button" onClick={() => window.print()} className="btn-outline-dark">
                <Printer className="mr-3 h-4 w-4" strokeWidth={1.5} aria-hidden />
                Print
              </button>
              <a href={`/api/invoice/${doc.orderCode}.pdf${query}`} download className="btn-solid-dark">
                <Download className="mr-3 h-4 w-4" strokeWidth={1.5} aria-hidden />
                Download PDF
              </a>
            </div>
          </div>

          <article className="invoice-card mx-auto max-w-4xl border border-black/10 bg-white p-6 sm:p-12 print:border-0 print:p-0">

            <header className="flex flex-col items-start justify-between gap-8 border-b border-black/10 pb-8 sm:flex-row sm:items-center">
              <div className="flex flex-col items-center">
                <Image src="/images/brand/logo-mark.png" alt="" width={213} height={320} priority className="h-14 w-auto" />
                <span className="mt-2 whitespace-nowrap font-cinzel text-base font-bold uppercase tracking-[0.04em]">Piyush Bholla</span>
              </div>
              <div className="font-jost sm:text-right">
                <h1 className="font-cinzel text-2xl font-bold uppercase tracking-[0.04em]">{doc.title}</h1>
                <p className="mt-2 text-sm text-black/60">
                  {doc.numberLabel} <span className="font-semibold text-black">{doc.number}</span>
                </p>
                <p className="text-sm text-black/60">Date {formatDateDDMMYYYY(doc.date)}</p>
                {isInvoice && (
                  <p className="text-sm text-black/60">
                    Order {doc.orderCode} · placed {formatDateDDMMYYYY(doc.orderDate)}
                  </p>
                )}
              </div>
            </header>

            {doc.specimen && (
              <p role="note" className="mt-6 border border-amber-600 bg-amber-50 p-3 text-center font-jost text-sm font-semibold text-amber-900">
                Specimen. The seller GSTIN is a placeholder, so this document is not valid for tax purposes.
              </p>
            )}

            <div className="grid grid-cols-1 gap-8 py-8 font-jost text-sm sm:grid-cols-2">
              <div>
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/60">{isInvoice ? "Billed and shipped to" : "Shipping to"}</p>
                {doc.buyer && (
                  <address className="mt-3 not-italic leading-relaxed text-black/75">
                    <span className="font-semibold text-black">{doc.buyer.name}</span>
                    {doc.buyer.attention && <><br />Attn. {doc.buyer.attention}</>}
                    {doc.buyer.lines.map((l) => (
                      <span key={l}><br />{l}</span>
                    ))}
                    <br />
                    <span className="text-black/60">{doc.buyer.phone}</span>
                    {doc.buyer.email && <><br /><span className="text-black/60">{doc.buyer.email}</span></>}
                    {doc.buyer.gstin && <><br />GSTIN <span className="font-semibold text-black">{doc.buyer.gstin}</span></>}
                  </address>
                )}
                {isInvoice && (
                  <p className="mt-4 text-black/75">
                    <span className="text-black/60">Place of supply</span> {doc.placeOfSupply}
                  </p>
                )}
              </div>
              <div className="sm:text-right">
                <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/60">{isInvoice ? "Sold by" : "From"}</p>
                <address className="mt-3 not-italic leading-relaxed text-black/75">
                  <span className="font-semibold text-black">{doc.seller.name}</span>
                  {doc.seller.addressLines.map((l) => (
                    <span key={l}><br />{l}</span>
                  ))}
                  <br />
                  State {doc.seller.state}
                  <br />
                  GSTIN <span className="font-semibold text-black">{doc.seller.gstin}</span>
                  <br />
                  <span className="text-black/60">{doc.seller.email} · {doc.seller.phone}</span>
                </address>
                <dl className="mt-5 space-y-1 text-black/75">
                  <div className="flex justify-between gap-6 sm:justify-end">
                    <dt className="text-black/60">Payment</dt>
                    <dd>{doc.payment}</dd>
                  </div>
                  {!isInvoice && (
                    <div className="flex justify-between gap-6 sm:justify-end">
                      <dt className="text-black/60">Status</dt>
                      <dd>{doc.status}</dd>
                    </div>
                  )}
                </dl>
              </div>
            </div>

            <div className="overflow-x-auto">
              {isInvoice ? (
                <table className="w-full min-w-[40rem] border-t border-black/10 font-jost text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.12em] text-black/60">
                      <th scope="col" className={TH}>Item</th>
                      <th scope="col" className={TH}>HSN</th>
                      <th scope="col" className={`${TH} text-right`}>Qty</th>
                      <th scope="col" className={`${TH} text-right`}>Taxable value</th>
                      {doc.taxColumns.map((c) => (
                        <th key={c} scope="col" className={`${TH} text-right`}>{c}</th>
                      ))}
                      <th scope="col" className="py-3 text-right font-semibold">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10 border-y border-black/10">
                    {doc.lines.map((l) => (
                      <tr key={l.id}>
                        <td className={`${TD} font-semibold`}>
                          {l.name}
                          <span className="block font-normal text-black/60">{l.detail}</span>
                        </td>
                        <td className={`${TD} tabular-nums text-black/70`}>{l.hsn}</td>
                        <td className={`${TD} text-right tabular-nums text-black/70`}>{l.quantity}</td>
                        <td className={`${TD} text-right tabular-nums`}>{formatRupeesExact(l.taxable)}</td>
                        {l.taxParts.map((t, i) => (
                          <td key={i} className={`${TD} text-right tabular-nums text-black/70`}>{formatRupeesExact(t)}</td>
                        ))}
                        <td className="py-3 text-right align-top tabular-nums">{formatRupeesExact(l.amount)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              ) : (
                <table className="w-full border-t border-black/10 font-jost text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.15em] text-black/60">
                      <th scope="col" className={TH}>Item</th>
                      <th scope="col" className={TH}>Size</th>
                      <th scope="col" className={`${TH} text-right`}>Price</th>
                      <th scope="col" className={`${TH} text-right`}>Qty</th>
                      <th scope="col" className="py-3 text-right font-semibold">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-black/10 border-y border-black/10">
                    {doc.lines.map((l) => (
                      <tr key={l.id}>
                        <td className={`${TD} font-semibold`}>
                          {l.name}
                          {l.color && <span className="block font-normal text-black/60">{l.color}</span>}
                        </td>
                        <td className={`${TD} text-black/70`}>{l.sizeLabel}</td>
                        <td className={`${TD} text-right tabular-nums text-black/70`}>{formatRupees(l.unitPrice)}</td>
                        <td className={`${TD} text-right tabular-nums text-black/70`}>{l.quantity}</td>
                        <td className="py-3 text-right align-top tabular-nums">{formatRupees(l.gross)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            <dl className="ml-auto mt-6 max-w-sm space-y-2 font-jost text-sm text-black/70">
              {isInvoice ? (
                <>
                  <div className="flex justify-between">
                    <dt>Taxable value</dt>
                    <dd className="tabular-nums text-black">{formatRupeesExact(doc.totals.taxableValue)}</dd>
                  </div>
                  {doc.totals.taxParts.map((t) => (
                    <div key={t.label} className="flex justify-between">
                      <dt>{t.label}</dt>
                      <dd className="tabular-nums text-black">{formatRupeesExact(t.value)}</dd>
                    </div>
                  ))}
                </>
              ) : (
                <>
                  <div className="flex justify-between">
                    <dt>Subtotal</dt>
                    <dd className="tabular-nums text-black">{formatRupees(doc.totals.subtotal)}</dd>
                  </div>
                  {doc.totals.discount > 0 && (
                    <div className="flex justify-between">
                      <dt>Discount{doc.totals.couponCode ? ` (${doc.totals.couponCode})` : ""}</dt>
                      <dd className="tabular-nums text-black">−{formatRupeesExact(doc.totals.discount)}</dd>
                    </div>
                  )}
                </>
              )}
              <div className="flex justify-between">
                <dt>Shipping</dt>
                <dd className="text-black/60">Complimentary</dd>
              </div>
              <div className="flex justify-between border-t border-black/10 pt-3 text-base font-semibold text-black">
                <dt className="uppercase tracking-[0.15em]">{isInvoice ? "Invoice total" : "Total"}</dt>
                <dd className="tabular-nums">{formatRupeesExact(doc.totals.total)}</dd>
              </div>
              {isInvoice ? (
                <>
                  {doc.totals.discount > 0 && (
                    <p className="text-right text-xs text-black/60">
                      After a discount of {formatRupeesExact(doc.totals.discount)}{doc.totals.couponCode ? ` (${doc.totals.couponCode})` : ""}
                    </p>
                  )}
                  <p className="text-right text-xs text-black/60">{doc.totals.inWords}</p>
                </>
              ) : (
                <p className="text-right text-xs text-black/60">Includes GST {formatRupeesExact(doc.totals.tax)}</p>
              )}
            </dl>

            {isInvoice ? (
              <div className="mt-10 flex flex-col gap-8 font-jost text-xs leading-relaxed text-black/60 sm:flex-row sm:items-end sm:justify-between">
                <p className="max-w-md">
                  Tax payable on reverse charge: No. Prices on the website include GST; the taxable value is the price paid less the GST shown.
                </p>
                <div className="text-right">
                  <p className="text-sm font-semibold text-black">For {doc.seller.tradeName}</p>
                  <p className="mt-1">This is a computer-generated invoice and does not need a signature.</p>
                </div>
              </div>
            ) : (
              <p className="mt-10 font-jost text-sm text-black/70">
                This is not a tax invoice. Your GST tax invoice is issued when your order ships.
              </p>
            )}

            <footer className="mt-12 border-t border-black/10 pt-6 text-center font-jost text-xs leading-relaxed text-black/60">
              <p>Thank you for shopping with Piyush Bholla.</p>
              <p>This document is generated electronically.</p>
            </footer>
          </article>
        </div>
      </section>
    </div>
  )
}
