import crypto from "crypto"
import { NextResponse, type NextRequest } from "next/server"
import { z } from "zod"
import { createRateLimiter } from "@/lib/security/rateLimiter"
import {
  ADMIN_OTP_TTL_MS,
  AdminChallengeActiveError,
  invalidateAdminLoginChallenge,
  issueAdminLoginChallenge,
} from "@/lib/security/adminLoginChallenge"
import { adminLoginCodeEmail } from "@/lib/emails/adminLoginCode"
import { requireSameOriginJson } from "@/lib/security/adminAuth"
import { sendMail } from "@/lib/mailer"

const loginRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 5 })
const schema = z.object({ email: z.string().email().max(254), password: z.string().min(1).max(256) })

function safeEqual(value: string, expected: string): boolean {
  const left = crypto.createHash("sha256").update(value).digest()
  const right = crypto.createHash("sha256").update(expected).digest()
  return crypto.timingSafeEqual(left, right)
}

function maskedEmail(email: string): string {
  const [local, domain] = email.split("@")
  if (!domain) return "your admin email"
  const visible = local.slice(0, 2)
  return `${visible}${"•".repeat(Math.max(3, local.length - visible.length))}@${domain}`
}

export async function POST(req: NextRequest) {
  const requestDenied = requireSameOriginJson(req)
  if (requestDenied) return requestDenied

  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || req.headers.get("x-real-ip") || "unknown"
  const rateResult = loginRateLimiter.check(clientIp)
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a few minutes and try again." },
      { status: 429, headers: { "Retry-After": String(rateResult.retryAfterSeconds) } }
    )
  }

  const parsed = schema.safeParse(await req.json().catch(() => ({})))
  const email = parsed.success ? parsed.data.email.trim().toLowerCase() : ""
  const password = parsed.success ? parsed.data.password : ""
  const expectedEmail = (process.env.ADMIN_EMAIL || "").trim().toLowerCase()
  const expectedPassword = process.env.ADMIN_PASSWORD || ""

  if (!expectedEmail || !expectedPassword || !safeEqual(email, expectedEmail) || !safeEqual(password, expectedPassword)) {
    return NextResponse.json({ error: "Unable to sign in with those credentials." }, { status: 401 })
  }

  let challengeId: string | null = null
  try {
    const issued = await issueAdminLoginChallenge()
    challengeId = issued.challengeId
    const message = adminLoginCodeEmail(issued.code, Math.round(ADMIN_OTP_TTL_MS / 60000), issued.challengeId)
    await sendMail({ to: expectedEmail, subject: message.subject, html: message.html })
    return NextResponse.json(
      { requiresOtp: true, challengeId, destination: maskedEmail(expectedEmail) },
      { headers: { "Cache-Control": "no-store" } }
    )
  } catch (error) {
    if (error instanceof AdminChallengeActiveError) {
      return NextResponse.json(
        { error: "A verification code was already sent. Use the Continue verification link in that email or wait five minutes before trying again." },
        { status: 429, headers: { "Cache-Control": "no-store" } }
      )
    }
    if (challengeId) {
      await invalidateAdminLoginChallenge(challengeId).catch(() => {})
      console.error("ADMIN_OTP_DELIVERY_FAILED")
    } else {
      console.error("ADMIN_OTP_CHALLENGE_FAILED")
    }
    return NextResponse.json({ error: "Unable to send the verification code. Please try again." }, { status: 500 })
  }
}
