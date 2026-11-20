import { GSTIN_PLACEHOLDER } from "@/lib/data/business"
import { placeOfSupplyLabel } from "@/lib/gst/states"
import { creditNoteFileName } from "@/lib/gst/creditNote"
import { rupeesInWords } from "@/lib/money"

export type DocumentCreditNote = {
  number: string
  date: Date | string
  reason: string
  amount: number
  taxableValue: number
  cgst: number
  sgst: number
  igst: number
  placeOfSupply: string
  buyerGstin: string | null
  buyerName: string | null
  invoiceNumber: string
  invoiceDate: Date | string
  sellerGstin: string
  sellerLegalName: string
  sellerTradeName: string
  sellerAddress: string
  sellerStateCode: string
  sellerEmail: string
  sellerPhone: string
  order: {
    orderCode: string
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
  }
  items: {
    id: string
    name: string
    size: string
    color: string | null
    hsn: string
    gstRate: number
    quantity: number
    taxableValue: number
    taxAmount: number
  }[]
}

export function creditNoteDocument(cn: DocumentCreditNote) {
  const intraState = cn.placeOfSupply === cn.sellerStateCode
  const rate = cn.items[0]?.gstRate ?? 18
  const a = cn.order.address
  return {
    title: "Credit note",
    number: cn.number,
    date: cn.date,
    fileName: creditNoteFileName(cn.number),
    orderCode: cn.order.orderCode,
    invoiceNumber: cn.invoiceNumber,
    invoiceDate: cn.invoiceDate,
    reason: cn.reason,
    specimen: cn.sellerGstin === GSTIN_PLACEHOLDER,
    seller: {
      name: cn.sellerLegalName,
      tradeName: cn.sellerTradeName,
      addressLines: cn.sellerAddress.split("\n"),
      gstin: cn.sellerGstin,
      state: placeOfSupplyLabel(cn.sellerStateCode),
      email: cn.sellerEmail,
      phone: cn.sellerPhone,
    },
    buyer: a
      ? {
          name: cn.buyerName ?? a.fullName,
          attention: cn.buyerName ? a.fullName : null,
          lines: [[a.addressLine1, a.addressLine2].filter(Boolean).join(", "), `${a.city}, ${a.state} ${a.pincode}`],
          phone: a.phone,
          email: a.email,
          gstin: cn.buyerGstin,
        }
      : null,
    placeOfSupply: placeOfSupplyLabel(cn.placeOfSupply),
    taxColumns: intraState ? [`CGST ${rate / 2}%`, `SGST ${rate / 2}%`] : [`IGST ${rate}%`],
    lines: cn.items.map((it) => {
      const half = Math.round(it.taxAmount / 2)
      return {
        id: it.id,
        name: it.name,
        detail: [`Size ${it.size}`, it.color].filter(Boolean).join(" · "),
        hsn: it.hsn,
        quantity: it.quantity,
        taxable: it.taxableValue,
        taxParts: intraState ? [half, it.taxAmount - half] : [it.taxAmount],
        amount: it.taxableValue + it.taxAmount,
      }
    }),
    totals: {
      taxableValue: cn.taxableValue,
      taxParts: intraState
        ? [{ label: `CGST @ ${rate / 2}%`, value: cn.cgst }, { label: `SGST @ ${rate / 2}%`, value: cn.sgst }]
        : [{ label: `IGST @ ${rate}%`, value: cn.igst }],
      total: cn.amount,
      inWords: rupeesInWords(cn.amount),
    },
  }
}
