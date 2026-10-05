import { NextRequest, NextResponse } from "next/server"
import { deleteUserSession, USER_COOKIE, userCookieOptions } from "@/lib/security/userSession"

export async function POST(req: NextRequest) {
  await deleteUserSession(req.cookies.get(USER_COOKIE)?.value)
  const res = NextResponse.json({ success: true })
  res.cookies.set(USER_COOKIE, "", userCookieOptions(new Date(0)))
  return res
}
