"use client"

import { usePathname } from "next/navigation"
import WhatsAppIcon from "@/components/WhatsAppIcon"
import { whatsappHref } from "@/lib/whatsapp"

export default function WhatsAppButton() {
  const pathname = usePathname()
  if (pathname.startsWith("/checkout") || pathname.startsWith("/admin")) return null

  return (
    <a
      href={whatsappHref("Hello, I have a question about PIYUSH BHOLLA LABEL.")}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-40 flex h-12 w-12 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-[transform,bottom] duration-200 hover:scale-105 focus-visible:ring-[#25D366] sm:bottom-6 sm:right-6 sm:h-14 sm:w-14 print:hidden [html[data-buybar='1']_&]:bottom-[calc(5.5rem+env(safe-area-inset-bottom))]"
    >
      <WhatsAppIcon className="h-6 w-6" />
    </a>
  )
}
