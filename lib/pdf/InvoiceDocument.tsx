import {
  Document,
  Page,
  View,
  Text,
  Image,
  StyleSheet,
} from "@react-pdf/renderer"
import { formatRupees } from "@/lib/money"
import { formatDateDDMMYYYY } from "@/lib/date"

export interface InvoiceDocumentProps {
  order: {
    orderCode: string
    amount: number
    discount: number
    couponCode: string | null
    paymentMethod: string
    status: string
    createdAt: Date
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
  logoSrc: string
}

const GOLD = "#c8a951"

const styles = StyleSheet.create({
  page: {
    padding: 40,
    fontSize: 11,
    fontFamily: "Helvetica",
    color: "#1a1a1a",
  },
  /* ── Header ── */
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderBottomWidth: 1,
    borderBottomColor: "#e5e5e5",
    paddingBottom: 12,
    marginBottom: 24,
  },
  headerLeft: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },
  logo: {
    width: 60,
    height: 60,
    objectFit: "contain",
  },
  companyName: {
    fontSize: 18,
    fontFamily: "Helvetica-Bold",
  },
  companyLocation: {
    fontSize: 10,
    color: "#666666",
  },
  headerRight: {
    alignItems: "flex-end",
  },
  invoiceTitle: {
    fontSize: 20,
    fontFamily: "Helvetica-Bold",
    color: GOLD,
  },
  invoiceDate: {
    fontSize: 10,
    color: "#666666",
    marginTop: 2,
  },

  /* ── Order Meta ── */
  metaSection: {
    marginBottom: 24,
  },
  metaRow: {
    flexDirection: "row",
    marginBottom: 4,
    fontSize: 11,
  },
  metaLabel: {
    fontFamily: "Helvetica-Bold",
    marginRight: 4,
  },
  metaValue: {
    fontFamily: "Courier",
  },

  /* ── Billing Address ── */
  addressSection: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: "Helvetica-Bold",
    marginBottom: 8,
  },
  addressLine: {
    fontSize: 11,
    color: "#444444",
    marginBottom: 2,
  },
  /* ── Items Table ── */
  table: {
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: "#e5e5e5",
    marginBottom: 24,
  },
  tableHeader: {
    flexDirection: "row",
    backgroundColor: "#f9f9f9",
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  tableRow: {
    flexDirection: "row",
    borderTopWidth: 1,
    borderTopColor: "#e5e5e5",
    paddingVertical: 8,
    paddingHorizontal: 6,
  },
  colItem: { width: "35%" },
  colSize: { width: "15%" },
  colPrice: { width: "18%", textAlign: "right" },
  colQty: { width: "12%", textAlign: "right" },
  colTotal: { width: "20%", textAlign: "right" },
  thText: {
    fontFamily: "Helvetica-Bold",
    fontSize: 10,
  },
  tdText: {
    fontSize: 10,
  },

  /* ── Totals ── */
  totalsSection: {
    alignItems: "flex-end",
    marginBottom: 30,
  },
  totalRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    marginBottom: 3,
    fontSize: 12,
  },
  totalLabel: {
    fontFamily: "Helvetica-Bold",
    marginRight: 8,
  },
  totalValue: {
    width: 100,
    textAlign: "right",
  },
  discountText: {
    color: "#444444",
  },
  amountPaid: {
    fontFamily: "Helvetica-Bold",
    fontSize: 13,
  },
  couponCode: {
    fontSize: 9,
    color: "#888888",
    marginLeft: 4,
  },

  /* ── Footer ── */
  footer: {
    marginTop: 10,
    fontSize: 10,
    color: "#666666",
  },
  footerLine: {
    marginBottom: 4,
  },
})

