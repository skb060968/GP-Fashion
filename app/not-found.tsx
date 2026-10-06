import type { Metadata } from "next"
import Link from "next/link"
import Image from "next/image"
import FadeIn from "@/components/FadeIn"

export const metadata: Metadata = {
  title: "Page not found | Piyush Bholla",
  robots: { index: false },
}

export default function NotFound() {
  return (
    <div className="bg-white text-black">
      <section className="flex min-h-[60vh] items-center pb-20 pt-12 sm:pb-24 sm:pt-16">
        <div className="container-max">
          <FadeIn className="mx-auto flex max-w-md flex-col items-center text-center">
            <Image src="/images/brand/logo-mark.png" alt="" width={213} height={320} className="h-16 w-auto opacity-80" />
            <p className="mt-8 font-jost text-xs font-semibold uppercase tracking-[0.25em] text-black/50">404</p>
            <h1 className="mt-3 font-cinzel text-2xl font-bold uppercase tracking-[0.15em] sm:text-3xl">Page not found</h1>
            <p className="mt-4 font-jost text-base leading-relaxed text-black/65 sm:text-lg">
              The page you are looking for has moved or never existed. The pieces, however, are all still here.
            </p>
            <div className="mt-10 flex flex-col items-center gap-3 sm:flex-row">
              <Link href="/shop" className="btn-solid-dark">Browse all pieces</Link>
              <Link href="/" className="btn-outline-dark">Home</Link>
            </div>
            <ul className="mt-10 flex flex-wrap justify-center gap-x-6 gap-y-2 font-jost text-sm text-black/60">
              <li><Link href="/menswear" className="hover:text-black">Menswear</Link></li>
              <li><Link href="/womenswear" className="hover:text-black">Womenswear</Link></li>
              <li><Link href="/collections" className="hover:text-black">Collections</Link></li>
              <li><Link href="/track-order" className="hover:text-black">Track order</Link></li>
              <li><Link href="/contact" className="hover:text-black">Contact</Link></li>
            </ul>
          </FadeIn>
        </div>
      </section>
    </div>
  )
}
