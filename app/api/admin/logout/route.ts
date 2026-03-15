import { NextResponse, NextRequest } from "next/server";
import { headers, cookies } from "next/headers";
import crypto from "crypto";
import { deleteSession } from "@/lib/security/session";

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get("admin_session")?.value;

  if (token) {
    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");
    await deleteSession(hashedToken);
  }

  const headerList = await headers();
  const host = headerList.get("host") || "localhost:3000";

  const protocol = host.includes("localhost") ? "http" : "https";

  const redirectUrl = `${protocol}://${host}/admin-login`;

  const response = NextResponse.redirect(redirectUrl);

  response.cookies.set({
    name: "admin_session",
    value: "",
    path: "/",
    expires: new Date(0),
  });

  return response;
}
