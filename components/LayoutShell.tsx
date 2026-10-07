"use client"

import { usePathname } from "next/navigation"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import SplashScreen from "@/components/SplashScreen"
import WhatsAppButton from "@/components/WhatsAppButton"

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith("/admin")
  const isHome = pathname === "/"

  const offset = isAdmin || isHome ? "" : "pt-[var(--nav-h)]"

  return (
    <>
      {!isAdmin && <SplashScreen />}
      {!isAdmin && <Navbar />}
      <main className={`flex-grow ${offset}`}>{children}</main>
      {!isAdmin && <Footer />}
      {!isAdmin && <WhatsAppButton />}
    </>
  )
}
