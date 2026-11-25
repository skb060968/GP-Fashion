import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer"
import { formatDateDDMMYYYY } from "@/lib/date"
import { CHALLAN_COPIES, challanDocument, type DocumentChallan } from "@/lib/jobwork/challanDocument"
import { fx, logo, registerFonts, s } from "./InvoiceDocument"

const c = StyleSheet.create({
  copy: { marginTop: 4, fontSize: 8, fontWeight: 600, letterSpacing: 1.4, textAlign: "right", textTransform: "uppercase" },
  cancelled: { marginTop: 12, padding: 8, borderWidth: 1, borderColor: "#b91c1c", color: "#991b1b", textAlign: "center", fontWeight: 600, fontSize: 9 },
  purpose: { marginBottom: 12, padding: 8, backgroundColor: "#f5f5f4", fontSize: 8.5, color: "#404040" },
  title: { marginBottom: 6 },
  below: { marginTop: 14, flexDirection: "row", justifyContent: "space-between", alignItems: "flex-end" },
  piece: { marginTop: 2 },
  back: { marginTop: 16, borderWidth: 1, borderColor: "#d4d4d4", padding: 10 },
  backRow: { flexDirection: "row", marginTop: 9, alignItems: "flex-end" },
  backKey: { width: 120, color: "#6b6b6b" },
  backLine: { flex: 1, borderBottomWidth: 1, borderBottomColor: "#bdbdbd", minHeight: 12, paddingBottom: 1 },
})

