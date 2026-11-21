import { business, GSTIN_PLACEHOLDER } from "@/lib/data/business"
import { placeOfSupplyLabel } from "@/lib/gst/states"
import { GST_RATE } from "@/lib/gst/tax"
import { isSnapshot } from "@/lib/measurements/fields"
import { rupeesInWords } from "@/lib/money"
import { paymentLabel, statusLabel } from "@/lib/orders/labels"

export type DocumentOrder = {
  orderCode: string
  amount: number
  discount: number
  couponCode: string | null
  subtotal: number
  taxableValue: number
  cgst: number
  sgst: number
  igst: number
  placeOfSupply: string
  buyerGstin: string | null
  buyerName: string | null
  invoiceNumber: string | null
  invoiceDate: Date | string | null
  sellerGstin: string | null
  sellerLegalName?: string | null
  sellerTradeName?: string | null
  sellerAddress?: string | null
  sellerStateCode?: string | null
  sellerEmail?: string | null
  sellerPhone?: string | null
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
  billingAddress?: {
    fullName: string
    addressLine1: string
    addressLine2: string | null
    city: string
    state: string
    pincode: string
  } | null
  items: {
    id: string
    name: string
    size: string
    color?: string | null
    price: number
    quantity: number
    measurements?: unknown
    hsn: string
    gstRate: number
    discount: number
    taxableValue: number
    taxAmount: number
  }[]
}

export type DocumentLine = {
  id: string
  name: string
  detail: string
  sizeLabel: string
  color: string | null
  hsn: string
  quantity: number
  unitPrice: number
  gross: number
  taxable: number
  tax: number
  taxParts: number[]
  amount: number
}

type PostalAddress = { fullName: string; addressLine1: string; addressLine2: string | null; city: string; state: string; pincode: string }

export type DocumentParties = {
  address: (PostalAddress & { phone: string; email: string | null }) | null
  billingAddress?: PostalAddress | null
  buyerName: string | null
  buyerGstin: string | null
}

const postalLines = (a: PostalAddress) => [[a.addressLine1, a.addressLine2].filter(Boolean).join(", "), `${a.city}, ${a.state} ${a.pincode}`]

export function partiesOf(order: DocumentParties) {
  const ship = order.address
  const bill = order.billingAddress ?? ship
  return {
    buyer:
      bill && ship
        ? {
            name: order.buyerName ?? bill.fullName,
            attention: order.buyerName ? bill.fullName : null,
            lines: postalLines(bill),
            phone: ship.phone,
            email: ship.email,
            gstin: order.buyerGstin,
          }
        : null,
    shipTo: order.billingAddress && ship ? { name: ship.fullName, lines: postalLines(ship), phone: ship.phone } : null,
  }
}

export const invoiceFileName = (invoiceNumber: string) => `Tax-Invoice-${invoiceNumber.replace(/\//g, "-")}`

export function orderDocument(order: DocumentOrder) {
  const isInvoice = Boolean(order.invoiceNumber)
  const sellerStateCode = order.sellerStateCode ?? business.stateCode
  const intraState = order.placeOfSupply === sellerStateCode
  const rate = order.items[0]?.gstRate ?? GST_RATE
  const sellerGstin = order.sellerGstin ?? business.gstin
  const tax = order.cgst + order.sgst + order.igst

  const lines: DocumentLine[] = order.items.map((it) => {
    const half = Math.round(it.taxAmount / 2)
    return {
      id: it.id,
      name: it.name,
      detail: [isSnapshot(it.measurements) ? "Made to measure" : `Size ${it.size}`, it.color].filter(Boolean).join(" · "),
      sizeLabel: isSnapshot(it.measurements) ? "Made to measure" : it.size,
      color: it.color ?? null,
      hsn: it.hsn,
      quantity: it.quantity,
      unitPrice: it.price,
      gross: it.price * it.quantity,
      taxable: it.taxableValue,
      tax: it.taxAmount,
      taxParts: intraState ? [half, it.taxAmount - half] : [it.taxAmount],
      amount: it.taxableValue + it.taxAmount,
    }
  })

  return {
    kind: isInvoice ? ("tax-invoice" as const) : ("confirmation" as const),
    title: isInvoice ? "Tax invoice" : "Order confirmation",
    fileName: isInvoice ? invoiceFileName(order.invoiceNumber!) : `Order-${order.orderCode}`,
    numberLabel: isInvoice ? "Invoice no." : "Order no.",
    number: isInvoice ? order.invoiceNumber! : order.orderCode,
    date: (isInvoice ? order.invoiceDate : order.createdAt) ?? order.createdAt,
    orderCode: order.orderCode,
    orderDate: order.createdAt,
    specimen: isInvoice && sellerGstin === GSTIN_PLACEHOLDER,
    payment: paymentLabel(order.paymentMethod),
    status: statusLabel(order.status),
    seller: {
      name: order.sellerLegalName ?? business.legalName,
      tradeName: order.sellerTradeName ?? business.tradeName,
      addressLines: order.sellerAddress ? order.sellerAddress.split("\n") : business.addressLines,
      gstin: sellerGstin,
      state: placeOfSupplyLabel(sellerStateCode),
      email: order.sellerEmail ?? business.email,
      phone: order.sellerPhone ?? business.phone,
    },
    ...partiesOf(order),
    placeOfSupply: placeOfSupplyLabel(order.placeOfSupply),
    taxColumns: intraState ? [`CGST ${rate / 2}%`, `SGST ${rate / 2}%`] : [`IGST ${rate}%`],
    lines,
    totals: {
      subtotal: order.subtotal,
      discount: order.discount,
      couponCode: order.couponCode,
      taxableValue: order.taxableValue,
      taxParts: intraState
        ? [{ label: `CGST @ ${rate / 2}%`, value: order.cgst }, { label: `SGST @ ${rate / 2}%`, value: order.sgst }]
        : [{ label: `IGST @ ${rate}%`, value: order.igst }],
      tax,
      total: order.amount,
      inWords: rupeesInWords(order.amount),
    },
  }
}

export type OrderDocumentModel = ReturnType<typeof orderDocument>
