import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { requireAdmin } from "@/lib/security/adminAuth"
import { business, gstinIsPlaceholder } from "@/lib/data/business"
import { invoiceFileName } from "@/lib/orders/orderDocument"
import { creditNoteFileName, creditNoteSlug } from "@/lib/gst/creditNote"
import { buildGstr1, creditNoteRegisterCsv, invoiceRegisterCsv, recordWarnings, summarise } from "@/lib/gst/gstr1"
import { loadSalesRecords } from "@/lib/gst/recordsData"
import { purchasesForRecords } from "@/lib/services/purchaseService"
import { purchaseRegisterCsv } from "@/lib/purchases/register"
import { currentFyStart, previousQuarter, recordPeriod, type Quarter } from "@/lib/gst/period"
import { challanFileName, challanSlug, parsePieces } from "@/lib/jobwork/challan"
import { challanRegisterCsv, challanWarnings, itc04Sheets, sortChallans, type RecordChallan } from "@/lib/jobwork/records"

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

    const inPeriod = { gte: period.from, lt: period.to }
    const [{ invoices, creditNotes }, purchases, earliest, challanRows, openChallans] = await Promise.all([
      loadSalesRecords(period.from, period.to),
      purchasesForRecords(period.from, period.to),
      prisma.order.findFirst({
        where: { invoiceNumber: { not: null } },
        orderBy: { invoiceDate: "asc" },
        select: { invoiceDate: true },
      }),
      prisma.jobWorkChallan.findMany({
        where: { OR: [{ date: inPeriod }, { receivedAt: inPeriod }] },
        include: { lines: { orderBy: { position: "asc" } }, order: { select: { orderCode: true } } },
      }),
      prisma.jobWorkChallan.findMany({
        where: { receivedAt: null, cancelledAt: null },
        select: { number: true, date: true, receivedAt: true, cancelledAt: true },
      }),
    ])

    const challans: RecordChallan[] = sortChallans(
      challanRows.map((c) => ({
        number: c.number,
        date: c.date,
        orderCode: c.order.orderCode,
        tailorName: c.tailorName,
        tailorStateCode: c.tailorStateCode,
        tailorGstin: c.tailorGstin,
        sellerStateCode: c.sellerStateCode,
        pieces: parsePieces(c.pieces),
        lines: c.lines,
        taxableValue: c.taxableValue,
        taxAmount: c.taxAmount,
        ewayBill: c.ewayBill,
        receivedAt: c.receivedAt,
        receivedNote: c.receivedNote,
        receivedEwayBill: c.receivedEwayBill,
        cancelledAt: c.cancelledAt,
        cancelReason: c.cancelReason,
      }))
    )
    const within = (d: Date | string | null) => !!d && new Date(d) >= period.from && new Date(d) < period.to
    const sentInPeriod = challans.filter((c) => within(c.date))
    const receivedInPeriod = challans.filter((c) => within(c.receivedAt))

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
        warnings: [...recordWarnings(invoices, business.gstin, creditNotes), ...(gstr1?.warnings ?? []), ...challanWarnings(openChallans)],
        challans: sentInPeriod.map((c) => ({ number: c.number, url: `/api/admin/challans/${challanSlug(c.number)}`, fileName: `${challanFileName(c.number)}.pdf` })),
        challanSummary: {
          sent: sentInPeriod.filter((c) => !c.cancelledAt).length,
          received: receivedInPeriod.length,
          open: openChallans.length,
        },
        challanRegister: sentInPeriod.length ? challanRegisterCsv(sentInPeriod) : null,
        purchaseRegister: purchases.length ? purchaseRegisterCsv(purchases) : null,
        itc04: sentInPeriod.length + receivedInPeriod.length ? itc04Sheets(sentInPeriod, receivedInPeriod) : null,
        invoices: invoices.map((i) => ({ orderCode: i.orderCode, number: i.invoiceNumber, url: `/api/invoice/${encodeURIComponent(i.orderCode)}`, fileName: `${invoiceFileName(i.invoiceNumber)}.pdf` })),
        creditNotes: creditNotes.map((c) => ({ number: c.number, url: `/api/credit-note/${creditNoteSlug(c.number)}`, fileName: `${creditNoteFileName(c.number)}.pdf` })),
        register: invoiceRegisterCsv(invoices, business.stateCode),
        creditRegister: creditNotes.length ? creditNoteRegisterCsv(creditNotes) : null,
        gstr1: gstr1 && gstr1.invoices + gstr1.creditNotes > 0 ? gstr1.json : null,
        buyerNames: Object.fromEntries(
          [...invoices, ...creditNotes].filter((d) => d.buyerGstin && d.buyerName).map((d) => [d.buyerGstin!, d.buyerName!])
        ),
      },
      { headers: { "Cache-Control": "private, no-store" } }
    )
  } catch (error) {
    console.error("ADMIN RECORDS ERROR:", error)
    return NextResponse.json({ error: "Failed to load the records" }, { status: 500 })
  }
}
