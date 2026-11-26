import { prisma } from "@/lib/prisma"
import { sortCreditNotes, sortInvoices, type RecordCreditNote, type RecordInvoice } from "./gstr1"

const item = (i: { hsn: string; gstRate: number; quantity: number; taxableValue: number; taxAmount: number }) => ({
  hsn: i.hsn,
  gstRate: i.gstRate,
  quantity: i.quantity,
  taxableValue: i.taxableValue,
  taxAmount: i.taxAmount,
})

export async function loadSalesRecords(from: Date, to: Date): Promise<{ invoices: RecordInvoice[]; creditNotes: RecordCreditNote[] }> {
  const [orders, notes] = await Promise.all([
    prisma.order.findMany({
      where: { invoiceNumber: { not: null }, invoiceDate: { gte: from, lt: to } },
      include: { address: true, billingAddress: true, items: true, creditNotes: { select: { number: true }, orderBy: { date: "asc" } } },
    }),
    prisma.creditNote.findMany({
      where: { date: { gte: from, lt: to } },
      include: { items: true, order: { select: { orderCode: true, address: { select: { fullName: true } }, billingAddress: { select: { fullName: true } } } } },
    }),
  ])

  const invoices: RecordInvoice[] = sortInvoices(
    orders.map((o) => ({
      orderCode: o.orderCode,
      invoiceNumber: o.invoiceNumber!,
      invoiceDate: o.invoiceDate ?? o.updatedAt,
      amount: o.amount,
      taxableValue: o.taxableValue,
      cgst: o.cgst,
      sgst: o.sgst,
      igst: o.igst,
      placeOfSupply: o.placeOfSupply,
      buyerGstin: o.buyerGstin,
      buyerName: o.buyerName,
      customerName: o.billingAddress?.fullName ?? o.address?.fullName ?? null,
      sellerGstin: o.sellerGstin,
      sellerStateCode: o.sellerStateCode,
      status: o.status,
      creditNotes: o.creditNotes.map((c) => c.number),
      items: o.items.map(item),
    }))
  )

  const creditNotes: RecordCreditNote[] = sortCreditNotes(
    notes.map((c) => ({
      number: c.number,
      date: c.date,
      reason: c.reason,
      orderCode: c.order.orderCode,
      invoiceNumber: c.invoiceNumber,
      invoiceDate: c.invoiceDate,
      invoiceAmount: c.invoiceAmount,
      amount: c.amount,
      taxableValue: c.taxableValue,
      cgst: c.cgst,
      sgst: c.sgst,
      igst: c.igst,
      placeOfSupply: c.placeOfSupply,
      buyerGstin: c.buyerGstin,
      buyerName: c.buyerName,
      customerName: c.order.billingAddress?.fullName ?? c.order.address?.fullName ?? null,
      sellerGstin: c.sellerGstin,
      sellerStateCode: c.sellerStateCode,
      items: c.items.map(item),
    }))
  )

  return { invoices, creditNotes }
}
