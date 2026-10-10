import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { createRateLimiter } from "@/lib/security/rateLimiter"
import { consumeAdminLoginChallenge } from "@/lib/security/adminLoginChallenge"
import { requireSameOriginJson } from "@/lib/security/adminAuth"
import { ADMIN_COOKIE, sessionCookieOptions } from "@/lib/security/session"

const limiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 20 })
const schema = z.object({
  challengeId: z.string().regex(/^[a-f0-9]{64}$/),
  code: z.string().regex(/^\d{6}$/),
})

export async function POST(req: NextRequest) {
  const requestDenied = requireSameOriginJson(req)
  if (requestDenied) return requestDenied

  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown"
  const rate = limiter.check(clientIp)
  if (!rate.allowed) {
    return NextResponse.json({ error: "Too many attempts. Please wait a few minutes." }, { status: 429 })
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) return NextResponse.json({ error: "Unable to verify the code." }, { status: 401 })

  try {
    const result = await consumeAdminLoginChallenge(parsed.data.challengeId, parsed.data.code)
    if (!result.ok) return NextResponse.json({ error: "Unable to verify the code." }, { status: 401 })

    const response = NextResponse.json({ success: true })
    response.cookies.set(ADMIN_COOKIE, result.token, sessionCookieOptions(result.expiresAt))
    return response
  } catch {
    console.error("ADMIN_OTP_VERIFY_FAILED")
    return NextResponse.json({ error: "Unable to verify the code." }, { status: 500 })
  }
}
