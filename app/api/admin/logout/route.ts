import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, deleteSession, hashToken, sessionCookieOptions } from "@/lib/security/session";

export async function POST(req: NextRequest) {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (token) await deleteSession(hashToken(token));

  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_COOKIE, "", sessionCookieOptions(new Date(0)));
  return res;
}
