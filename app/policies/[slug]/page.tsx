import type { Metadata } from "next"
import Link from "next/link"
import { notFound } from "next/navigation"
import PageHeading from "@/components/PageHeading"
import FadeIn from "@/components/FadeIn"
import { getPolicy, policies } from "@/lib/data/policies"

const SITE_URL = process.env.SITE_URL || "https://gpfashion.in"

type Props = { params: Promise<{ slug: string }> }

export function generateStaticParams() {
  return policies.map((p) => ({ slug: p.slug }))
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const policy = getPolicy(slug)
  if (!policy) return {}
  const title = `${policy.title} | Piyush Bholla`
  return {
    title,
    description: policy.description,
    openGraph: { title, description: policy.description, url: `${SITE_URL}/policies/${policy.slug}` },
  }
}

const formatUpdated = (iso: string) =>
  new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-IN", { day: "numeric", month: "long", year: "numeric", timeZone: "UTC" })

export default async function PolicyPage({ params }: Props) {
  const { slug } = await params
  const policy = getPolicy(slug)
  if (!policy) notFound()

  const others = policies.filter((p) => p.slug !== policy.slug)

  return (
    <div className="bg-white text-black">
      <section className="pb-20 pt-12 sm:pb-24 sm:pt-16 lg:pb-32 lg:pt-20">
        <div className="container-max">
          <PageHeading title={policy.title} meta={`Last updated ${formatUpdated(policy.updated)}`} />

          <FadeIn className="mx-auto mt-14 max-w-3xl lg:mt-16">
            <div className="space-y-10">
              {policy.sections.map((s) => (
                <section key={s.heading}>
                  <h2 className="font-cinzel text-base font-bold uppercase tracking-[0.04em] sm:text-lg">{s.heading}</h2>
                  <div className="mt-4 space-y-4 font-jost text-base leading-relaxed text-black/75">
                    {s.paragraphs.map((p) => (
                      <p key={p}>{p}</p>
                    ))}
                    {s.bullets && (
                      <ul className="space-y-2.5">
                        {s.bullets.map((b) => (
                          <li key={b} className="flex gap-3">
                            <span aria-hidden className="mt-[0.7em] h-1.5 w-1.5 shrink-0 rounded-full bg-black" />
                            {b}
                          </li>
                        ))}
                      </ul>
                    )}
                  </div>
                </section>
              ))}
            </div>

            <nav aria-label="Other policies" className="mt-16 border-t border-black/10 pt-8 font-jost text-sm">
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-black/50">Also see</p>
              <ul className="mt-3 flex flex-wrap gap-x-8 gap-y-2">
                {others.map((p) => (
                  <li key={p.slug}>
                    <Link href={`/policies/${p.slug}`} className="underline underline-offset-4 hover:text-black/60">
                      {p.title}
                    </Link>
                  </li>
                ))}
                <li>
                  <Link href="/contact" className="underline underline-offset-4 hover:text-black/60">
                    Contact us
                  </Link>
                </li>
              </ul>
            </nav>
          </FadeIn>
        </div>
      </section>
    </div>
  )
}
