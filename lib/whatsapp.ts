
import { contact } from "@/lib/data/contact"

export function whatsappHref(message?: string): string {
  const base = `https://wa.me/${contact.whatsapp}`
  return message ? `${base}?text=${encodeURIComponent(message)}` : base
}
