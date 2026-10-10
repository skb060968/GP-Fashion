import { NextResponse, type NextRequest } from "next/server"
import { requireSameOriginJson } from "@/lib/security/adminAuth"
import { ADMIN_COOKIE, deleteSession, hashToken, sessionCookieOptions } from "@/lib/security/session"

export async function POST(req: NextRequest) {
  const requestDenied = requireSameOriginJson(req)
  if (requestDenied) return requestDenied

  const token = req.cookies.get(ADMIN_COOKIE)?.value
  if (token) await deleteSession(hashToken(token))

  const response = NextResponse.json({ success: true })
  response.cookies.set(ADMIN_COOKIE, "", sessionCookieOptions(new Date(0)))
  return response
}
