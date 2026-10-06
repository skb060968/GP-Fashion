// lib/whatsapp.ts
import { contact } from "@/lib/data/contact"

/** wa.me link that opens a chat with the studio, optionally pre-filled. */
export function whatsappHref(message?: string): string {
  const base = `https://wa.me/${contact.whatsapp}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}
