import type { Metadata } from "next"
import { Mail, Phone, MapPin, Clock } from "lucide-react"
import { content } from "@/lib/data"
import RevealWrapper from "@/components/RevealWrapper"

const SITE_URL = process.env.SITE_URL || "https://gpfashion.in"

export const metadata: Metadata = {
  title: "Contact | GP Fashion",
  description:
    "Get in touch with GP Fashion for custom designs, collaborations, or inquiries.",
  openGraph: {
    title: "Contact | GP Fashion",
    description:
      "Get in touch with GP Fashion for custom designs, collaborations, or inquiries.",
    url: `${SITE_URL}/contact`,
    images: [{ url: `${SITE_URL}/images/hero/poster.jpg` }],
  },
}

export default function ContactPage() {
  const { contact, faq } = content

  return (
    <section className="section-padding bg-white">
      <div className="container-max space-y-20">

        {/* ================= HEADER ================= */}
        <div className="text-center max-w-3xl mx-auto">
          <h1 className="font-serif text-4xl lg:text-6xl font-bold text-fashion-black mb-6">
            {contact.heading}
          </h1>
          <p className="text-gray-800 text-lg leading-relaxed">
            {contact.description}
          </p>
          <div className="w-24 h-1 bg-fashion-gold mx-auto mt-8" />
        </div>

        {/* ================= CONTENT ================= */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-14 items-start">

          {/* LEFT INFO */}
          <div className="space-y-10">
            <div>
              <h2 className="font-serif text-3xl font-bold text-fashion-black mb-4">
                {contact.subHeading}
              </h2>
              <p className="text-gray-800 leading-relaxed">
                {contact.subDescription}
              </p>
            </div>

            <div className="space-y-5">
              <Info icon={Mail} label="Email" value={contact.email} />
              <Info icon={Phone} label="Phone" value={contact.phone} />
              <Info icon={MapPin} label="Location" value={contact.location} />
              <Info icon={Clock} label="Availability" value={contact.availability} />
            </div>
          </div>

          {/* RIGHT FORM */}
          <div className="bg-white rounded-2xl p-8 lg:p-10 shadow-md border border-amber-100">
            <h3 className="font-serif text-2xl font-semibold text-fashion-black mb-6">
              {contact.formHeading}
            </h3>

            <form
              action="https://api.web3forms.com/submit"
              method="POST"
              className="space-y-5"
            >
              <input type="hidden" name="access_key" value={contact.web3formKey} />

              <Input name="name" placeholder="Your Name" />
              <Input name="email" type="email" placeholder="Your Email" />

              <textarea
                name="message"
                rows={5}
                placeholder="Your Message"
                required
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-800
                  focus:outline-none focus:ring-2 focus:ring-fashion-gold focus:border-transparent
                  transition"
              />

              <button
                type="submit"
                className="btn-primary w-full"
              >
                Send Message
              </button>
            </form>
          </div>
        </div>

        {/* ================= FAQ ================= */}
        <div className="max-w-4xl mx-auto">
          <h2 className="font-serif text-3xl lg:text-4xl font-bold text-center mb-12">
            Frequently Asked Questions
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-stretch">
            {faq.map((item, index) => (
              <RevealWrapper key={index} index={index}>
                <div
                  className="flex flex-col h-full min-h-[220px]
                    card-base bg-stone-100 p-8 space-y-4
                    hover:bg-stone-200"
                >
                  <h3 className="font-semibold text-fashion-black">
                    {item.question}
                  </h3>
                  <p className="text-gray-800 leading-relaxed">
                    {item.answer}
                  </p>
                </div>
              </RevealWrapper>
            ))}
          </div>
        </div>

      </div>
    </section>
  )
}

/* ================= INPUT ================= */
function Input({
  name,
  placeholder,
  type = "text",
}: {
  name: string
  placeholder: string
  type?: string
}) {
  return (
    <input
      type={type}
      name={name}
      placeholder={placeholder}
      required
      className="w-full rounded-lg border border-gray-300 px-4 py-3 text-gray-800
        focus:outline-none focus:ring-2 focus:ring-fashion-gold focus:border-transparent
        transition"
    />
  )
}

/* ================= INFO ITEM ================= */
function Info({
  icon: Icon,
  label,
  value,
}: {
  icon: any
  label: string
  value: string
}) {
  return (
    <div className="flex items-start gap-4">
      <Icon className="w-6 h-6 text-fashion-gold mt-1" />
      <div>
        <p className="font-semibold text-fashion-black">{label}</p>
        <p className="text-gray-800">{value}</p>
      </div>
    </div>
  )
}