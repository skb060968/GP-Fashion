import { NextRequest, NextResponse } from "next/server"
import { z } from "zod"
import { createRateLimiter } from "@/lib/security/rateLimiter"
import { issueLoginCode, LOGIN_CODE_TTL_MS, normaliseEmail } from "@/lib/security/userSession"
import { sendMail } from "@/lib/mailer"
import { loginCodeEmail } from "@/lib/emails/loginCode"

const limiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 10 })
const schema = z.object({ email: z.string().email().max(254) })

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown"
  const rate = limiter.check(ip)
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait a few minutes." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    )
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  if (!parsed.success) {
    return NextResponse.json({ error: "Enter a valid email address." }, { status: 400 })
  }
  const email = normaliseEmail(parsed.data.email)

  try {
    const issued = await issueLoginCode(email)
    if (issued) {
      const { subject, html } = loginCodeEmail(issued.code, Math.round(LOGIN_CODE_TTL_MS / 60000))
      await sendMail({ to: email, subject, html })
    }

    return NextResponse.json({ sent: true })
  } catch (err) {
    console.error("LOGIN_CODE_SEND_FAILED:", err)
    return NextResponse.json({ error: "We couldn't send the code. Please try again." }, { status: 500 })
  }
}
