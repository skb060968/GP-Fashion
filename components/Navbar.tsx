"use client"

import { useEffect, useRef, useState } from "react"
import Link from "next/link"
import Image from "next/image"
import { usePathname } from "next/navigation"
import { Menu, X, Heart, ShoppingBag, User, Search } from "lucide-react"
import { useCart } from "@/context/CartContext"
import { useUser } from "@/context/UserContext"
import AnchorLink, { ANCHOR_NAV_EVENT } from "@/components/AnchorLink"

const menuLinks = [
  { label: "Menswear", href: "/#menswear" },
  { label: "Womenswear", href: "/#womenswear" },
  { label: "About Us", href: "/#about-us" },
  { label: "Services", href: "/services" },
  { label: "Contact", href: "/contact" },
  { label: "Track Order", href: "/track-order" },
]

const iconLinks = [
  { label: "Search", href: "/shop?focus=1", Icon: Search },
  { label: "Wishlist", href: "/wishlist", Icon: Heart },
  { label: "Bag", href: "/bag", Icon: ShoppingBag },
  { label: "Account", href: "/account", Icon: User },
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
  const { user } = useUser()

  const bagCount = cart.reduce((sum, item) => sum + item.quantity, 0)

  // Hide on scroll down, reveal on scroll up. Always shown near the top of the
  // page and while the menu is open.
  const [hidden, setHidden] = useState(false)

  // Route change: close the menu and show the bar (new pages start at the top).
  useEffect(() => {
    setMenuOpen(false)
    setHidden(false)
  }, [pathname])

  useEffect(() => {
    let lastY = window.scrollY
    let ticking = false
    const THRESHOLD = 8 // ignore tiny jitters

    // While an in-page anchor scroll is running we ignore direction, so an
    // upward programmatic scroll (e.g. from a footer link) doesn't reveal the
    // bar on top of the section heading. Suppression lasts until the scroll
    // position has been still for a moment, however long the scroll takes.
    let suppressing = false
    let settleTimer: ReturnType<typeof setTimeout> | undefined
    let safetyTimer: ReturnType<typeof setTimeout> | undefined

    const endSuppression = () => {
      suppressing = false
      lastY = window.scrollY
      if (settleTimer) clearTimeout(settleTimer)
      if (safetyTimer) clearTimeout(safetyTimer)
    }

    const update = () => {
      ticking = false
      const y = window.scrollY

      if (suppressing) {
        if (settleTimer) clearTimeout(settleTimer)
        settleTimer = setTimeout(endSuppression, 150)
        return
      }

      const delta = y - lastY
      if (y < 80) {
        setHidden(false)
      } else if (delta > THRESHOLD) {
        setHidden(true)
        setMenuOpen(false)
      } else if (delta < -THRESHOLD) {
        setHidden(false)
      }
      if (Math.abs(delta) > THRESHOLD) lastY = y
    }

    const onScroll = () => {
      if (!ticking) {
        ticking = true
        requestAnimationFrame(update)
      }
    }

    const onAnchorNav = () => {
      suppressing = true
      setHidden(true)
      setMenuOpen(false)
      if (settleTimer) clearTimeout(settleTimer)
      settleTimer = setTimeout(endSuppression, 150) // in case no scroll happens
      if (safetyTimer) clearTimeout(safetyTimer)
      safetyTimer = setTimeout(endSuppression, 4000)
    }

    // Full page load straight onto a home-page section (e.g. /#about-us):
    // the browser has already scrolled, so start hidden.
    if (
      window.location.pathname === "/" &&
      window.location.hash &&
      window.scrollY > 80
    ) {
      setHidden(true)
    }

    window.addEventListener("scroll", onScroll, { passive: true })
    window.addEventListener(ANCHOR_NAV_EVENT, onAnchorNav)
    return () => {
      window.removeEventListener("scroll", onScroll)
      window.removeEventListener(ANCHOR_NAV_EVENT, onAnchorNav)
      if (settleTimer) clearTimeout(settleTimer)
      if (safetyTimer) clearTimeout(safetyTimer)
    }
  }, [])

  const navHidden = hidden && !menuOpen

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
  // Only a real mouse should trigger hover. Touch taps emit a synthetic
  // "enter" before the click, which would open then immediately toggle closed.
  const openMenu = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return
    if (closeTimer.current) clearTimeout(closeTimer.current)
    setMenuOpen(true)
  }
  const scheduleClose = (e: React.PointerEvent) => {
    if (e.pointerType !== "mouse") return
    if (closeTimer.current) clearTimeout(closeTimer.current)
    closeTimer.current = setTimeout(() => setMenuOpen(false), 150)
  }

  return (
    <header
      className={`fixed top-0 z-50 w-full border-b border-black/10 bg-white text-black transition-transform duration-300 ease-out motion-reduce:transition-none ${
        navHidden ? "-translate-y-full" : "translate-y-0"
      }`}
    >
      <nav
        aria-label="Primary"
        className="relative flex h-[var(--nav-h)] w-full items-center justify-between px-3 sm:px-6 lg:px-10 2xl:px-14"
      >
        {/* Left: Menu */}
        {/* Wrapper spans the full bar height (not `relative`) so the dropdown
            positions against the nav and hovering anywhere in this column keeps
            the menu open while the pointer travels down to it. */}
        <div
          ref={menuRef}
          className="flex h-full items-center"
          onPointerEnter={openMenu}
          onPointerLeave={scheduleClose}
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
            className={`absolute left-3 top-full w-44 origin-top-left border border-t-0 border-black/10 bg-white py-2 shadow-2xl transition-all duration-200 ease-out sm:left-6 sm:w-60 sm:py-3 lg:left-10 lg:w-72 lg:py-4 2xl:left-14 ${
              menuOpen
                ? "visible translate-y-0 opacity-100"
                : "invisible -translate-y-1 opacity-0"
            }`}
          >
            {menuLinks.map((link) => (
              <AnchorLink
                key={link.label}
                href={link.href}
                role="menuitem"
                tabIndex={menuOpen ? 0 : -1}
                onClick={() => setMenuOpen(false)}
                className="block px-4 py-3 font-jost text-sm font-semibold uppercase tracking-[0.15em] text-black/80 transition-colors hover:bg-black/5 hover:text-black focus-visible:ring-black sm:px-6 sm:text-base sm:tracking-[0.18em] lg:px-8 lg:py-4 lg:text-lg 2xl:text-xl"
              >
                {link.label}
              </AnchorLink>
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
            const isAccount = label === "Account"
            const ariaLabel = isBag && bagCount > 0 ? `${label}, ${bagCount} items` : isAccount ? (user ? `Account, ${user.email}` : "Sign in") : label
            return (
              <Link
                key={label}
                href={isAccount && !user ? "/login" : href}
                aria-label={ariaLabel}
                className="relative rounded p-1.5 text-black transition-colors hover:text-black/60 focus-visible:ring-black sm:p-2"
              >
                <Icon className={ICON_CLASS} strokeWidth={1.25} aria-hidden />
                {isAccount && user && (
                  <span aria-hidden className="absolute right-1 top-1 h-2 w-2 rounded-full bg-black ring-2 ring-white lg:h-2.5 lg:w-2.5" />
                )}
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
