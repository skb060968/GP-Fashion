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

// Shared icon sizing so Menu and the right-hand icons scale together.
const ICON_CLASS = "h-5 w-5 sm:h-6 sm:w-6 lg:h-7 lg:w-7 2xl:h-8 2xl:w-8"

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
        className="relative flex h-20 w-full items-center justify-between px-3 sm:h-24 sm:px-6 lg:h-28 lg:px-10 2xl:h-32 2xl:px-14"
      >
        {/* Left: Menu */}
        <div
          ref={menuRef}
          className="relative"
          onMouseEnter={openMenu}
          onMouseLeave={scheduleClose}
        >
          <button
            type="button"
            onClick={() => setMenuOpen((v) => !v)}
            aria-expanded={menuOpen}
            aria-controls="primary-menu"
            aria-haspopup="true"
            className="group -ml-2 flex items-center gap-2 rounded p-2 text-white transition-colors hover:text-white/70 focus-visible:ring-white lg:gap-3"
          >
            {menuOpen ? (
              <X className={ICON_CLASS} strokeWidth={1.5} aria-hidden />
            ) : (
              <Menu className={ICON_CLASS} strokeWidth={1.5} aria-hidden />
            )}
            <span className="hidden font-cinzel text-xs uppercase tracking-[0.25em] sm:inline lg:text-sm 2xl:text-base">
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
                className="block px-6 py-3 font-cinzel text-xs uppercase tracking-[0.25em] text-white/80 transition-colors hover:bg-white/5 hover:text-white focus-visible:ring-white lg:text-sm"
              >
                {link.label}
              </Link>
            ))}
          </div>
        </div>

        {/* Center: Logo + name. Absolutely positioned so it is always at the
            exact centre of the viewport regardless of the side widths. */}
        <Link
          href="/"
          aria-label="Piyush Bholla, home"
          className="group absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded px-2 focus-visible:ring-white"
        >
          <Image
            src="/images/brand/logo-mark.png"
            alt=""
            width={213}
            height={320}
            priority
            className="h-9 w-auto transition-transform duration-300 ease-out group-hover:scale-105 sm:h-11 lg:h-14 2xl:h-16"
          />
          <span className="mt-1 whitespace-nowrap font-cinzel text-xs font-bold uppercase tracking-[0.2em] text-brand-gold sm:mt-1.5 sm:text-base sm:tracking-[0.3em] lg:text-xl 2xl:text-2xl">
            Piyush Bholla
          </span>
        </Link>

        {/* Right: Wishlist / Bag / Login */}
        <div className="-mr-2 flex items-center sm:gap-2 lg:gap-4">
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
                <Icon className={ICON_CLASS} strokeWidth={1.5} aria-hidden />
                {isBag && bagCount > 0 && (
                  <span
                    aria-hidden
                    className="absolute right-0 top-0 flex h-4 min-w-4 items-center justify-center rounded-full bg-brand-gold px-1 text-[10px] font-semibold leading-none text-black lg:h-5 lg:min-w-5 lg:text-[11px]"
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
