"use client"

import { useMemo, useState, type FormEvent } from "react"
import { BookOpen, Check, Copy, Info, Search, ShieldAlert, TriangleAlert, X } from "lucide-react"
import { AdminPageHeader } from "@/components/admin/AdminShell"
import { input } from "@/components/admin/ui"
import { adminHelpTopics, type HelpBlock, type HelpTone } from "@/lib/data/adminHelp"
import { ACTIVE_CATEGORY_SLUGS, categoryMeta, getAllProducts, getCollections } from "@/lib/data/categories"
import { classifications } from "@/lib/data/shop"

function blockText(block: HelpBlock): string {
  if (block.type === "text" || block.type === "note") return block.text
  if (block.type === "code") return `${block.label || ""} ${block.code}`
  if (block.type === "steps" || block.type === "list") return block.items.join(" ")
  return `${block.headers.join(" ")} ${block.rows.flat().join(" ")}`
}

function topicText(topic: (typeof adminHelpTopics)[number]): string {
  return [
    topic.title,
    topic.summary,
    ...topic.keywords,
    ...topic.sections.flatMap((section) => [section.title || "", ...section.blocks.map(blockText)]),
  ].join(" ").toLocaleLowerCase()
}

const toneClasses: Record<HelpTone, string> = {
  info: "border-blue-200 bg-blue-50 text-blue-950",
  warning: "border-amber-200 bg-amber-50 text-amber-950",
  danger: "border-red-200 bg-red-50 text-red-950",
}

const toneIcons = {
  info: Info,
  warning: TriangleAlert,
  danger: ShieldAlert,
}

function CodeBlock({ label, code }: { label?: string; code: string }) {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    await navigator.clipboard.writeText(code)
    setCopied(true)
    window.setTimeout(() => setCopied(false), 1800)
  }

  return (
    <div className="overflow-hidden rounded-lg border border-black/10 bg-stone-950 text-white">
      <div className="flex items-center justify-between gap-4 border-b border-white/10 px-4 py-2.5">
        <p className="min-w-0 truncate font-jost text-xs text-white/60">{label || "Copy"}</p>
        <button type="button" onClick={copy} className="inline-flex shrink-0 items-center gap-1.5 rounded px-2 py-1 font-jost text-xs text-white/70 hover:bg-white/10 hover:text-white focus-visible:ring-white">
          {copied ? <Check className="h-3.5 w-3.5" strokeWidth={2} aria-hidden /> : <Copy className="h-3.5 w-3.5" strokeWidth={1.75} aria-hidden />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto whitespace-pre p-4 font-mono text-xs leading-6 text-white/90 sm:text-sm"><code>{code}</code></pre>
    </div>
  )
}