export default function ChallanDocument({ challan }: { challan: DocumentChallan }) {
  registerFonts()
  const d = challanDocument(challan)
  const w = { no: "5%", item: "38%", hsn: "10%", qty: "11%", taxable: "14%", rate: "8%", tax: "14%" }

  return (
    <Document title={`${d.title} ${d.number}`} author={d.seller.name} subject={`Job work challan for order ${d.orderCode}`}>
      {CHALLAN_COPIES.map((copy) => (
        <Page key={copy} size="A4" style={s.page}>
          <View style={s.header}>
            <View style={s.brand}>
              <Image src={logo()} style={s.logo} />
              <Text style={s.wordmark}>PIYUSH BHOLLA</Text>
            </View>
            <View>
              <Text style={[s.title, c.title]}>{d.title}</Text>
              <Text style={s.meta}>
                Challan no. <Text style={s.metaStrong}>{d.number}</Text>
              </Text>
              <Text style={s.meta}>Date {formatDateDDMMYYYY(d.date)}</Text>
              <Text style={s.meta}>For job work · Order {d.orderCode}</Text>
              <Text style={c.copy}>{copy}</Text>
            </View>
          </View>

          {d.specimen && <Text style={s.specimen}>SPECIMEN. The sender GSTIN is a placeholder, so this challan is not valid for tax purposes.</Text>}
          {d.cancelled && (
            <Text style={c.cancelled}>
              CANCELLED on {formatDateDDMMYYYY(d.cancelled.date)}. {d.cancelled.reason}
            </Text>
          )}

          <View style={s.parties}>
            <View style={s.party}>
              <Text style={s.label}>Sent to (job worker)</Text>
              <View style={s.partyBody}>
                <Text style={s.strong}>{d.tailor.name}</Text>
                {d.tailor.addressLines.map((l) => <Text key={l}>{l}</Text>)}
                <Text>State {d.tailor.state}</Text>
                <Text>
                  GSTIN <Text style={s.strong}>{d.tailor.gstin ?? "Unregistered"}</Text>
                </Text>
                {d.tailor.phone ? <Text style={s.muted}>{d.tailor.phone}</Text> : null}
              </View>
            </View>
            <View style={s.party}>
              <Text style={[s.label, s.right]}>Sent by</Text>
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

          <View style={c.purpose}>
            <Text>
              Goods sent for job work (stitching) under section 143 of the CGST Act, 2017, without payment of tax. This is not a sale. The stitched goods are to come back to the sender by {formatDateDDMMYYYY(d.returnBy)}. Values are as on the purchase bill; GST is shown for the record only and is not charged.
            </Text>
            <Text style={{ marginTop: 3 }}>
              Place of supply {d.placeOfSupply}
              {d.interState ? " (inter-state movement)" : ""}
              {d.fabricBill ? ` · Purchase bill ${d.fabricBill}` : ""}
              {d.ewayBill ? ` · E-way bill ${d.ewayBill}` : ""}
            </Text>
          </View>

          <View style={s.table}>
            <View style={s.thead}>
              <Text style={[s.th, { width: w.no }]}>#</Text>
              <Text style={[s.th, { width: w.item }]}>Goods sent</Text>
              <Text style={[s.th, { width: w.hsn }]}>HSN</Text>
              <Text style={[s.th, s.num, { width: w.qty }]}>Qty</Text>
              <Text style={[s.th, s.num, { width: w.taxable }]}>Value</Text>
              <Text style={[s.th, s.num, { width: w.rate }]}>GST</Text>
              <Text style={[s.th, s.num, { width: w.tax }]}>GST amount</Text>
            </View>
            {d.lines.map((l) => (
              <View key={l.id} style={s.tr} wrap={false}>
                <Text style={[s.muted, { width: w.no }]}>{l.no}</Text>
                <Text style={[s.strong, { width: w.item, paddingRight: 6 }]}>{l.name}</Text>
                <Text style={[s.muted, { width: w.hsn }]}>{l.hsn}</Text>
                <Text style={[s.num, { width: w.qty }]}>{l.quantity}</Text>
                <Text style={[s.num, { width: w.taxable }]}>{fx(l.taxable)}</Text>
                <Text style={[s.muted, s.num, { width: w.rate }]}>{l.rate}</Text>
                <Text style={[s.muted, s.num, { width: w.tax }]}>{fx(l.tax)}</Text>
              </View>
            ))}
          </View>

          <View style={s.totals}>
            <View style={s.totalRow}>
              <Text style={s.muted}>Value of goods</Text>
              <Text>{fx(d.totals.taxableValue)}</Text>
            </View>
            {d.totals.taxParts.map((t) => (
              <View key={t.label} style={s.totalRow}>
                <Text style={s.muted}>{t.label}</Text>
                <Text>{fx(t.value)}</Text>
              </View>
            ))}
            <View style={s.grand}>
              <Text style={s.grandKey}>Total value</Text>
              <Text>{fx(d.totals.total)}</Text>
            </View>
          </View>

          <View style={c.below} wrap={false}>
            <View style={{ width: "58%" }}>
              <Text style={s.label}>To be made from these goods</Text>
              {d.pieces.map((p) => (
                <Text key={p.orderItemId} style={c.piece}>
                  {p.quantity} × <Text style={s.strong}>{p.name}</Text>
                  {p.detail ? <Text style={s.muted}> · {p.detail}</Text> : null}
                </Text>
              ))}
              {d.note ? <Text style={[s.muted, { marginTop: 4 }]}>Note: {d.note}</Text> : null}
            </View>
            <View style={s.sign}>
              <Text style={s.strong}>For {d.seller.tradeName}</Text>
              <Text style={s.signLine}>Authorised signatory</Text>
            </View>
          </View>

          <View style={c.back} wrap={false}>
            <Text style={s.label}>Received back (filled in by the job worker when returning the goods)</Text>
            <View style={c.backRow}>
              <Text style={c.backKey}>Goods returned</Text>
              <Text style={c.backLine}>{d.received?.note ?? ""}</Text>
            </View>
            <View style={c.backRow}>
              <Text style={c.backKey}>Date sent back</Text>
              <Text style={c.backLine}>{d.received ? formatDateDDMMYYYY(d.received.date) : ""}</Text>
            </View>
            <View style={c.backRow}>
              <Text style={c.backKey}>E-way bill (return)</Text>
              <Text style={c.backLine}>{d.received?.ewayBill ?? ""}</Text>
            </View>
            <View style={c.backRow}>
              <Text style={c.backKey}>Job worker&apos;s signature</Text>
              <Text style={c.backLine}>{d.received ? "Recorded as received back by the sender" : ""}</Text>
            </View>
          </View>

          <View style={s.footer} fixed>
            <Text>
              {d.number} · {copy}
            </Text>
          </View>
        </Page>
      ))}
    </Document>
  )
}
