"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import type { ComponentProps, MouseEvent } from "react"

/** Fired on window whenever an in-page anchor navigation starts. The Navbar
    listens for this to hide itself regardless of scroll direction. */
export const ANCHOR_NAV_EVENT = "pb:anchor-nav"

type AnchorLinkProps = ComponentProps<typeof Link> & { href: string }

/**
 * Drop-in for next/link. For links of the form "/#section" while already on
 * the home page, it scrolls smoothly to the section instead of letting Next
 * jump, and announces the navigation so the navbar can get out of the way.
 * Everything else behaves exactly like <Link>.
 */
export default function AnchorLink({ href, onClick, children, ...rest }: AnchorLinkProps) {
  const pathname = usePathname()

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e)
    if (e.defaultPrevented) return

    const hash = href.startsWith("/#") ? href.slice(1) : null
    if (!hash || pathname !== "/") return

    const target = document.querySelector<HTMLElement>(hash)
    if (!target) return

    e.preventDefault()
    window.dispatchEvent(new CustomEvent(ANCHOR_NAV_EVENT))
    target.scrollIntoView({ behavior: "smooth", block: "start" })
    history.replaceState(null, "", hash)
  }

  return (
    <Link href={href} onClick={handleClick} {...rest}>
      {children}
    </Link>
  )
}
