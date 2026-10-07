"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname, useRouter } from "next/navigation"
import { LayoutDashboard, LogOut, Menu, Package, TicketPercent, X, ExternalLink } from "lucide-react"

const NAV = [
  { href: "/admin", label: "Dashboard", Icon: LayoutDashboard, match: (p: string) => p === "/admin" },
  { href: "/admin/orders", label: "Orders", Icon: Package, match: (p: string) => p.startsWith("/admin/orders") },
  { href: "/admin/coupons", label: "Coupons", Icon: TicketPercent, match: (p: string) => p.startsWith("/admin/coupons") },
] as const

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [loggingOut, setLoggingOut] = useState(false)

  useEffect(() => setOpen(false), [pathname])

  const logout = async () => {
    setLoggingOut(true)
    try {
      await fetch("/api/admin/logout", { method: "POST" })
    } finally {
      router.replace("/admin-login")
    }
  }

  const nav = (
    <nav aria-label="Admin" className="flex flex-col gap-1">
      {NAV.map(({ href, label, Icon, match }) => {
        const active = match(pathname)
        return (
          <Link
            key={href}
            href={href}
            aria-current={active ? "page" : undefined}
            className={`flex items-center gap-3 rounded-md px-3 py-2.5 font-jost text-sm font-medium transition-colors focus-visible:ring-black ${
              active ? "bg-black text-white" : "text-black/70 hover:bg-black/5 hover:text-black"
            }`}
          >
            <Icon className="h-4 w-4" strokeWidth={1.75} aria-hidden />
            {label}
          </Link>
        )
      })}
    </nav>
  )

  const brand = (
    <Link href="/admin" className="flex items-center gap-3 focus-visible:ring-black">
      <Image src="/images/brand/logo-mark.png" alt="" width={213} height={320} className="h-8 w-auto" />
      <span className="leading-tight">
        <span className="block font-cinzel text-xs font-bold uppercase tracking-[0.04em]">Piyush Bholla</span>
        <span className="block font-jost text-[11px] uppercase tracking-[0.2em] text-black/50">Admin</span>
      </span>
    </Link>
  )

  const footerLinks = (
    <div className="space-y-1">
      <a
        href="/"
        target="_blank"
        rel="noopener"
        className="flex items-center gap-3 rounded-md px-3 py-2.5 font-jost text-sm text-black/60 transition-colors hover:bg-black/5 hover:text-black"
      >
        <ExternalLink className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        View site
      </a>
      <button
        type="button"
        onClick={logout}
        disabled={loggingOut}
        className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 font-jost text-sm text-black/60 transition-colors hover:bg-black/5 hover:text-black disabled:opacity-50"
      >
        <LogOut className="h-4 w-4" strokeWidth={1.75} aria-hidden />
        {loggingOut ? "Signing out…" : "Sign out"}
      </button>
    </div>
  )

  return (
    <div className="min-h-screen bg-stone-50 text-black">

      <aside className="fixed inset-y-0 left-0 hidden w-60 flex-col border-r border-black/10 bg-white lg:flex">
        <div className="border-b border-black/10 px-5 py-5">{brand}</div>
        <div className="flex-1 overflow-y-auto px-3 py-4">{nav}</div>
        <div className="border-t border-black/10 px-3 py-3">{footerLinks}</div>
      </aside>

      <header className="sticky top-0 z-40 flex h-14 items-center justify-between border-b border-black/10 bg-white px-4 lg:hidden">
        {brand}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-expanded={open}
          aria-label={open ? "Close menu" : "Open menu"}
          className="-mr-2 rounded p-2 focus-visible:ring-black"
        >
          {open ? <X className="h-5 w-5" strokeWidth={1.75} /> : <Menu className="h-5 w-5" strokeWidth={1.75} />}
        </button>
      </header>

      {open && (
        <div className="fixed inset-0 z-30 lg:hidden" onClick={() => setOpen(false)}>
          <div className="absolute inset-0 bg-black/30" />
          <div
            className="absolute inset-x-0 top-14 border-b border-black/10 bg-white p-3 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            {nav}
            <div className="mt-2 border-t border-black/10 pt-2">{footerLinks}</div>
          </div>
        </div>
      )}

      <main className="lg:pl-60">
        <div className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6 lg:px-8 lg:py-10">{children}</div>
      </main>
    </div>
  )
}

export function AdminPageHeader({
  title,
  description,
  actions,
}: {
  title: string
  description?: string
  actions?: React.ReactNode
}) {
  return (
    <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between lg:mb-8">
      <div>
        <h1 className="font-cinzel text-xl font-bold uppercase tracking-[0.04em] sm:text-2xl">{title}</h1>
        {description && <p className="mt-1 font-jost text-sm text-black/60">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </div>
  )
}
