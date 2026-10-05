import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createRateLimiter } from "@/lib/security/rateLimiter"
import { createUserSession, USER_COOKIE, userCookieOptions, verifyLoginCode } from "@/lib/security/userSession"

const limiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 20 })
const schema = z.object({ email: z.string().email().max(254), code: z.string().min(6).max(7) })

const MESSAGES = {
  invalid: "That code isn't right. Check the email and try again.",
  expired: "That code has expired. Request a new one.",
  too_many_attempts: "Too many attempts. Request a new code.",
}

/** POST /api/auth/verify-code { email, code } → sets session cookie. */
export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown"
  const rate = limiter.check(ip)
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many attempts. Please wait a few minutes." }, { status: 429 })
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: MESSAGES.invalid }, { status: 400 })

  try {
    const result = await verifyLoginCode(parsed.data.email, parsed.data.code)
    if (!result.ok) return NextResponse.json({ error: MESSAGES[result.reason], reason: result.reason }, { status: 401 })

    const { token, expiresAt } = await createUserSession(result.user.id)
    const res = NextResponse.json({ user: result.user })
    res.cookies.set(USER_COOKIE, token, userCookieOptions(expiresAt))
    return res
  } catch (err) {
    console.error("LOGIN_VERIFY_FAILED:", err)
    return NextResponse.json({ error: "Something went wrong. Please try again." }, { status: 500 })
  }
}
