import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/security/adminAuth"
import { business, gstinIsPlaceholder } from "@/lib/data/business"
import { invoiceFileName } from "@/lib/orders/orderDocument"
import { buildGstr1, invoiceRegisterCsv, recordWarnings, sortInvoices, summarise, type RecordInvoice } from "@/lib/gst/gstr1"
import { currentFyStart, previousQuarter, recordPeriod, type Quarter } from "@/lib/gst/period"

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

    const [orders, earliest] = await Promise.all([
      prisma.order.findMany({
        where: { invoiceNumber: { not: null }, invoiceDate: { gte: period.from, lt: period.to } },
        include: { address: true, items: true },
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
        customerName: o.address?.fullName ?? null,
        sellerGstin: o.sellerGstin,
        sellerStateCode: o.sellerStateCode,
        status: o.status,
        items: o.items.map((i) => ({
          hsn: i.hsn,
          gstRate: i.gstRate,
          quantity: i.quantity,
          taxableValue: i.taxableValue,
          taxAmount: i.taxAmount,
        })),
      }))
    )

    const placeholder = gstinIsPlaceholder()
    const gstr1 = period.fp && !placeholder ? buildGstr1(invoices, period, business.gstin, business.stateCode) : null
    const firstFy = Math.min(earliest?.invoiceDate ? currentFyStart(earliest.invoiceDate) : nowFy, previousQuarter().fyStart)

    return NextResponse.json(
      {
        period: { ...period, from: period.from.toISOString(), to: period.to.toISOString() },
        finished: Date.now() >= period.to.getTime(),
        years: Array.from({ length: nowFy - firstFy + 1 }, (_, i) => nowFy - i),
        gstin: business.gstin,
        placeholderGstin: placeholder,
        summary: summarise(invoices, business.stateCode),
        warnings: recordWarnings(invoices, business.gstin),
        invoices: invoices.map((i) => ({ orderCode: i.orderCode, invoiceNumber: i.invoiceNumber, fileName: `${invoiceFileName(i.invoiceNumber)}.pdf` })),
        register: invoiceRegisterCsv(invoices, business.stateCode),
        gstr1: gstr1 && gstr1.invoices > 0 ? gstr1.json : null,
      },
      { headers: { "Cache-Control": "private, no-store" } }
    )
  } catch (error) {
    console.error("ADMIN RECORDS ERROR:", error)
    return NextResponse.json({ error: "Failed to load the records" }, { status: 500 })
  }
}
