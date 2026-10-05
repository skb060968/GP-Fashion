"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { useUser } from "@/context/UserContext"
import PageHeading from "@/components/PageHeading"

const TABS = [
  { href: "/account", label: "Orders", match: (p: string) => p === "/account" },
  { href: "/account/addresses", label: "Addresses", match: (p: string) => p.startsWith("/account/addresses") },
  { href: "/account/profile", label: "Profile", match: (p: string) => p.startsWith("/account/profile") },
]

export default function AccountShell({
  user,
  children,
}: {
  user: { email: string; name: string | null }
  children: React.ReactNode
}) {
  const pathname = usePathname()
  const router = useRouter()
  const { signOut } = useUser()

  const firstName = user.name?.trim().split(/\s+/)[0]

  return (
    <div className="bg-white text-black">
      <section className="pb-24 pt-12 sm:pt-16 lg:pb-32 lg:pt-20">
        <div className="container-max">
          <PageHeading title={firstName ? `Hello, ${firstName}` : "My account"} meta={user.email} />

          <nav aria-label="Account" className="mx-auto mt-12 flex max-w-3xl items-center justify-center gap-1 border-b border-black/10 lg:mt-16">
            {TABS.map((t) => {
              const active = t.match(pathname)
              return (
                <Link
                  key={t.href}
                  href={t.href}
                  aria-current={active ? "page" : undefined}
                  className={`-mb-px border-b-2 px-4 py-3 font-jost text-sm font-semibold uppercase tracking-[0.15em] transition-colors ${
                    active ? "border-black text-black" : "border-transparent text-black/50 hover:text-black"
                  }`}
                >
                  {t.label}
                </Link>
              )
            })}
            <button
              type="button"
              onClick={async () => {
                await signOut()
                router.push("/")
                router.refresh()
              }}
              className="-mb-px ml-auto border-b-2 border-transparent px-4 py-3 font-jost text-sm text-black/50 transition-colors hover:text-black"
            >
              Sign out
            </button>
          </nav>

          <div className="mx-auto mt-10 max-w-3xl">{children}</div>
        </div>
      </section>
    </div>
  )
}
