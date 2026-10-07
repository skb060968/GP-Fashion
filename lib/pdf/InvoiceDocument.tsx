

import path from "node:path"
import { readFileSync } from "node:fs"
import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer"
import { formatDateDDMMYYYY } from "@/lib/date"
import { paymentLabel, statusLabel } from "@/lib/orders/labels"
import { contact } from "@/lib/data/contact"

export type InvoiceOrder = {
  orderCode: string
  amount: number
  discount: number
  couponCode: string | null
  paymentMethod: string
  status: string
  createdAt: Date | string
  address: {
    fullName: string
    phone: string
    email: string | null
    addressLine1: string
    addressLine2: string | null
    city: string
    state: string
    pincode: string
  } | null
  items: { id: string; name: string; size: string; price: number; quantity: number }[]
}

const FONT_DIR = path.join(process.cwd(), "lib", "pdf", "fonts")
const LOGO_PATH = path.join(process.cwd(), "public", "images", "brand", "logo-mark.png")

let logoBuffer: Buffer | null = null
function logo() {
  if (!logoBuffer) logoBuffer = readFileSync(LOGO_PATH)
  return { data: logoBuffer, format: "png" as const }
}

let fontsRegistered = false
function registerFonts() {
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

const rupees = (paise: number) => `\u20B9${(paise / 100).toLocaleString("en-IN")}`

const BLACK = "#000000"
const MUTED = "#6b6b6b"
const FAINT = "#9a9a9a"
const RULE = "#e5e5e5"

const s = StyleSheet.create({
  page: {
    paddingTop: 48,
    paddingBottom: 56,
    paddingHorizontal: 48,
    fontFamily: "Jost",
    fontSize: 10,
    color: BLACK,
    lineHeight: 1.45,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: RULE,
  },
  brand: { alignItems: "center" },
  logo: { height: 44, width: 29 },
  wordmark: { fontFamily: "Cinzel", fontWeight: 700, fontSize: 10, letterSpacing: 2.5, marginTop: 6 },
  title: { fontFamily: "Cinzel", fontWeight: 700, fontSize: 18, letterSpacing: 4, textAlign: "right" },
  meta: { color: MUTED, textAlign: "right", marginTop: 2 },
  metaStrong: { color: BLACK, fontWeight: 600 },

  parties: { flexDirection: "row", justifyContent: "space-between", paddingVertical: 22 },
  party: { width: "48%" },
  label: { fontSize: 7.5, fontWeight: 600, letterSpacing: 1.6, color: FAINT, textTransform: "uppercase" },
  partyBody: { marginTop: 7, color: "#404040" },
  strong: { color: BLACK, fontWeight: 600 },
  muted: { color: MUTED },
  right: { textAlign: "right" },
  kv: { flexDirection: "row", justifyContent: "flex-end", marginTop: 2 },
  kvKey: { color: FAINT, marginRight: 10 },

  table: { borderTopWidth: 1, borderTopColor: RULE },
  thead: {
    flexDirection: "row",
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: RULE,
  },
  th: { fontSize: 7.5, fontWeight: 600, letterSpacing: 1.4, color: FAINT, textTransform: "uppercase" },
  tr: { flexDirection: "row", paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: RULE },
  cItem: { width: "46%" },
  cSize: { width: "12%" },
  cPrice: { width: "16%", textAlign: "right" },
  cQty: { width: "8%", textAlign: "right" },
  cTotal: { width: "18%", textAlign: "right" },

  totals: { alignSelf: "flex-end", width: 220, marginTop: 16 },
  totalRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 3 },
  grand: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: RULE,
    fontSize: 12,
    fontWeight: 600,
  },
  grandKey: { letterSpacing: 1.6, textTransform: "uppercase" },

  footer: {
    position: "absolute",
    left: 48,
    right: 48,
    bottom: 32,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: RULE,
    textAlign: "center",
    fontSize: 8,
    color: FAINT,
  },
})

