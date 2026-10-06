"use client"

import { usePathname } from "next/navigation"
import WhatsAppIcon from "@/components/WhatsAppIcon"
import { whatsappHref } from "@/lib/whatsapp"

/**
 * Floating "chat on WhatsApp" button, bottom-right on every storefront page.
 * Hidden during checkout so it doesn't sit over the Place order button.
 */
export default function WhatsAppButton() {
  const pathname = usePathname()
  if (pathname.startsWith("/checkout") || pathname.startsWith("/admin")) return null

  return (
    <a
      href={whatsappHref("Hello, I have a question about PIYUSH BHOLLA LABEL.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-black text-white shadow-lg transition-transform duration-200 hover:scale-105 focus-visible:ring-black sm:bottom-6 sm:right-6 sm:h-14 sm:w-14 print:hidden"
    >
      <WhatsAppIcon className="h-6 w-6" />
    </a>
  )
}