export function InvoiceDocument({ order, logoSrc }: InvoiceDocumentProps) {
  const subtotal = order.amount + order.discount
  const discountAmount = order.discount

  return (
    <Document>
      <Page size="A4" style={styles.page}>
        {/* ── Header ── */}
        <View style={styles.headerRow}>
          <View style={styles.headerLeft}>
            <Image src={logoSrc} style={styles.logo} />
            <View>
              <Text style={styles.companyName}>GP Fashion</Text>
              <Text style={styles.companyLocation}>New Delhi, India</Text>
            </View>
          </View>
          <View style={styles.headerRight}>
            <Text style={styles.invoiceTitle}>INVOICE</Text>
            <Text style={styles.invoiceDate}>
              Date: {formatDateDDMMYYYY(order.createdAt)}
            </Text>
          </View>
        </View>

        {/* ── Order Meta ── */}
        <View style={styles.metaSection}>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Order Code :</Text>
            <Text style={styles.metaValue}>{order.orderCode}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Status :</Text>
            <Text>{order.status}</Text>
          </View>
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Payment Method :</Text>
            <Text>{order.paymentMethod}</Text>
          </View>
        </View>

        {/* ── Billing Address ── */}
        <View style={styles.addressSection}>
          <Text style={styles.sectionTitle}>Billing Address</Text>
          <Text style={styles.addressLine}>{order.address.fullName}</Text>
          <Text style={styles.addressLine}>{order.address.phone}</Text>
          <Text style={styles.addressLine}>{order.address.addressLine1}</Text>
          <Text style={styles.addressLine}>
            {order.address.city}, {order.address.state}
          </Text>
          <Text style={styles.addressLine}>{order.address.pincode}</Text>
        </View>

        {/* ── Items Table ── */}
        <View style={styles.table}>
          <View style={styles.tableHeader}>
            <Text style={[styles.thText, styles.colItem]}>Item</Text>
            <Text style={[styles.thText, styles.colSize]}>Size</Text>
            <Text style={[styles.thText, styles.colPrice]}>Unit Price</Text>
            <Text style={[styles.thText, styles.colQty]}>Qty</Text>
            <Text style={[styles.thText, styles.colTotal]}>Total</Text>
          </View>
          {order.items.map((item, i) => (
            <View style={styles.tableRow} key={i}>
              <Text style={[styles.tdText, styles.colItem]}>{item.name}</Text>
              <Text style={[styles.tdText, styles.colSize]}>{item.size}</Text>
              <Text style={[styles.tdText, styles.colPrice]}>
                {formatRupees(item.price)}
              </Text>
              <Text style={[styles.tdText, styles.colQty]}>
                {String(item.quantity)}
              </Text>
              <Text style={[styles.tdText, styles.colTotal]}>
                {formatRupees(item.price * item.quantity)}
              </Text>
            </View>
          ))}
        </View>

        {/* ── Totals ── */}
        <View style={styles.totalsSection}>
          <View style={styles.totalRow}>
            <Text style={styles.totalLabel}>Subtotal :</Text>
            <Text style={styles.totalValue}>{formatRupees(subtotal)}</Text>
          </View>
          {discountAmount > 0 && (
            <View style={styles.totalRow}>
              <Text style={[styles.totalLabel, styles.discountText]}>
                Discount :
              </Text>
              <Text style={[styles.totalValue, styles.discountText]}>
                -{formatRupees(discountAmount)}
                {order.couponCode ? ` (${order.couponCode})` : ""}
              </Text>
            </View>
          )}
          <View style={styles.totalRow}>
            <Text style={[styles.totalLabel, styles.amountPaid]}>
              Amount Paid :
            </Text>
            <Text style={[styles.totalValue, styles.amountPaid]}>
              {formatRupees(order.amount)}
            </Text>
          </View>
        </View>

        {/* ── Footer ── */}
        <View style={styles.footer}>
          <Text style={styles.footerLine}>
            Thank you for shopping with us!
          </Text>
          <Text style={styles.footerLine}>
            This invoice is generated electronically and does not require a
            signature.
          </Text>
        </View>
      </Page>
    </Document>
  )
}
