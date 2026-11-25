"use client"

import { useCallback, useEffect, useState } from "react"
import { Download, FileJson, FileSpreadsheet, FolderArchive } from "lucide-react"
import { makeXlsx, type Sheet } from "@/lib/xlsx"
import { gstr1Sheets } from "@/lib/gst/gstr1Excel"
import { AdminPageHeader } from "@/components/admin/AdminShell"
import { Alert, Card, Skeleton, btn, input } from "@/components/admin/ui"
import { adminFetch } from "@/lib/admin/fetch"
import { formatRupeesExact } from "@/lib/money"
import { QUARTER_MONTHS, fyLabel, previousQuarter, type Quarter } from "@/lib/gst/period"
import { makeZip, type ZipEntry } from "@/lib/zip"

type RecordsResponse = {
  period: { fyStart: number; quarter: Quarter | null; fp: string | null; label: string; slug: string; from: string; to: string }
  finished: boolean
  years: number[]
  gstin: string
  placeholderGstin: boolean
  summary: {
    invoices: number
    taxableValue: number
    cgst: number
    sgst: number
    igst: number
    total: number
    tables: { B2B: number; B2CL: number; B2CS: number }
    creditNotes: number
    credited: Totals
    net: Totals
  }
  warnings: string[]
  invoices: Doc[]
  creditNotes: Doc[]
  register: string
  creditRegister: string | null
  gstr1: Record<string, unknown> | null
  buyerNames: Record<string, string>
  challans: Doc[]
  challanSummary: { sent: number; received: number; open: number }
  challanRegister: string | null
  itc04: Sheet[] | null
}

type Totals = { taxableValue: number; cgst: number; sgst: number; igst: number; total: number }
type Doc = { number: string; url: string; fileName: string }

type SaveType = { description: string; accept: Record<string, string[]> }
type Writable = { write: (data: Blob) => Promise<void>; close: () => Promise<void> }
type Handle = { createWritable: () => Promise<Writable> }
type SavePicker = (options: { suggestedName: string; types: SaveType[] }) => Promise<Handle>

const ZIP_TYPE: SaveType = { description: "ZIP archive", accept: { "application/zip": [".zip"] } }
const JSON_TYPE: SaveType = { description: "GSTR-1 file", accept: { "application/json": [".json"] } }
const XLSX_MIME = "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
const XLSX_TYPE: SaveType = { description: "Excel workbook", accept: { [XLSX_MIME]: [".xlsx"] } }

const gstr1Workbook = (d: RecordsResponse) => makeXlsx(gstr1Sheets(d.gstr1 ?? {}, d.buyerNames))

async function pickSaveLocation(name: string, type: SaveType): Promise<Handle | null | "cancelled"> {
  const picker = (window as unknown as { showSaveFilePicker?: SavePicker }).showSaveFilePicker
  if (!picker) return null
  try {
    return await picker({ suggestedName: name, types: [type] })
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return "cancelled"
    return null
  }
}

async function writeFile(handle: Handle | null, blob: Blob, name: string) {
  if (handle) {
    const w = await handle.createWritable()
    await w.write(blob)
    await w.close()
    return
  }
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = name
  document.body.appendChild(a)
  a.click()
  a.remove()
  setTimeout(() => URL.revokeObjectURL(url), 10000)
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="font-jost text-xs uppercase tracking-[0.14em] text-black/50">{label}</p>
      <p className="mt-1 font-jost text-base font-semibold tabular-nums">{value}</p>
    </div>
  )
}

