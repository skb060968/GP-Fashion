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
// phone 28 → sm 36 → lg 44 → 2xl 64
const ICON_CLASS = "h-7 w-7 sm:h-9 sm:w-9 lg:h-11 lg:w-11 2xl:h-16 2xl:w-16"

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
    <header className="fixed top-0 z-50 w-full border-b border-black/10 bg-white text-black">
      <nav
        aria-label="Primary"
        className="relative flex h-28 w-full items-center justify-between px-3 sm:h-40 sm:px-6 lg:h-48 lg:px-10 2xl:h-64 2xl:px-14"
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
            className="group -ml-2 flex items-center gap-2 rounded p-2 text-black transition-colors hover:text-black/60 focus-visible:ring-black lg:gap-4"
          >
            {menuOpen ? (
              <X className={ICON_CLASS} strokeWidth={2} aria-hidden />
            ) : (
              <Menu className={ICON_CLASS} strokeWidth={2} aria-hidden />
            )}
            <span className="hidden font-jost text-base font-semibold uppercase tracking-[0.18em] sm:inline lg:text-xl 2xl:text-2xl">
              Menu
            </span>
          </button>

          {/* Dropdown */}
          <div
            id="primary-menu"
            role="menu"
            className={`absolute left-0 top-full mt-3 min-w-[220px] origin-top-left border border-black/10 bg-white py-2 shadow-2xl transition-all duration-200 ease-out sm:min-w-[260px] sm:py-3 lg:min-w-[320px] lg:py-4 ${
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
                className="block px-5 py-3 font-jost text-sm font-semibold uppercase tracking-[0.18em] text-black/80 transition-colors hover:bg-black/5 hover:text-black focus-visible:ring-black sm:px-6 sm:text-base lg:px-8 lg:py-4 lg:text-lg 2xl:text-xl"
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
          className="group absolute left-1/2 top-1/2 flex -translate-x-1/2 -translate-y-1/2 flex-col items-center rounded px-2 focus-visible:ring-black"
        >
          <Image
            src="/images/brand/logo-mark.png"
            alt=""
            width={213}
            height={320}
            priority
            className="h-12 w-auto transition-transform duration-300 ease-out group-hover:scale-105 sm:h-20 lg:h-24 2xl:h-32"
          />
          {/* On phones the name wraps to two lines so it never collides with
              the icons; from sm upward it sits on one line. */}
          <span className="mt-1 text-center font-cinzel text-base font-bold uppercase leading-tight tracking-[0.15em] text-black sm:mt-2 sm:whitespace-nowrap sm:text-2xl lg:mt-3 lg:text-4xl lg:tracking-[0.25em] 2xl:text-5xl 2xl:tracking-[0.3em]">
            Piyush
            <br className="sm:hidden" />
            <span className="hidden sm:inline">&nbsp;</span>
            Bholla
          </span>
        </Link>

        {/* Right: Wishlist / Bag / Login */}
        <div className="-mr-2 flex items-center sm:gap-1 lg:gap-4">
          {iconLinks.map(({ label, href, Icon }) => {
            const isBag = label === "Bag"
            return (
              <Link
                key={label}
                href={href}
                aria-label={
                  isBag && bagCount > 0 ? `${label}, ${bagCount} items` : label
                }
                className="relative rounded p-1.5 text-black transition-colors hover:text-black/60 focus-visible:ring-black sm:p-2"
              >
                <Icon className={ICON_CLASS} strokeWidth={1.25} aria-hidden />
                {isBag && bagCount > 0 && (
                  <span
                    aria-hidden
                    className="absolute right-0 top-0 flex h-5 min-w-5 items-center justify-center rounded-full bg-black px-1 text-[11px] font-semibold leading-none text-white lg:h-6 lg:min-w-6 lg:text-xs 2xl:h-7 2xl:min-w-7 2xl:text-sm"
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
