import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { createRateLimiter } from "@/lib/security/rateLimiter"
import { requireSameOriginJson } from "@/lib/security/adminAuth"
import {
  ADMIN_LOGIN_CONTEXT_COOKIE,
  adminLoginContextCookieOptions,
  consumeAdminLoginMagicLink,
  isValidAdminLoginContext,
} from "@/lib/security/adminLoginChallenge"
import { ADMIN_COOKIE, sessionCookieOptions } from "@/lib/security/session"

const limiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 20 })
const schema = z.object({
  challengeId: z.string().regex(/^[a-f0-9]{64}$/),
  token: z.string().regex(/^[A-Za-z0-9_-]{43}$/),
})

function rejected(status = 401) {
  return NextResponse.json(
    { error: "This verification link could not be used. Enter the six-digit code instead." },
    { status, headers: { "Cache-Control": "no-store" } }
  )
}

export async function POST(req: NextRequest) {
  const requestDenied = requireSameOriginJson(req)
  if (requestDenied) return requestDenied

  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown"
  const rate = limiter.check(clientIp)
  if (!rate.allowed) return rejected(429)

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return rejected()

  const contextToken = req.cookies.get(ADMIN_LOGIN_CONTEXT_COOKIE)?.value
  if (!isValidAdminLoginContext(parsed.data.challengeId, contextToken)) return rejected()

  try {
    const result = await consumeAdminLoginMagicLink(parsed.data.challengeId, parsed.data.token)
    if (!result.ok) return rejected()

    const response = NextResponse.json({ success: true }, { headers: { "Cache-Control": "no-store" } })
    response.cookies.set(ADMIN_COOKIE, result.token, sessionCookieOptions(result.expiresAt))
    response.cookies.set(ADMIN_LOGIN_CONTEXT_COOKIE, "", adminLoginContextCookieOptions(new Date(0)))
    return response
  } catch {
    console.error("ADMIN_MAGIC_LINK_VERIFY_FAILED")
    return rejected(500)
  }
}
