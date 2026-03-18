import jsPDF from "jspdf"
import { formatRupees } from "@/lib/money"
import { formatDateDDMMYYYY } from "@/lib/date"

export interface InvoicePdfOrder {
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

const GOLD = [200, 169, 81] as const // #c8a951
const BLACK = [26, 26, 26] as const
const GRAY = [100, 100, 100] as const
const LIGHT_GRAY = [229, 229, 229] as const

export async function renderInvoicePdf(order: InvoicePdfOrder): Promise<Buffer> {
  const doc = new jsPDF({ unit: "mm", format: "a4" })
  const pageWidth = doc.internal.pageSize.getWidth()
  const margin = 20
  let y = 25

  // ── Header ──
  doc.setFontSize(20)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...BLACK)
  doc.text("GP Fashion", margin, y)

  y += 6
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...GRAY)
  doc.text("New Delhi, India", margin, y)

  // Right side: INVOICE + date
  doc.setFontSize(22)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...GOLD)
  doc.text("INVOICE", pageWidth - margin, 25, { align: "right" })

  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...GRAY)
  doc.text(`Date: ${formatDateDDMMYYYY(order.createdAt)}`, pageWidth - margin, 33, { align: "right" })

  // Divider
  y += 8
  doc.setDrawColor(...LIGHT_GRAY)
  doc.setLineWidth(0.5)
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  // ── Order Meta ──
  doc.setFontSize(11)
  doc.setTextColor(...BLACK)

  const metaLines = [
    ["Order Code :", order.orderCode],
    ["Status :", order.status.replace(/_/g, " ")],
    ["Payment Method :", order.paymentMethod.replace(/_/g, " ")],
  ]
  for (const [label, value] of metaLines) {
    doc.setFont("helvetica", "bold")
    doc.text(label, margin, y)
    doc.setFont("helvetica", "normal")
    doc.text(value, margin + 42, y)
    y += 6
  }
  y += 6

  // ── Billing Address ──
  doc.setFontSize(14)
  doc.setFont("helvetica", "bold")
  doc.text("Billing Address", margin, y)
  y += 7

  doc.setFontSize(11)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(68, 68, 68)
  const addressLines = [
    order.address.fullName,
    order.address.phone,
    order.address.addressLine1,
    `${order.address.city}, ${order.address.state}`,
    order.address.pincode,
  ]
  for (const line of addressLines) {
    doc.text(line, margin, y)
    y += 5.5
  }
  y += 8

  // ── Items Table ──
  doc.setDrawColor(...LIGHT_GRAY)
  doc.line(margin, y, pageWidth - margin, y)
  y += 1

  // Table header
  const colX = {
    item: margin,
    size: margin + 60,
    price: margin + 90,
    qty: margin + 120,
    total: pageWidth - margin,
  }

  doc.setFillColor(249, 249, 249)
  doc.rect(margin, y, pageWidth - 2 * margin, 8, "F")
  y += 6
  doc.setFontSize(10)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...BLACK)
  doc.text("Item", colX.item, y)
  doc.text("Size", colX.size, y)
  doc.text("Unit Price", colX.price, y, { align: "right" })
  doc.text("Qty", colX.qty, y, { align: "right" })
  doc.text("Total", colX.total, y, { align: "right" })
  y += 4

  // Table rows
  doc.setFont("helvetica", "normal")
  for (const item of order.items) {
    doc.setDrawColor(...LIGHT_GRAY)
    doc.line(margin, y, pageWidth - margin, y)
    y += 6
    doc.setTextColor(...BLACK)
    doc.text(item.name, colX.item, y)
    doc.text(item.size, colX.size, y)
    doc.text(formatRupees(item.price), colX.price, y, { align: "right" })
    doc.text(String(item.quantity), colX.qty, y, { align: "right" })
    doc.text(formatRupees(item.price * item.quantity), colX.total, y, { align: "right" })
    y += 2
  }

  y += 2
  doc.line(margin, y, pageWidth - margin, y)
  y += 10

  // ── Totals ──
  const subtotal = order.amount + order.discount
  const totalsX = pageWidth - margin

  doc.setFontSize(12)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...BLACK)
  doc.text("Subtotal :", totalsX - 50, y)
  doc.setFont("helvetica", "normal")
  doc.text(formatRupees(subtotal), totalsX, y, { align: "right" })
  y += 7

  if (order.discount > 0) {
    doc.setTextColor(68, 68, 68)
    doc.setFont("helvetica", "bold")
    doc.text("Discount :", totalsX - 50, y)
    doc.setFont("helvetica", "normal")
    const discountText = `-${formatRupees(order.discount)}${order.couponCode ? ` (${order.couponCode})` : ""}`
    doc.text(discountText, totalsX, y, { align: "right" })
    y += 7
  }

  doc.setFontSize(13)
  doc.setFont("helvetica", "bold")
  doc.setTextColor(...BLACK)
  doc.text("Amount Paid :", totalsX - 50, y)
  doc.text(formatRupees(order.amount), totalsX, y, { align: "right" })
  y += 15

  // ── Footer ──
  doc.setFontSize(10)
  doc.setFont("helvetica", "normal")
  doc.setTextColor(...GRAY)
  doc.text("Thank you for shopping with us!", margin, y)
  y += 5
  doc.text("This invoice is generated electronically and does not require a signature.", margin, y)

  // Return as Buffer
  const arrayBuffer = doc.output("arraybuffer")
  return Buffer.from(arrayBuffer)
}
