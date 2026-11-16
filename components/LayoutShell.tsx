"use client"

import { usePathname } from "next/navigation"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import SplashScreen from "@/components/SplashScreen"
import WhatsAppButton from "@/components/WhatsAppButton"
import type { StorefrontNav } from "@/lib/data/categories"

export default function LayoutShell({ children, nav }: { children: React.ReactNode; nav: StorefrontNav }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith("/admin")
  const isHome = pathname === "/"

  const offset = isAdmin || isHome ? "" : "pt-[var(--nav-h)]"

  return (
    <>
      {!isAdmin && (
        <a
          href="#main"
          className="sr-only font-jost text-sm font-semibold uppercase tracking-[0.15em] focus:not-sr-only focus:fixed focus:left-4 focus:top-4 focus:z-[60] focus:bg-white focus:px-4 focus:py-3 focus:text-black focus:outline-none focus:ring-2 focus:ring-black focus:ring-offset-2"
        >
          Skip to content
        </a>
      )}
      {!isAdmin && <SplashScreen />}
      {!isAdmin && <Navbar nav={nav} />}
      <main id="main" tabIndex={-1} className={`flex-grow outline-none ${offset}`}>
        {children}
      </main>
      {!isAdmin && <Footer nav={nav} />}
      {!isAdmin && <WhatsAppButton />}
    </>
  )
}
