import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { validateSession } from "@/lib/security/session";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session")?.value;

  if (!session) {
    redirect("/admin-login");
  }

  const isValid = await validateSession(session);

  if (!isValid) {
    redirect("/admin-login");
  }

  return <>{children}</>;
}
