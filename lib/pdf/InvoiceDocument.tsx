

import path from "node:path"
import { readFileSync } from "node:fs"
import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer"
import { formatDateDDMMYYYY } from "@/lib/date"
import { formatRupees, formatRupeesExact } from "@/lib/money"
import { orderDocument, type DocumentOrder } from "@/lib/orders/orderDocument"

export type InvoiceOrder = DocumentOrder

const FONT_DIR = path.join(process.cwd(), "lib", "pdf", "fonts")
const LOGO_PATH = path.join(process.cwd(), "public", "images", "brand", "logo-mark.png")

let logoBuffer: Buffer | null = null
export function logo() {
  if (!logoBuffer) logoBuffer = readFileSync(LOGO_PATH)
  return { data: logoBuffer, format: "png" as const }
}

let fontsRegistered = false
export function registerFonts() {
  if (fontsRegistered) return
  Font.register({ family: "Cinzel", src: path.join(FONT_DIR, "Cinzel-Bold.ttf"), fontWeight: 700 })
  Font.register({
    family: "Jost",
    fonts: [
      { src: path.join(FONT_DIR, "Jost-Regular.ttf"), fontWeight: 400 },
      { src: path.join(FONT_DIR, "Jost-SemiBold.ttf"), fontWeight: 600 },
    ],
  })

  Font.registerHyphenationCallback((word) => [word])
  fontsRegistered = true
}

const BLACK = "#000000"
const MUTED = "#6b6b6b"
const FAINT = "#9a9a9a"
const RULE = "#e5e5e5"

export const s = StyleSheet.create({
  page: {
    paddingTop: 44,
    paddingBottom: 64,
    paddingHorizontal: 44,
    fontFamily: "Jost",
    fontSize: 9.5,
    color: BLACK,
    lineHeight: 1.45,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 18,
    borderBottomWidth: 1,
    borderBottomColor: RULE,
  },
  brand: { alignItems: "center" },
  logo: { height: 44, width: 29 },
  wordmark: { fontFamily: "Cinzel", fontWeight: 700, fontSize: 10, letterSpacing: 2.5, marginTop: 6 },
  title: { fontFamily: "Cinzel", fontWeight: 700, fontSize: 17, letterSpacing: 3, textAlign: "right", textTransform: "uppercase" },
  meta: { color: MUTED, textAlign: "right", marginTop: 2 },
  metaStrong: { color: BLACK, fontWeight: 600 },

  specimen: {
    marginTop: 12,
    padding: 8,
    borderWidth: 1,
    borderColor: "#d97706",
    color: "#92400e",
    textAlign: "center",
    fontWeight: 600,
    fontSize: 8.5,
  },

  parties: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 18 },
  party: { width: "48%" },
  label: { fontSize: 7.5, fontWeight: 600, letterSpacing: 1.6, color: FAINT, textTransform: "uppercase" },
  partyBody: { marginTop: 6, color: "#404040" },
  strong: { color: BLACK, fontWeight: 600 },
  muted: { color: MUTED },
  right: { textAlign: "right" },
  kv: { flexDirection: "row", justifyContent: "flex-end", marginTop: 2 },
  kvKey: { color: FAINT, marginRight: 10 },

  table: { borderTopWidth: 1, borderTopColor: RULE },
  thead: { flexDirection: "row", paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: RULE },
  th: { fontSize: 7, fontWeight: 600, letterSpacing: 1.2, color: FAINT, textTransform: "uppercase" },
  tr: { flexDirection: "row", paddingVertical: 7, borderBottomWidth: 1, borderBottomColor: RULE },
  num: { textAlign: "right" },

  totals: { alignSelf: "flex-end", width: 240, marginTop: 14 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 3 },
  grand: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 7,
    paddingTop: 7,
    borderTopWidth: 1,
    borderTopColor: RULE,
    fontSize: 11.5,
    fontWeight: 600,
  },
  grandKey: { letterSpacing: 1.6, textTransform: "uppercase" },
  words: { marginTop: 6, color: MUTED, textAlign: "right", fontSize: 8.5 },

  notes: { marginTop: 22, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  noteText: { width: "58%", color: MUTED, fontSize: 8.5 },
  sign: { width: "36%", alignItems: "flex-end" },
  signLine: { marginTop: 28, borderTopWidth: 1, borderTopColor: RULE, paddingTop: 4, width: "100%", textAlign: "right", color: MUTED, fontSize: 8.5 },

  footer: {
    position: "absolute",
    left: 44,
    right: 44,
    bottom: 30,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: RULE,
    textAlign: "center",
    fontSize: 7.5,
    color: FAINT,
  },
})

