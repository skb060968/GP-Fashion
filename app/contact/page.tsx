import type { Metadata } from "next"
import { Mail, Phone, MapPin, Clock } from "lucide-react"
import type { ComponentType, SVGProps } from "react"
import { content } from "@/lib/data"
import FadeIn from "@/components/FadeIn"
import WhatsAppIcon from "@/components/WhatsAppIcon"
import { whatsappHref } from "@/lib/whatsapp"

const SITE_URL = process.env.SITE_URL || "https://gpfashion.in"

const DESCRIPTION =
  "Contact the PIYUSH BHOLLA LABEL studio in Delhi about orders, sizing, fittings, bespoke commissions and collaborations."

export const metadata: Metadata = {
  title: "Contact | Piyush Bholla",
  description: DESCRIPTION,
  openGraph: {
    title: "Contact | Piyush Bholla",
    description: DESCRIPTION,
    url: `${SITE_URL}/contact`,
    images: [{ url: `${SITE_URL}/images/hero/poster.jpg` }],
  },
}

const INPUT_CLASS =
  "w-full rounded-lg border border-black/15 bg-white px-4 py-3 font-jost text-black placeholder:text-black/40 transition focus:border-black focus:outline-none focus:ring-1 focus:ring-black"

export default function ContactPage() {
  const { contact, faq } = content

  return (
    <div className="bg-white text-black">
      <section className="pb-20 pt-12 sm:pb-24 sm:pt-16 lg:pb-32 lg:pt-20">
        <div className="container-max">

          <FadeIn className="mx-auto max-w-3xl text-center">
            <h1 className="font-cinzel text-3xl font-bold uppercase tracking-[0.2em] sm:text-4xl lg:text-6xl lg:tracking-[0.25em]">
              {contact.heading}
            </h1>
            <span aria-hidden className="mx-auto mt-6 block h-px w-16 bg-black/30" />
            <p className="mt-6 font-jost text-base leading-relaxed text-black/70 sm:text-lg">
              {contact.description}
            </p>
          </FadeIn>

          <div className="mt-16 grid grid-cols-1 items-start gap-12 lg:mt-20 lg:grid-cols-2 lg:gap-16">

            <FadeIn className="space-y-10">
              <div>
                <h2 className="font-cinzel text-2xl font-bold uppercase tracking-[0.15em] sm:text-3xl">
                  {contact.subHeading}
                </h2>
                <p className="mt-4 font-jost text-base leading-relaxed text-black/75 sm:text-lg">
                  {contact.subDescription}
                </p>
              </div>

              <div className="space-y-6">
                <Info icon={Mail} label="Email" value={contact.email} href={`mailto:${contact.email}`} />
                <Info icon={Phone} label="Phone" value={contact.phone} href={`tel:${contact.phone}`} />
                <Info icon={WhatsAppIcon} label="WhatsApp" value="Chat with the studio" href={whatsappHref("Hello, I have a question about PIYUSH BHOLLA LABEL.")} external />
                <Info icon={MapPin} label="Location" value={contact.location} />
                <Info icon={Clock} label="Availability" value={contact.availability} />
              </div>
            </FadeIn>

            <FadeIn delay={120}>
              <div className="card-elevated p-8 lg:p-10">
                <h3 className="font-cinzel text-xl font-bold uppercase tracking-[0.15em] sm:text-2xl">
                  {contact.formHeading}
                </h3>

                <form
                  action="https://api.web3forms.com/submit"
                  method="POST"
                  className="mt-8 space-y-5"
                >
                  <input type="hidden" name="access_key" value={contact.web3formKey} />

                  <label className="block">
                    <span className="sr-only">Your name</span>
                    <input name="name" type="text" placeholder="Your Name" required className={INPUT_CLASS} />
                  </label>
                  <label className="block">
                    <span className="sr-only">Your email</span>
                    <input name="email" type="email" placeholder="Your Email" required className={INPUT_CLASS} />
                  </label>
                  <label className="block">
                    <span className="sr-only">Your message</span>
                    <textarea name="message" rows={5} placeholder="Your Message" required className={INPUT_CLASS} />
                  </label>

                  <button type="submit" className="btn-solid-dark w-full">
                    Send Message
                  </button>
                </form>
              </div>
            </FadeIn>
          </div>
        </div>
      </section>

      <section>
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="section-divider" />
        </div>

        <div className="container-max section-padding">
          <FadeIn className="text-center">
            <h2 className="font-cinzel text-2xl font-bold uppercase tracking-[0.2em] sm:text-3xl lg:text-4xl lg:tracking-[0.25em]">
              Frequently Asked Questions
            </h2>
            <span aria-hidden className="mx-auto mt-6 block h-px w-16 bg-black/30" />
          </FadeIn>

          <div className="mx-auto mt-14 grid max-w-4xl grid-cols-1 gap-6 md:grid-cols-2 lg:mt-16 lg:gap-8">
            {faq.map((item, index) => (
              <FadeIn key={item.question} delay={(index % 2) * 100} className="h-full">
                <div className="card-elevated flex h-full flex-col p-8">
                  <h3 className="font-jost text-base font-semibold sm:text-lg">
                    {item.question}
                  </h3>
                  <p className="mt-3 font-jost text-sm leading-relaxed text-black/70 sm:text-base">
                    {item.answer}
                  </p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>
    </div>
  )
}

function Info({
  icon: Icon,
  label,
  value,
  href,
  external,
}: {
  icon: ComponentType<SVGProps<SVGSVGElement> & { strokeWidth?: number }>
  label: string
  value: string
  href?: string
  external?: boolean
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-black">
        <Icon className="h-4 w-4 text-white" strokeWidth={1.5} aria-hidden />
      </div>
      <div className="font-jost">
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">{label}</p>
        {href ? (
          <a
            href={href}
            {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
            className="mt-1 block text-black transition-colors hover:text-black/60"
          >
            {value}
          </a>
        ) : (
          <p className="mt-1 text-black/80">{value}</p>
        )}
      </div>
    </div>
  )
}
