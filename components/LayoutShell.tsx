"use client"

import { usePathname } from "next/navigation"
import Navbar from "@/components/Navbar"
import Footer from "@/components/Footer"
import SplashScreen from "@/components/SplashScreen"

export default function LayoutShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isAdmin = pathname.startsWith("/admin")
  const isHome = pathname === "/"

  // The navbar is fixed. The home page runs its hero video underneath it;
  // every other page needs top padding equal to the navbar height.
  const offset = isAdmin || isHome ? "" : "pt-[var(--nav-h)]"

  return (
    <>
      {!isAdmin && <SplashScreen />}
      {!isAdmin && <Navbar />}
      <main className={`flex-grow ${offset}`}>{children}</main>
      {!isAdmin && <Footer />}
    </>
  )
}