export default function RecordsClient() {
  const initial = previousQuarter()
  const [fy, setFy] = useState(initial.fyStart)
  const [q, setQ] = useState<string>(String(initial.quarter))
  const [data, setData] = useState<RecordsResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [flash, setFlash] = useState<string | null>(null)
  const [busy, setBusy] = useState<"zip" | "gstr1" | "itc04" | null>(null)
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null)

  const load = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      setData(await adminFetch<RecordsResponse>(`/api/admin/records?fy=${fy}&q=${q}`))
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load the records")
    } finally {
      setLoading(false)
    }
  }, [fy, q])

  useEffect(() => {
    load()
  }, [load])

  const gstr1Name = data?.period.fp ? `GSTR-1-${data.gstin}-${data.period.fp}.json` : ""
  const gstr1Xlsx = gstr1Name.replace(/\.json$/, ".xlsx")
  const zipName = data ? `PBL-records-${data.period.slug}.zip` : ""
  const itc04Name = data ? `ITC-04-${data.gstin}-${data.period.slug}.xlsx` : ""
  const docCount = data ? data.invoices.length + data.creditNotes.length + data.challans.length : 0

  const downloadZip = async () => {
    if (!data) return
    setError(null)
    setFlash(null)
    const handle = await pickSaveLocation(zipName, ZIP_TYPE)
    if (handle === "cancelled") return
    const docs = [
      ...data.invoices.map((d) => ({ ...d, folder: "Invoices" })),
      ...data.creditNotes.map((d) => ({ ...d, folder: "Credit notes" })),
      ...data.challans.map((d) => ({ ...d, folder: "Job work challans" })),
    ]
    setBusy("zip")
    setProgress({ done: 0, total: docs.length })
    try {
      const root = zipName.replace(/\.zip$/, "")
      const entries: ZipEntry[] = []
      const queue = [...docs]
      let done = 0
      const worker = async () => {
        for (let doc = queue.shift(); doc; doc = queue.shift()) {
          const res = await fetch(doc.url, { credentials: "same-origin" })
          if (!res.ok) throw new Error(`Could not get the PDF for ${doc.number} (${res.status})`)
          entries.push({ name: `${root}/${doc.folder}/${doc.fileName}`, data: new Uint8Array(await res.arrayBuffer()) })
          done += 1
          setProgress({ done, total: docs.length })
        }
      }
      await Promise.all([worker(), worker(), worker()])
      entries.sort((a, b) => a.name.localeCompare(b.name))
      const enc = new TextEncoder()
      if (data.invoices.length) entries.push({ name: `${root}/Invoice-register-${data.period.slug}.csv`, data: enc.encode(`\ufeff${data.register}`) })
      if (data.creditRegister) entries.push({ name: `${root}/Credit-note-register-${data.period.slug}.csv`, data: enc.encode(`\ufeff${data.creditRegister}`) })
      if (data.challanRegister) entries.push({ name: `${root}/Job-work-challan-register-${data.period.slug}.csv`, data: enc.encode(`\ufeff${data.challanRegister}`) })
      if (data.itc04) entries.push({ name: `${root}/${itc04Name}`, data: makeXlsx(data.itc04) })
      if (data.gstr1) {
        entries.push({ name: `${root}/${gstr1Name}`, data: enc.encode(JSON.stringify(data.gstr1)) })
        entries.push({ name: `${root}/${gstr1Xlsx}`, data: gstr1Workbook(data) })
      }
      await writeFile(handle, new Blob([makeZip(entries)], { type: "application/zip" }), zipName)
      const parts = [
        data.invoices.length ? `${data.invoices.length} ${data.invoices.length === 1 ? "invoice" : "invoices"}` : "",
        data.creditNotes.length ? `${data.creditNotes.length} ${data.creditNotes.length === 1 ? "credit note" : "credit notes"}` : "",
        data.challans.length ? `${data.challans.length} job work ${data.challans.length === 1 ? "challan" : "challans"}` : "",
      ].filter(Boolean)
      setFlash(`Saved ${zipName}: ${parts.join(" and ")} with the ${parts.length > 1 ? "registers" : "register"}${data.gstr1 ? " and the GSTR-1 file (JSON and Excel)" : ""}.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not prepare the ZIP file")
    } finally {
      setBusy(null)
      setProgress(null)
    }
  }

  const downloadGstr1 = async () => {
    if (!data?.gstr1) return
    setError(null)
    setFlash(null)
    const handle = await pickSaveLocation(gstr1Name, JSON_TYPE)
    if (handle === "cancelled") return
    setBusy("gstr1")
    try {
      await writeFile(handle, new Blob([JSON.stringify(data.gstr1)], { type: "application/json" }), gstr1Name)
      setFlash(`Saved ${gstr1Name}. Upload it on the GST portal as described below.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the GSTR-1 file")
    } finally {
      setBusy(null)
    }
  }

  const downloadGstr1Excel = async () => {
    if (!data?.gstr1) return
    setError(null)
    setFlash(null)
    const handle = await pickSaveLocation(gstr1Xlsx, XLSX_TYPE)
    if (handle === "cancelled") return
    setBusy("gstr1")
    try {
      await writeFile(handle, new Blob([gstr1Workbook(data)], { type: XLSX_MIME }), gstr1Xlsx)
      setFlash(`Saved ${gstr1Xlsx}. Upload the JSON file on the portal; the Excel copy is for checking and for your CA.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the Excel file")
    } finally {
      setBusy(null)
    }
  }

  const downloadItc04 = async () => {
    if (!data?.itc04) return
    setError(null)
    setFlash(null)
    const handle = await pickSaveLocation(itc04Name, XLSX_TYPE)
    if (handle === "cancelled") return
    setBusy("itc04")
    try {
      await writeFile(handle, new Blob([makeXlsx(data.itc04)], { type: XLSX_MIME }), itc04Name)
      setFlash(`Saved ${itc04Name}. Copy its rows into the ITC-04 offline tool, or give it to your CA.`)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not save the ITC-04 file")
    } finally {
      setBusy(null)
    }
  }

  const s = data?.summary
  const gstr1Hint = !data
    ? ""
    : data.period.quarter === null
      ? "Choose a quarter to prepare GSTR-1."
      : data.placeholderGstin
        ? "Add the real GSTIN before preparing GSTR-1."
        : !data.gstr1
          ? "No invoices or credit notes in this quarter. File a nil GSTR-1 on the portal instead."
          : `For return period ${data.period.fp!.slice(0, 2)}/${data.period.fp!.slice(2)}.`

  return (
    <div className="space-y-6">
      <AdminPageHeader title="Records" description="Tax invoices and the GSTR-1 file for each quarter, for your records and for filing." />

      {error && <Alert onDismiss={() => setError(null)}>{error}</Alert>}
      {flash && (
        <Alert tone="success" onDismiss={() => setFlash(null)}>
          {flash}
        </Alert>
      )}

      <Card title="Period">
        <div className="flex flex-col gap-4 sm:flex-row">
          <label className="flex flex-col gap-1.5 font-jost text-sm font-medium">
            Financial year
            <select className={input} value={fy} onChange={(e) => setFy(Number(e.target.value))} disabled={busy !== null}>
              {(data?.years ?? [fy]).map((y) => (
                <option key={y} value={y}>
                  FY {fyLabel(y)}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1.5 font-jost text-sm font-medium">
            Quarter
            <select className={input} value={q} onChange={(e) => setQ(e.target.value)} disabled={busy !== null}>
              {([1, 2, 3, 4] as Quarter[]).map((n) => (
                <option key={n} value={n}>
                  Q{n} ({QUARTER_MONTHS[n]})
                </option>
              ))}
              <option value="all">Whole year</option>
            </select>
          </label>
        </div>
      </Card>

      <Card title="Summary">
        {loading || !data || !s ? (
          <div className="space-y-3">
            <Skeleton className="h-5 w-64" />
            <Skeleton className="h-12 w-full" />
          </div>
        ) : (
          <div className="space-y-5">
            <p className="font-jost text-sm font-semibold">{data.period.label}</p>
            <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
              <Stat label="Invoices" value={String(s.invoices)} />
              <Stat label="Taxable value" value={formatRupeesExact(s.taxableValue)} />
              <Stat label="CGST" value={formatRupeesExact(s.cgst)} />
              <Stat label="SGST" value={formatRupeesExact(s.sgst)} />
              <Stat label="IGST" value={formatRupeesExact(s.igst)} />
              <Stat label="Invoice value" value={formatRupeesExact(s.total)} />
            </div>
            <p className="font-jost text-sm text-black/60">
              GSTR-1 tables: B2B {s.tables.B2B} · B2C large {s.tables.B2CL} · B2C small {s.tables.B2CS}
            </p>
            {s.creditNotes > 0 && (
              <div className="space-y-4 border-t border-black/10 pt-4">
                <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
                  <Stat label="Credit notes" value={String(s.creditNotes)} />
                  <Stat label="Taxable credited" value={formatRupeesExact(s.credited.taxableValue)} />
                  <Stat label="CGST credited" value={formatRupeesExact(s.credited.cgst)} />
                  <Stat label="SGST credited" value={formatRupeesExact(s.credited.sgst)} />
                  <Stat label="IGST credited" value={formatRupeesExact(s.credited.igst)} />
                  <Stat label="Value credited" value={formatRupeesExact(s.credited.total)} />
                </div>
                <div className="grid grid-cols-2 gap-5 sm:grid-cols-3 lg:grid-cols-6">
                  <Stat label="Net" value="After credit notes" />
                  <Stat label="Taxable value" value={formatRupeesExact(s.net.taxableValue)} />
                  <Stat label="CGST" value={formatRupeesExact(s.net.cgst)} />
                  <Stat label="SGST" value={formatRupeesExact(s.net.sgst)} />
                  <Stat label="IGST" value={formatRupeesExact(s.net.igst)} />
                  <Stat label="Value" value={formatRupeesExact(s.net.total)} />
                </div>
              </div>
            )}
            {!data.finished && (
              <Alert tone="info">This period is not over yet. Invoices issued before it ends will be added; download the final copy after it closes.</Alert>
            )}
            {data.placeholderGstin && <Alert>The GSTIN is still a placeholder, so these invoices are specimens and no GSTR-1 file can be prepared.</Alert>}
            {data.warnings.map((w) => (
              <Alert key={w} tone="info">
                {w}
              </Alert>
            ))}
          </div>
        )}
      </Card>

      <Card title="Download">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-jost text-sm font-semibold">
              <FolderArchive className="h-4 w-4" strokeWidth={1.75} aria-hidden /> Invoices (ZIP)
            </div>
            <p className="font-jost text-sm text-black/60">
              Every tax invoice, credit note and job work challan in the period as a PDF, their registers as spreadsheets (CSV), the ITC-04 workbook and, for a quarter, the GSTR-1 file in JSON and Excel.
            </p>
            <button
              type="button"
              className={btn.primary}
              onClick={downloadZip}
              disabled={!data || loading || busy !== null || docCount === 0}
            >
              <Download className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              {busy === "zip" && progress ? `Preparing ${progress.done} of ${progress.total}…` : "Download invoices"}
            </button>
            {data && docCount === 0 && !loading && (
              <p className="font-jost text-xs text-black/50">No invoices, credit notes or job work challans in this period.</p>
            )}
          </div>
          <div className="space-y-3">
            <div className="flex items-center gap-2 font-jost text-sm font-semibold">
              <FileJson className="h-4 w-4" strokeWidth={1.75} aria-hidden /> GSTR-1 file
            </div>
            <p className="font-jost text-sm text-black/60">
              The quarter&apos;s sales and credit notes, filled in for upload on the GST portal: B2B, B2C large, B2C small, credit notes, HSN summary and documents issued.
            </p>
            <div className="flex flex-wrap gap-2">
              <button type="button" className={btn.secondary} onClick={downloadGstr1} disabled={!data?.gstr1 || loading || busy !== null}>
                <Download className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                {busy === "gstr1" ? "Saving…" : "JSON (for upload)"}
              </button>
              <button type="button" className={btn.secondary} onClick={downloadGstr1Excel} disabled={!data?.gstr1 || loading || busy !== null}>
                <FileSpreadsheet className="h-4 w-4" strokeWidth={1.75} aria-hidden />
                Excel
              </button>
            </div>
            <p className="font-jost text-xs text-black/50">
              The Excel copy has the same figures, one sheet per GSTR-1 table, laid out like the GST Offline Tool workbook. Upload the JSON on the portal.
            </p>
            {gstr1Hint && !loading && <p className="font-jost text-xs text-black/50">{gstr1Hint}</p>}
          </div>
          <div className="space-y-3 md:col-span-2 md:border-t md:border-black/10 md:pt-6">
            <div className="flex items-center gap-2 font-jost text-sm font-semibold">
              <FileSpreadsheet className="h-4 w-4" strokeWidth={1.75} aria-hidden /> Job work (ITC-04)
            </div>
            <p className="font-jost text-sm text-black/60">
              Fabric sent to tailors on job work challans (table 4) and the stitched pieces received back (table 5A) in the period, laid out like the ITC-04 offline tool.
              {data && !loading && ` ${data.challanSummary.sent} sent, ${data.challanSummary.received} received back; ${data.challanSummary.open} with tailors now.`}
            </p>
            <button type="button" className={btn.secondary} onClick={downloadItc04} disabled={!data?.itc04 || loading || busy !== null}>
              <FileSpreadsheet className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              {busy === "itc04" ? "Saving…" : "ITC-04 Excel"}
            </button>
            <p className="font-jost text-xs text-black/50">
              File ITC-04 once a year (April to March) while turnover is up to ₹5 crore: choose Whole year above. Above ₹5 crore it is half-yearly.
            </p>
          </div>
        </div>
      </Card>

      <Card title="Saving to this computer and Google Drive">
        <ol className="list-decimal space-y-2 pl-5 font-jost text-sm text-black/75">
          <li>Install Google Drive for desktop once and sign in. It adds a Google Drive folder to this computer that stays in step with Drive.</li>
          <li>Make a folder there called Tax records, with one folder per financial year.</li>
          <li>After each quarter ends, download the invoices and save the ZIP into that year&apos;s folder. One copy is on this computer and Drive keeps the other.</li>
          <li>
            Keep each year&apos;s records for at least six years after the due date of its annual return.
            {data && ` For FY ${fyLabel(data.period.fyStart)} that is until 31 December ${data.period.fyStart + 7}.`}
          </li>
        </ol>
      </Card>

      <Card title="Filing GSTR-1 with this file">
        <ol className="list-decimal space-y-2 pl-5 font-jost text-sm text-black/75">
          <li>After the quarter ends, download the GSTR-1 file for it.</li>
          <li>On gst.gov.in, sign in and open Returns Dashboard. Choose the financial year and the quarter, then GSTR-1.</li>
          <li>Choose Prepare Offline, then Upload, and select the file. Wait until the status shows it was processed.</li>
          <li>Choose Prepare Online and check every table against the summary above. Add anything the site does not record, such as sales made outside the site, and anything the notes above ask you to enter by hand.</li>
          <li>Generate the summary, check it again, and file with EVC (the OTP sent to your registered mobile).</li>
        </ol>
        <p className="mt-4 font-jost text-xs text-black/50">The file follows the format the GST portal accepts for upload. The portal checks every entry, so read any error it shows and correct the order before uploading again.</p>
      </Card>
    </div>
  )
}
