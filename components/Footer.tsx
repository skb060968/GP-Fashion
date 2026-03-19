import Link from 'next/link'
import Image from 'next/image'
import { Instagram, Mail, Phone } from 'lucide-react'
import { content } from '@/lib/data'

export default function Footer() {
  const { footer, siteInfo, contact } = content

  return (
    <footer className="bg-stone-100 border-t border-gray-200">
      <div className="container-max py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10">
          {/* Brand */}
          <div className="md:col-span-2">
            <Link href="/" className="flex items-center gap-2 group mb-4">
             <Image
  src="/payments/logo.png"
  alt="GP Fashion logo"
  width={60}
  height={60}
  className="object-contain transition-transform duration-300 ease-in-out group-hover:scale-105"
   
/>
              <span className="font-serif text-2xl font-bold tracking-tight text-fashion-black">
                {siteInfo.siteName}
              </span>
            </Link>

            <p className="text-gray-600 max-w-md mb-6">
              {footer.brandDescription}
            </p>

            <div className="flex items-center gap-4 text-gray-600">
              <a
                href="https://instagram.com"
                aria-label="Instagram"
                className="hover:text-black transition-colors"
              >
                <Instagram size={22} />
              </a>

              <a
                href={`mailto:${contact.email}`}
                aria-label="Email"
                className="hover:text-black transition-colors"
              >
                <Mail size={22} />
              </a>

              <a
                href={`tel:${contact.phone}`}
                aria-label="Phone"
                className="hover:text-black transition-colors"
              >
                <Phone size={22} />
              </a>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-serif text-lg font-semibold mb-4">
              {footer.quickLinksHeading}
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><Link href="/collections" className="hover:text-black">Collections</Link></li>
              <li><Link href="/about" className="hover:text-black">About</Link></li>
              <li><Link href="/services" className="hover:text-black">Services</Link></li>
              <li><Link href="/journal" className="hover:text-black">Journal</Link></li>
              <li><Link href="/contact" className="hover:text-black">Contact</Link></li>
            </ul>
          </div>

          {/* Services */}
          <div>
            <h3 className="font-serif text-lg font-semibold mb-4">
              {footer.servicesHeading}
            </h3>
            <ul className="space-y-2 text-sm text-gray-600">
              {footer.servicesList.map((service, index) => (
                <li key={index}>
                  <Link href={service.href} className="hover:text-black">
                    {service.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-10 pt-6 border-t border-gray-200 text-center text-sm text-gray-600">
          © {siteInfo.copyright}
        </div>
      </div>
    </footer>
  )
}