function Block({ block }: { block: HelpBlock }) {
  if (block.type === "text") return <p className="font-jost text-sm leading-7 text-black/75 sm:text-base">{block.text}</p>

  if (block.type === "steps") {
    return (
      <ol className="space-y-3">
        {block.items.map((item, index) => (
          <li key={item} className="flex gap-3 font-jost text-sm leading-6 text-black/75 sm:text-base sm:leading-7">
            <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-black font-jost text-[11px] font-semibold text-white">{index + 1}</span>
            <span>{item}</span>
          </li>
        ))}
      </ol>
    )
  }

  if (block.type === "list") {
    return (
      <ul className="space-y-2.5">
        {block.items.map((item) => (
          <li key={item} className="flex gap-3 font-jost text-sm leading-6 text-black/75 sm:text-base sm:leading-7">
            <span aria-hidden className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-black/50" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    )
  }

  if (block.type === "code") return <CodeBlock label={block.label} code={block.code} />

  if (block.type === "note") {
    const Icon = toneIcons[block.tone]
    return (
      <div className={`flex items-start gap-3 rounded-lg border p-4 ${toneClasses[block.tone]}`}>
        <Icon className="mt-0.5 h-4 w-4 shrink-0" strokeWidth={1.75} aria-hidden />
        <p className="font-jost text-sm leading-6">{block.text}</p>
      </div>
    )
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-black/10">
      <table className="w-full min-w-[34rem] border-collapse text-left font-jost text-sm">
        <thead className="bg-stone-50 text-[11px] uppercase tracking-[0.12em] text-black/55">
          <tr>{block.headers.map((header) => <th key={header} className="border-b border-black/10 px-4 py-3 font-semibold">{header}</th>)}</tr>
        </thead>
        <tbody className="divide-y divide-black/5">
          {block.rows.map((row, rowIndex) => (
            <tr key={`${rowIndex}-${row.join("-")}`}>
              {row.map((cell, cellIndex) => <td key={`${cellIndex}-${cell}`} className={`px-4 py-3 align-top leading-6 ${cellIndex === 0 ? "font-medium text-black" : "text-black/70"}`}>{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export default function HelpCenterClient() {
  const [query, setQuery] = useState("")
  const normalized = query.trim().toLocaleLowerCase()
  const terms = normalized.split(/\s+/).filter(Boolean)
  const topics = useMemo(
    () => terms.length ? adminHelpTopics.filter((topic) => {
      const text = topicText(topic)
      return terms.every((term) => text.includes(term))
    }) : adminHelpTopics,
    [normalized]
  )

  const stats = [
    { label: "Products", value: getAllProducts().length },
    { label: "Collections", value: getCollections().length },
    { label: "Active categories", value: ACTIVE_CATEGORY_SLUGS.length },
    { label: "Classifications", value: classifications.length },
  ]

  const openFirstResult = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const first = topics[0]
    if (!normalized || !first) return
    const target = document.getElementById(first.id)
    if (!target) return
    window.history.replaceState(null, "", `${window.location.pathname}${window.location.search}#${first.id}`)
    target.focus({ preventScroll: true })
    target.scrollIntoView({ behavior: "smooth", block: "start" })
  }

  return (
    <>
      <AdminPageHeader title="Help Center" description="Searchable operating guide for the storefront, catalogue, orders, deployment, and security." />

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 sm:gap-4">
        {stats.map((stat) => (
          <div key={stat.label} className="rounded-xl border border-black/10 bg-white p-4">
            <p className="font-jost text-[11px] font-semibold uppercase tracking-[0.15em] text-black/50">{stat.label}</p>
            <p className="mt-2 font-cinzel text-2xl font-bold tabular-nums">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-black/10 bg-white p-4 sm:p-5">
        <label htmlFor="help-search" className="font-jost text-xs font-semibold uppercase tracking-[0.15em] text-black/60">Search the guide</label>
        <form onSubmit={openFirstResult} className="mt-2 flex flex-col gap-2 sm:flex-row">
          <div className="relative min-w-0 flex-1">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-black/40" strokeWidth={1.75} aria-hidden />
            <input
              id="help-search"
              type="search"
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Try: add a dress, delete collection, refund, deploy, login code…"
              className={`${input} w-full pl-9 pr-10`}
            />
            {query && (
              <button type="button" onClick={() => setQuery("")} aria-label="Clear help search" className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1.5 text-black/45 hover:text-black focus-visible:ring-black">
                <X className="h-4 w-4" strokeWidth={1.75} aria-hidden />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={!normalized || topics.length === 0}
            className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-black px-5 font-jost text-sm font-semibold text-white transition-colors hover:bg-black/85 focus-visible:ring-black disabled:cursor-not-allowed disabled:opacity-35"
          >
            <Search className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            Search
          </button>
        </form>
        <p aria-live="polite" className="mt-2 font-jost text-xs text-black/45">
          {normalized
            ? `${topics.length} of ${adminHelpTopics.length} topics match. ${topics.length ? "Press Enter, select Search, or choose a matching topic below." : "Try a different search."}`
            : `${adminHelpTopics.length} topics available. Start typing to filter the guide.`}
        </p>
      </div>

      {topics.length === 0 ? (
        <div className="mt-6 rounded-xl border border-black/10 bg-white px-6 py-16 text-center">
          <Search className="mx-auto h-7 w-7 text-black/35" strokeWidth={1.5} aria-hidden />
          <h2 className="mt-4 font-jost text-sm font-semibold">No help topic matches</h2>
          <p className="mt-1 font-jost text-sm text-black/55">Try a shorter word such as product, order, image, email, or deploy.</p>
          <button type="button" onClick={() => setQuery("")} className="mt-5 font-jost text-sm font-semibold underline underline-offset-4">Clear search</button>
        </div>
      ) : (
        <div className="mt-6 grid min-w-0 gap-6 lg:grid-cols-[14rem_minmax(0,1fr)]">
          <nav aria-label="Help topics" className="help-topic-nav -mx-4 overflow-x-auto px-4 sm:mx-0 sm:px-0 lg:sticky lg:top-8 lg:self-start lg:overflow-visible">
            <p className="mb-2 shrink-0 font-jost text-[11px] font-semibold uppercase tracking-[0.15em] text-black/45">
              {normalized ? "Matching topics" : "All topics"}
            </p>
            <div className="flex gap-2 lg:flex-col">
              {topics.map((topic) => (
                <a key={topic.id} href={`#${topic.id}`} className="inline-flex shrink-0 items-center gap-2 rounded-lg border border-black/10 bg-white px-3 py-2.5 font-jost text-xs font-medium text-black/65 transition-colors hover:border-black hover:text-black focus-visible:ring-black lg:w-full">
                  <BookOpen className="h-3.5 w-3.5 shrink-0" strokeWidth={1.75} aria-hidden />
                  {topic.title}
                </a>
              ))}
            </div>
          </nav>

          <article className="min-w-0 space-y-6">
            {topics.map((topic) => (
              <section key={topic.id} id={topic.id} tabIndex={-1} className="!scroll-mt-20 rounded-xl border border-black/10 bg-white p-5 focus:outline-none focus-visible:ring-2 focus-visible:ring-black sm:p-6 lg:!scroll-mt-8">
                <header className="border-b border-black/10 pb-5">
                  <h2 className="font-cinzel text-lg font-bold uppercase tracking-[0.04em] sm:text-xl">{topic.title}</h2>
                  <p className="mt-2 font-jost text-sm leading-6 text-black/55">{topic.summary}</p>
                </header>
                <div className="mt-6 space-y-8">
                  {topic.sections.map((section, sectionIndex) => (
                    <div key={`${topic.id}-${section.title || sectionIndex}`} className="space-y-4">
                      {section.title && <h3 className="font-jost text-sm font-semibold uppercase tracking-[0.12em] text-black/80">{section.title}</h3>}
                      {section.blocks.map((block, blockIndex) => <Block key={`${topic.id}-${sectionIndex}-${blockIndex}`} block={block} />)}
                    </div>
                  ))}
                </div>
              </section>
            ))}
          </article>
        </div>
      )}
    </>
  )
}