export default function InvoiceDocument({ order }: { order: InvoiceOrder }) {
  registerFonts()
  const subtotal = order.amount + order.discount
  const a = order.address

  return (
    <Document
      title={`Invoice ${order.orderCode}`}
      author="Piyush Bholla Label"
      subject={`Invoice for order ${order.orderCode}`}
    >
      <Page size="A4" style={s.page}>

        <View style={s.header}>
          <View style={s.brand}>
            <Image src={logo()} style={s.logo} />
            <Text style={s.wordmark}>PIYUSH BHOLLA</Text>
          </View>
          <View>
            <Text style={s.title}>INVOICE</Text>
            <Text style={s.meta}>
              No. <Text style={s.metaStrong}>{order.orderCode}</Text>
            </Text>
            <Text style={s.meta}>Date {formatDateDDMMYYYY(order.createdAt)}</Text>
          </View>
        </View>

        <View style={s.parties}>
          <View style={s.party}>
            <Text style={s.label}>Billed to</Text>
            {a && (
              <View style={s.partyBody}>
                <Text style={s.strong}>{a.fullName}</Text>
                <Text>
                  {a.addressLine1}
                  {a.addressLine2 ? `, ${a.addressLine2}` : ""}
                </Text>
                <Text>
                  {a.city}, {a.state} {a.pincode}
                </Text>
                <Text style={s.muted}>{a.phone}</Text>
                {a.email ? <Text style={s.muted}>{a.email}</Text> : null}
              </View>
            )}
          </View>

          <View style={s.party}>
            <Text style={[s.label, s.right]}>From</Text>
            <View style={s.partyBody}>
              <Text style={[s.strong, s.right]}>Piyush Bholla Label</Text>
              <Text style={s.right}>{contact.location}</Text>
              <Text style={[s.muted, s.right]}>{contact.email}</Text>
              <Text style={[s.muted, s.right]}>{contact.phone}</Text>
            </View>
            <View style={{ marginTop: 12 }}>
              <View style={s.kv}>
                <Text style={s.kvKey}>Payment</Text>
                <Text>{paymentLabel(order.paymentMethod)}</Text>
              </View>
              <View style={s.kv}>
                <Text style={s.kvKey}>Status</Text>
                <Text>{statusLabel(order.status)}</Text>
              </View>
            </View>
          </View>
        </View>

        <View style={s.table}>
          <View style={s.thead}>
            <Text style={[s.th, s.cItem]}>Item</Text>
            <Text style={[s.th, s.cSize]}>Size</Text>
            <Text style={[s.th, s.cPrice]}>Price</Text>
            <Text style={[s.th, s.cQty]}>Qty</Text>
            <Text style={[s.th, s.cTotal]}>Total</Text>
          </View>
          {order.items.map((item) => (
            <View key={item.id} style={s.tr} wrap={false}>
              <Text style={[s.cItem, s.strong]}>{item.name}</Text>
              <Text style={[s.cSize, s.muted]}>{item.size}</Text>
              <Text style={[s.cPrice, s.muted]}>{rupees(item.price)}</Text>
              <Text style={[s.cQty, s.muted]}>{item.quantity}</Text>
              <Text style={s.cTotal}>{rupees(item.price * item.quantity)}</Text>
            </View>
          ))}
        </View>

        <View style={s.totals}>
          <View style={s.totalRow}>
            <Text style={s.muted}>Subtotal</Text>
            <Text>{rupees(subtotal)}</Text>
          </View>
          {order.discount > 0 && (
            <View style={s.totalRow}>
              <Text style={s.muted}>Discount{order.couponCode ? ` (${order.couponCode})` : ""}</Text>
              <Text>-{rupees(order.discount)}</Text>
            </View>
          )}
          <View style={s.totalRow}>
            <Text style={s.muted}>Shipping</Text>
            <Text style={s.muted}>Complimentary</Text>
          </View>
          <View style={s.grand}>
            <Text style={s.grandKey}>Total</Text>
            <Text>{rupees(order.amount)}</Text>
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text>Thank you for shopping with Piyush Bholla.</Text>
          <Text>This invoice is generated electronically and does not require a signature.</Text>
        </View>
      </Page>
    </Document>
  )
}
