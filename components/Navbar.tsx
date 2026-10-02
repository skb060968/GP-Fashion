"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, X, Heart, ShoppingBag, User } from "lucide-react"
import { useCart } from "@/context/CartContext"

// Design-only for now: destinations will be wired up in a later pass.
const menuLinks = [
  { label: "Menswear", href: "#" },
  { label: "Womenswear", href: "#" },
  { label: "About Us", href: "#" },
]

const iconLinks = [
  { label: "Wishlist", href: "#", Icon: Heart },
  { label: "Bag", href: "#", Icon: ShoppingBag },
  { label: "Login", href: "#", Icon: User },
]

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pathname = usePathname()
  const { cart } = useCart()

  const bagCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Close on route change
  useEffect(() => {
    setMenuOpen(false)
  }, [pathname])

  // Close on outside click / Escape
  useEffect(() => {
    if (!menuOpen) return
    const onPointerDown = (e: PointerEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setMenuOpen(false)
      }
    }
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false)
    }
    document.addEventListener("pointerdown", onPointerDown)
    document.addEventListener("keydown", onKeyDown)
    return () => {
      document.removeEventListener("pointerdown", onPointerDown)
      document.removeEventListener("keydown", onKeyDown)
    }
  }, [menuOpen])

  // Hover intent: open immediately, close after a short delay so the
  // pointer can travel from the trigger into the dropdown.
  const openMenu = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setMenuOpen(true)
  }
  const scheduleClose = () => {
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setMenuOpen(false), 150)
  }

  return (
    <header className="fixed top-0 z-50 w-full bg-black text-white">
      <nav
        aria-label="Primary"
        className="container-max grid h-[72px] grid-cols-[1fr_auto_1fr] items-center lg:h-[88px]"
      >
        {/* Left: Menu */}
        <div
          ref={menuRef}
          className="relative justify-self-start"
          onMouseEnter={openMenu}
          onMouseLeave={scheduleClose}
        >
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="primary-menu"
            aria-haspopup="true"
            className="group -ml-2 flex items-center gap-2 rounded px-2 py-2 text-white transition-colors hover:text-white/70 focus-visible:ring-white"
          >
            {menuOpen ? (
              <X className="h-6 w-6" strokeWidth={1.5} aria-hidden />
            ) : (
              <Menu className="h-6 w-6" strokeWidth={1.5} aria-hidden />
            )}
            <span className="hidden font-cinzel text-xs tracking-[0.25em] sm:inline">
              Menu
            </span>
          </button>

          {/* Dropdown */}
          <div
            id="primary-menu"
            role="menu"
            className={`absolute left-0 top-full mt-3 min-w-[220px] origin-top-left border border-white/15 bg-black py-3 shadow-2xl transition-all duration-200 ease-out ${
              menuOpen
                ? "visible translate-y-0 opacity-100"
                : "invisible -translate-y-1 opacity-0"
            }`}
          >
            {menuLinks.map((link) => (
              <Link
                key={link.label}
                href={link.href}
                role="menuitem"
                tabIndex={menuOpen ? 0 : -1}
                onClick={() => setMenuOpen(false)}
                className="block px-6 py-3 font-cinzel text-xs uppercase tracking-[0.25em] text-white/80 transition-colors hover:bg-white/5 hover:text-white focus-visible:ring-white"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Center: Logo + name */}
        <Link
          href="/"
          aria-label="Piyush Bholla, home"
          className="group flex flex-col items-center justify-self-center rounded px-2 focus-visible:ring-white"
        >
          <Image
            src="/images/brand/logo-mark.png"
            alt=""
            width={213}
            height={320}
            priority
            className="h-9 w-auto transition-transform duration-300 ease-out group-hover:scale-105 lg:h-11"
          />
          <span className="mt-1 font-cinzel text-[11px] font-medium uppercase tracking-[0.35em] lg:text-xs">
            Piyush Bholla
          </span>
        </Link>

        {/* Right: Wishlist / Bag / Login */}
        <div className="flex items-center gap-1 justify-self-end sm:gap-3">
          {iconLinks.map(({ label, href, Icon }) => {
            const isBag = label === "Bag"
            return (
              <Link
                key={label}
                href={href}
                aria-label={
                  isBag && bagCount > 0 ? `${label}, ${bagCount} items` : label
                }
                className="relative rounded p-2 text-white transition-colors hover:text-white/70 focus-visible:ring-white"
              >
                <Icon className="h-[22px] w-[22px]" strokeWidth={1.5} aria-hidden />
                {isBag && bagCount > 0 && (
                  <span
                    aria-hidden
                    className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-white px-1 text-[10px] font-semibold leading-none text-black"
                  >
                    {bagCount}
                  </span>
                )}
              </Link>
            )
          })}
        </div>
      </nav>
    </header>
  )
}
