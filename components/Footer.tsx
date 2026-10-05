import Link from "next/link"
import Image from "next/image"
import { Instagram, Mail, Phone } from "lucide-react"
import { content } from "@/lib/data"
import AnchorLink from "@/components/AnchorLink"

export default function Footer() {
  const { footer, contact } = content
  const year = new Date().getFullYear()

  return (
    <footer className="border-t border-black/10 bg-white text-black">
      <div className="container-max py-16 sm:py-20">
        <div className="grid grid-cols-1 gap-12 md:grid-cols-4 md:gap-10">
          {/* Brand: logo + wordmark stacked, as in the navbar */}
          <div className="flex flex-col items-center md:col-span-2 md:items-start">
           {/* Shrink-to-fit column so the icon row centres under the wordmark
               regardless of whether the block is left- or centre-aligned. */}
           <div className="inline-flex flex-col items-center">
            <Link
              href="/"
              aria-label="Piyush Bholla, home"
              className="group flex flex-col items-center rounded focus-visible:ring-black"
            >
              <Image
                src="/images/brand/logo-mark.png"
                alt=""
                width={213}
                height={320}
                className="h-16 w-auto transition-transform duration-300 ease-out group-hover:scale-105 sm:h-20"
              />
              <span className="mt-2 whitespace-nowrap font-cinzel text-lg font-bold uppercase tracking-[0.25em] sm:text-xl">
                Piyush Bholla
              </span>
            </Link>

            <div className="mt-6 flex items-center gap-5 text-black/70">
              <a
                href={contact.instagram}
                target="_blank"
                rel="noopener noreferrer"
                aria-label="Instagram"
                className="transition-colors hover:text-black focus-visible:ring-black"
              >
                <Instagram size={22} strokeWidth={1.5} />
              </a>
              <a
                href={`mailto:${contact.email}`}
                aria-label="Email"
                className="transition-colors hover:text-black focus-visible:ring-black"
              >
                <Mail size={22} strokeWidth={1.5} />
              </a>
              <a
                href={`tel:${contact.phone}`}
                aria-label="Phone"
                className="transition-colors hover:text-black focus-visible:ring-black"
              >
                <Phone size={22} strokeWidth={1.5} />
              </a>
            </div>
           </div>
          </div>

          {/* Quick Links */}
          <div className="text-center md:text-left">
            <h3 className="font-jost text-xs font-semibold uppercase tracking-[0.25em] text-black/50">
              {footer.quickLinksHeading}
            </h3>
            <ul className="mt-5 space-y-3 font-jost text-sm text-black/75 sm:text-base">
              {footer.quickLinks.map((link) => (
                <li key={link.href}>
                  <AnchorLink href={link.href} className="transition-colors hover:text-black">
                    {link.label}
                  </AnchorLink>
                </li>
              ))}
            </ul>
          </div>

          {/* Services */}
          <div className="text-center md:text-left">
            <h3 className="font-jost text-xs font-semibold uppercase tracking-[0.25em] text-black/50">
              {footer.servicesHeading}
            </h3>
            <ul className="mt-5 space-y-3 font-jost text-sm text-black/75 sm:text-base">
              {footer.servicesList.map((service) => (
                <li key={service.href}>
                  <Link href={service.href} className="transition-colors hover:text-black">
                    {service.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-14 border-t border-black/10 pt-6 text-center font-jost text-xs tracking-wide text-black/50 sm:text-sm">
          © {year} Piyush Bholla. All rights reserved.
        </div>
      </div>
    </footer>
  )
}
