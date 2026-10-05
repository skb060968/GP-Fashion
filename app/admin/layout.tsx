import type { Metadata } from "next"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"
import { ADMIN_COOKIE, validateSession } from "@/lib/security/session"
import AdminShell from "@/components/admin/AdminShell"

export const metadata: Metadata = {
  title: "Admin | Piyush Bholla",
  robots: { index: false, follow: false },
}

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const token = (await cookies()).get(ADMIN_COOKIE)?.value
  if (!token || !(await validateSession(token))) {
    redirect("/admin-login")
  }
  return <AdminShell>{children}</AdminShell>
}
