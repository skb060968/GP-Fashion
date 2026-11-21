import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/security/adminAuth"
import { business, gstinIsPlaceholder } from "@/lib/data/business"
import { invoiceFileName } from "@/lib/orders/orderDocument"
import { creditNoteFileName, creditNoteSlug } from "@/lib/gst/creditNote"
import {
  buildGstr1,
  creditNoteRegisterCsv,
  invoiceRegisterCsv,
  recordWarnings,
  sortCreditNotes,
  sortInvoices,
  summarise,
  type RecordCreditNote,
  type RecordInvoice,
} from "@/lib/gst/gstr1"
import { currentFyStart, previousQuarter, recordPeriod, type Quarter } from "@/lib/gst/period"

const item = (i: { hsn: string; gstRate: number; quantity: number; taxableValue: number; taxAmount: number }) => ({
  hsn: i.hsn,
  gstRate: i.gstRate,
  quantity: i.quantity,
  taxableValue: i.taxableValue,
  taxAmount: i.taxAmount,
})

export async function GET(req: NextRequest) {
  const denied = await requireAdmin(req)
  if (denied) return denied

  try {
    const { searchParams } = new URL(req.url)
    const nowFy = currentFyStart()
    const fy = Number(searchParams.get("fy") ?? nowFy)
    const q = searchParams.get("q") ?? "all"
    if (!Number.isInteger(fy) || fy < 2017 || fy > nowFy) {
      return NextResponse.json({ error: "Choose a financial year from the list" }, { status: 400 })
    }
    if (!["1", "2", "3", "4", "all"].includes(q)) {
      return NextResponse.json({ error: "Choose a quarter from the list" }, { status: 400 })
    }
    const period = recordPeriod(fy, q === "all" ? null : (Number(q) as Quarter))

    const [orders, notes, earliest] = await Promise.all([
      prisma.order.findMany({
        where: { invoiceNumber: { not: null }, invoiceDate: { gte: period.from, lt: period.to } },
        include: { address: true, billingAddress: true, items: true, creditNotes: { select: { number: true }, orderBy: { date: "asc" } } },
      }),
      prisma.creditNote.findMany({
        where: { date: { gte: period.from, lt: period.to } },
        include: { items: true, order: { select: { orderCode: true, address: { select: { fullName: true } }, billingAddress: { select: { fullName: true } } } } },
      }),
      prisma.order.findFirst({
        where: { invoiceNumber: { not: null } },
        orderBy: { invoiceDate: "asc" },
        select: { invoiceDate: true },
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

    const placeholder = gstinIsPlaceholder()
    const gstr1 = period.fp && !placeholder ? buildGstr1(invoices, period, business.gstin, business.stateCode, creditNotes) : null
    const firstFy = Math.min(earliest?.invoiceDate ? currentFyStart(earliest.invoiceDate) : nowFy, previousQuarter().fyStart)

    return NextResponse.json(
      {
        period: { ...period, from: period.from.toISOString(), to: period.to.toISOString() },
        finished: Date.now() >= period.to.getTime(),
        years: Array.from({ length: nowFy - firstFy + 1 }, (_, i) => nowFy - i),
        gstin: business.gstin,
        placeholderGstin: placeholder,
        summary: summarise(invoices, business.stateCode, creditNotes),
        warnings: [...recordWarnings(invoices, business.gstin, creditNotes), ...(gstr1?.warnings ?? [])],
        invoices: invoices.map((i) => ({ orderCode: i.orderCode, number: i.invoiceNumber, url: `/api/invoice/${encodeURIComponent(i.orderCode)}`, fileName: `${invoiceFileName(i.invoiceNumber)}.pdf` })),
        creditNotes: creditNotes.map((c) => ({ number: c.number, url: `/api/credit-note/${creditNoteSlug(c.number)}`, fileName: `${creditNoteFileName(c.number)}.pdf` })),
        register: invoiceRegisterCsv(invoices, business.stateCode),
        creditRegister: creditNotes.length ? creditNoteRegisterCsv(creditNotes) : null,
        gstr1: gstr1 && gstr1.invoices + gstr1.creditNotes > 0 ? gstr1.json : null,
      },
      { headers: { "Cache-Control": "private, no-store" } }
    )
  } catch (error) {
    console.error("ADMIN RECORDS ERROR:", error)
    return NextResponse.json({ error: "Failed to load the records" }, { status: 500 })
  }
}
