import { Document, Image, Page, Text, View } from "@react-pdf/renderer"
import { formatDateDDMMYYYY } from "@/lib/date"
import { creditNoteDocument, type DocumentCreditNote } from "@/lib/orders/creditNoteDocument"
import { fx, logo, registerFonts, s } from "./InvoiceDocument"

export default function CreditNoteDocument({ creditNote }: { creditNote: DocumentCreditNote }) {
  registerFonts()
  const d = creditNoteDocument(creditNote)
  const two = d.taxColumns.length === 2
  const w = { item: two ? "31%" : "39%", hsn: "9%", qty: "6%", taxable: "15%", tax: two ? "12%" : "16%", amount: "15%" }

  return (
    <Document title={`${d.title} ${d.number}`} author={d.seller.name} subject={`${d.title} against invoice ${d.invoiceNumber}`}>
      <Page size="A4" style={s.page}>
        <View style={s.header}>
          <View style={s.brand}>
            <Image src={logo()} style={s.logo} />
            <Text style={s.wordmark}>PIYUSH BHOLLA</Text>
          </View>
          <View>
            <Text style={s.title}>{d.title}</Text>
            <Text style={s.meta}>
              Credit note no. <Text style={s.metaStrong}>{d.number}</Text>
            </Text>
            <Text style={s.meta}>Date {formatDateDDMMYYYY(d.date)}</Text>
            <Text style={s.meta}>
              Against tax invoice <Text style={s.metaStrong}>{d.invoiceNumber}</Text> dated {formatDateDDMMYYYY(d.invoiceDate)}
            </Text>
            <Text style={s.meta}>Order {d.orderCode}</Text>
          </View>
        </View>

        {d.specimen && (
          <Text style={s.specimen}>SPECIMEN. The seller GSTIN is a placeholder, so this document is not valid for tax purposes.</Text>
        )}

        <View style={s.parties}>
          <View style={s.party}>
            <Text style={s.label}>Issued to</Text>
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
            <View style={{ marginTop: 8 }}>
              <Text>
                <Text style={s.muted}>Place of supply </Text>
                {d.placeOfSupply}
              </Text>
              <Text>
                <Text style={s.muted}>Reason </Text>
                {d.reason}
              </Text>
            </View>
          </View>

          <View style={s.party}>
            <Text style={[s.label, s.right]}>Issued by</Text>
            <View style={s.partyBody}>
              <Text style={[s.strong, s.right]}>{d.seller.name}</Text>
              {d.seller.addressLines.map((l) => <Text key={l} style={s.right}>{l}</Text>)}
              <Text style={s.right}>State {d.seller.state}</Text>
              <Text style={s.right}>
                GSTIN <Text style={s.strong}>{d.seller.gstin}</Text>
              </Text>
              <Text style={[s.muted, s.right]}>{d.seller.email} · {d.seller.phone}</Text>
            </View>
          </View>
        </View>

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
              <Text style={[s.num, { width: w.taxable }]}>{fx(l.taxable)}</Text>
              {l.taxParts.map((t, i) => (
                <Text key={i} style={[s.muted, s.num, { width: w.tax }]}>{fx(t)}</Text>
              ))}
              <Text style={[s.num, { width: w.amount }]}>{fx(l.amount)}</Text>
            </View>
          ))}
        </View>

        <View style={s.totals}>
          <View style={s.totalRow}>
            <Text style={s.muted}>Taxable value credited</Text>
            <Text>{fx(d.totals.taxableValue)}</Text>
          </View>
          {d.totals.taxParts.map((t) => (
            <View key={t.label} style={s.totalRow}>
              <Text style={s.muted}>{t.label}</Text>
              <Text>{fx(t.value)}</Text>
            </View>
          ))}
          <View style={s.grand}>
            <Text style={s.grandKey}>Credit note total</Text>
            <Text>{fx(d.totals.total)}</Text>
          </View>
          <Text style={s.words}>{d.totals.inWords}</Text>
        </View>

        <View style={s.notes} wrap={false}>
          <Text style={s.noteText}>
            This credit note reduces the taxable value and the GST of tax invoice {d.invoiceNumber} by the amounts shown. Tax payable on reverse charge: No.
          </Text>
          <View style={s.sign}>
            <Text style={s.strong}>For {d.seller.tradeName}</Text>
            <Text style={[s.muted, { marginTop: 4, textAlign: "right", fontSize: 8.5 }]}>This is a computer-generated credit note and does not need a signature.</Text>
          </View>
        </View>

        <View style={s.footer} fixed>
          <Text>Thank you for shopping with Piyush Bholla.</Text>
          <Text>This document is generated electronically.</Text>
        </View>
      </Page>
    </Document>
  )
}