export default function InvoiceDocument({ order }: { order: InvoiceOrder }) {
  registerFonts()
  const d = orderDocument(order)
  const isInvoice = d.kind === "tax-invoice"
  const taxCols = d.taxColumns.length

  const w = isInvoice
    ? { item: taxCols === 2 ? "31%" : "39%", hsn: "9%", qty: "6%", taxable: "15%", tax: taxCols === 2 ? "12%" : "16%", amount: "15%" }
    : { item: "46%", size: "16%", price: "16%", qty: "8%", amount: "14%" }

  return (
    <Document title={`${d.title} ${d.number}`} author={d.seller.name} subject={`${d.title} for order ${d.orderCode}`}>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View style={s.brand}>
            <Image src={logo()} style={s.logo} />
            <Text style={s.wordmark}>PIYUSH BHOLLA</Text>
          </View>
          <View>
            <Text style={s.title}>{d.title}</Text>
            <Text style={s.meta}>
              {d.numberLabel} <Text style={s.metaStrong}>{d.number}</Text>
            </Text>
            <Text style={s.meta}>Date {formatDateDDMMYYYY(d.date)}</Text>
            {isInvoice && <Text style={s.meta}>Order {d.orderCode} · placed {formatDateDDMMYYYY(d.orderDate)}</Text>}
          </View>
        </View>

        {d.specimen && (
          <Text style={s.specimen}>SPECIMEN. The seller GSTIN is a placeholder, so this document is not valid for tax purposes.</Text>
        )}

        <View style={s.parties}>
          <View style={s.party}>
            <Text style={s.label}>{d.shipTo ? "Billed to" : isInvoice ? "Billed and shipped to" : "Shipping to"}</Text>
            {d.buyer && (
              <View style={s.partyBody}>
                <Text style={s.strong}>{d.buyer.name}</Text>
                {d.buyer.attention ? <Text>Attn. {d.buyer.attention}</Text> : null}
                {d.buyer.lines.map((l) => <Text key={l}>{l}</Text>)}
                <Text style={s.muted}>{d.buyer.phone}</Text>
                {d.buyer.email ? <Text style={s.muted}>{d.buyer.email}</Text> : null}
                {d.buyer.gstin ? <Text style={{ marginTop: 3 }}>GSTIN <Text style={s.strong}>{d.buyer.gstin}</Text></Text> : null}
              </View>
            )}
            {d.shipTo && (
              <View style={{ marginTop: 10 }}>
                <Text style={s.label}>{isInvoice ? "Shipped to" : "Shipping to"}</Text>
                <View style={s.partyBody}>
                  <Text style={s.strong}>{d.shipTo.name}</Text>
                  {d.shipTo.lines.map((l) => <Text key={l}>{l}</Text>)}
                  <Text style={s.muted}>{d.shipTo.phone}</Text>
                </View>
              </View>
            )}
            {isInvoice && (
              <View style={{ marginTop: 8 }}>
                <Text>
                  <Text style={s.muted}>Place of supply </Text>
                  {d.placeOfSupply}
                </Text>
              </View>
            )}
          </View>

          <View style={s.party}>
            <Text style={[s.label, s.right]}>{isInvoice ? "Sold by" : "From"}</Text>
            <View style={s.partyBody}>
              <Text style={[s.strong, s.right]}>{d.seller.name}</Text>
              {d.seller.addressLines.map((l) => <Text key={l} style={s.right}>{l}</Text>)}
              <Text style={s.right}>State {d.seller.state}</Text>
              <Text style={s.right}>
                GSTIN <Text style={s.strong}>{d.seller.gstin}</Text>
              </Text>
              <Text style={[s.muted, s.right]}>{d.seller.email} · {d.seller.phone}</Text>
            </View>
            <View style={{ marginTop: 8 }}>
              <View style={s.kv}>
                <Text style={s.kvKey}>Payment</Text>
                <Text>{d.payment}</Text>
              </View>
              {!isInvoice && (
                <View style={s.kv}>
                  <Text style={s.kvKey}>Status</Text>
                  <Text>{d.status}</Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {isInvoice ? (
          <View style={s.table}>
            <View style={s.thead}>
              <Text style={[s.th, { width: w.item }]}>Item</Text>
              <Text style={[s.th, { width: w.hsn }]}>HSN</Text>
              <Text style={[s.th, s.num, { width: w.qty }]}>Qty</Text>
              <Text style={[s.th, s.num, { width: w.taxable }]}>Taxable value</Text>
              {d.taxColumns.map((c) => (
                <Text key={c} style={[s.th, s.num, { width: w.tax }]}>{c}</Text>
              ))}
              <Text style={[s.th, s.num, { width: w.amount }]}>Amount</Text>
            </View>
            {d.lines.map((l) => (
              <View key={l.id} style={s.tr} wrap={false}>
                <View style={{ width: w.item, paddingRight: 6 }}>
                  <Text style={s.strong}>{l.name}</Text>
                  <Text style={s.muted}>{l.detail}</Text>
                </View>
                <Text style={[s.muted, { width: w.hsn }]}>{l.hsn}</Text>
                <Text style={[s.muted, s.num, { width: w.qty }]}>{l.quantity}</Text>
                <Text style={[s.num, { width: w.taxable }]}>{formatRupeesExact(l.taxable)}</Text>
                {l.taxParts.map((t, i) => (
                  <Text key={i} style={[s.muted, s.num, { width: w.tax }]}>{formatRupeesExact(t)}</Text>
                ))}
                <Text style={[s.num, { width: w.amount }]}>{formatRupeesExact(l.amount)}</Text>
              </View>
            ))}
          </View>
        ) : (
          <View style={s.table}>
            <View style={s.thead}>
              <Text style={[s.th, { width: w.item }]}>Item</Text>
              <Text style={[s.th, { width: w.size }]}>Size</Text>
              <Text style={[s.th, s.num, { width: w.price }]}>Price</Text>
              <Text style={[s.th, s.num, { width: w.qty }]}>Qty</Text>
              <Text style={[s.th, s.num, { width: w.amount }]}>Total</Text>
            </View>
            {d.lines.map((l) => (
              <View key={l.id} style={s.tr} wrap={false}>
                <View style={{ width: w.item, paddingRight: 6 }}>
                  <Text style={s.strong}>{l.name}</Text>
                  {l.color ? <Text style={s.muted}>{l.color}</Text> : null}
                </View>
                <Text style={[s.muted, { width: w.size }]}>{l.sizeLabel}</Text>
                <Text style={[s.muted, s.num, { width: w.price }]}>{formatRupees(l.unitPrice)}</Text>
                <Text style={[s.muted, s.num, { width: w.qty }]}>{l.quantity}</Text>
                <Text style={[s.num, { width: w.amount }]}>{formatRupees(l.gross)}</Text>
              </View>
            ))}
          </View>
        )}

        <View style={s.totals}>
          {isInvoice ? (
            <>
              <View style={s.totalRow}>
                <Text style={s.muted}>Taxable value</Text>
                <Text>{formatRupeesExact(d.totals.taxableValue)}</Text>
              </View>
              {d.totals.taxParts.map((t) => (
                <View key={t.label} style={s.totalRow}>
                  <Text style={s.muted}>{t.label}</Text>
                  <Text>{formatRupeesExact(t.value)}</Text>
                </View>
              ))}
              <View style={s.totalRow}>
                <Text style={s.muted}>Shipping</Text>
                <Text style={s.muted}>Complimentary</Text>
              </View>
              <View style={s.grand}>
                <Text style={s.grandKey}>Invoice total</Text>
                <Text>{formatRupeesExact(d.totals.total)}</Text>
              </View>
              {d.totals.discount > 0 && (
                <Text style={s.words}>
                  After a discount of {formatRupeesExact(d.totals.discount)}{d.totals.couponCode ? ` (${d.totals.couponCode})` : ""}
                </Text>
              )}
              <Text style={s.words}>{d.totals.inWords}</Text>
            </>
          ) : (
            <>
              <View style={s.totalRow}>
                <Text style={s.muted}>Subtotal</Text>
                <Text>{formatRupees(d.totals.subtotal)}</Text>
              </View>
              {d.totals.discount > 0 && (
                <View style={s.totalRow}>
                  <Text style={s.muted}>Discount{d.totals.couponCode ? ` (${d.totals.couponCode})` : ""}</Text>
                  <Text>-{formatRupeesExact(d.totals.discount)}</Text>
                </View>
              )}
              <View style={s.totalRow}>
                <Text style={s.muted}>Shipping</Text>
                <Text style={s.muted}>Complimentary</Text>
              </View>
              <View style={s.grand}>
                <Text style={s.grandKey}>Total</Text>
                <Text>{formatRupeesExact(d.totals.total)}</Text>
              </View>
              <Text style={s.words}>Includes GST {formatRupeesExact(d.totals.tax)}</Text>
            </>
          )}
        </View>

        {isInvoice ? (
          <View style={s.notes} wrap={false}>
            <Text style={s.noteText}>Tax payable on reverse charge: No. Prices on the website include GST; the taxable value is the price paid less the GST shown.</Text>
            <View style={s.sign}>
              <Text style={s.strong}>For {d.seller.tradeName}</Text>
              <Text style={[s.muted, { marginTop: 4, textAlign: "right", fontSize: 8.5 }]}>This is a computer-generated invoice and does not need a signature.</Text>
            </View>
          </View>
        ) : (
          <View style={s.notes} wrap={false}>
            <Text style={[s.noteText, { width: "100%" }]}>This is not a tax invoice. Your GST tax invoice is issued when your order ships.</Text>
          </View>
        )}

        <View style={s.footer} fixed>
          <Text>Thank you for shopping with Piyush Bholla.</Text>
          <Text>This document is generated electronically.</Text>
        </View>
      </Page>
    </Document>
  )
}
