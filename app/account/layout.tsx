import type { Metadata } from "next"
import { redirect } from "next/navigation"
import { getCurrentUser } from "@/lib/security/userSession"
import AccountShell from "./AccountShell"

export const metadata: Metadata = {
  title: "My account | Piyush Bholla",
  robots: { index: false, follow: false },
}

export default async function AccountLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser()
  if (!user) redirect("/login?next=/account")
  return <AccountShell user={user}>{children}</AccountShell>
}
