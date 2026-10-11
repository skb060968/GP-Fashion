import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { newSessionMaterial } from "@/lib/security/session"

export const ADMIN_OTP_TTL_MS = 5 * 60 * 1000
export const ADMIN_OTP_MAX_ATTEMPTS = 5
export const ADMIN_LOGIN_CONTEXT_COOKIE = "admin_login_context"

const CHALLENGE_KEY = "admin"
const CHALLENGE_LOCK_ID = 731_904_221

export class AdminChallengeActiveError extends Error {
  constructor() {
    super("An admin verification challenge is already active")
  }
}

function secret(): string {
  const value = process.env.ADMIN_OTP_SECRET || ""
  if (value.length < 32) throw new Error("ADMIN_OTP_SECRET must be at least 32 characters")
  return value
}

function hashCredential(domain: "otp" | "link" | "context", challengeId: string, value: string): string {
  return crypto
    .createHmac("sha256", secret())
    .update(`admin-login-${domain}\0${challengeId}\0${value}`)
    .digest("hex")
}

function hashCode(challengeId: string, code: string): string {
  return hashCredential("otp", challengeId, code)
}

function hashMagicToken(challengeId: string, token: string): string {
  return hashCredential("link", challengeId, token)
}

export function adminLoginContextToken(challengeId: string): string {
  return hashCredential("context", challengeId, "browser")
}

export function isValidAdminLoginContext(challengeId: string, token: string | undefined): boolean {
  if (!/^[a-f0-9]{64}$/.test(challengeId) || !token || !/^[a-f0-9]{64}$/.test(token)) return false
  const expected = Buffer.from(adminLoginContextToken(challengeId))
  const actual = Buffer.from(token)
  return crypto.timingSafeEqual(expected, actual)
}

export function adminLoginContextCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/api/admin",
    expires: expiresAt,
    maxAge: Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000)),
  }
}

export async function issueAdminLoginChallenge(now = new Date()) {
  const challengeId = crypto.randomBytes(32).toString("hex")
  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0")
  const magicToken = crypto.randomBytes(32).toString("base64url")
  const expiresAt = new Date(now.getTime() + ADMIN_OTP_TTL_MS)
  const data = {
    challengeId,
    codeHash: hashCode(challengeId, code),
    magicTokenHash: hashMagicToken(challengeId, magicToken),
    expiresAt,
    attempts: 0,
    consumedAt: null,
    createdAt: now,
  }

  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(${CHALLENGE_LOCK_ID}) IS NULL AS locked`
    const existing = await tx.adminLoginChallenge.findUnique({ where: { key: CHALLENGE_KEY } })
    if (existing && !existing.consumedAt && existing.expiresAt > now) throw new AdminChallengeActiveError()

    if (existing) await tx.adminLoginChallenge.delete({ where: { key: CHALLENGE_KEY } })
    await tx.adminLoginChallenge.create({ data: { key: CHALLENGE_KEY, ...data } })
  })

  return { challengeId, code, magicToken, expiresAt }
}

export async function invalidateAdminLoginChallenge(challengeId: string): Promise<void> {
  await prisma.adminLoginChallenge.deleteMany({ where: { key: CHALLENGE_KEY, challengeId } })
}

type CredentialHash = { codeHash: string } | { magicTokenHash: string }

async function consumeChallenge(challengeId: string, credential: CredentialHash, incrementOtpAttempt: boolean, now: Date) {
  const session = newSessionMaterial(now)

  return prisma.$transaction(async (tx) => {
    const consumed = await tx.adminLoginChallenge.updateMany({
      where: {
        key: CHALLENGE_KEY,
        challengeId,
        ...credential,
        consumedAt: null,
        expiresAt: { gt: now },
        attempts: { lt: ADMIN_OTP_MAX_ATTEMPTS },
      },
      data: { consumedAt: now },
    })

    if (consumed.count !== 1) {
      if (incrementOtpAttempt) {
        await tx.adminLoginChallenge.updateMany({
          where: {
            key: CHALLENGE_KEY,
            challengeId,
            consumedAt: null,
            expiresAt: { gt: now },
            attempts: { lt: ADMIN_OTP_MAX_ATTEMPTS },
          },
          data: { attempts: { increment: 1 } },
        })
      }
      return { ok: false as const }
    }

    await tx.adminSession.deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: now } },
          { createdAt: { lt: new Date(now.getTime() - 8 * 60 * 60 * 1000) } },
        ],
      },
    })
    await tx.adminSession.create({ data: { tokenHash: session.hashedToken, expiresAt: session.expiresAt } })

    return { ok: true as const, token: session.token, expiresAt: session.expiresAt }
  })
}

export function consumeAdminLoginChallenge(challengeId: string, codeRaw: string, now = new Date()) {
  const code = codeRaw.trim()
  if (!/^[a-f0-9]{64}$/.test(challengeId) || !/^\d{6}$/.test(code)) return Promise.resolve({ ok: false as const })
  return consumeChallenge(challengeId, { codeHash: hashCode(challengeId, code) }, true, now)
}

export function consumeAdminLoginMagicLink(challengeId: string, magicToken: string, now = new Date()) {
  if (!/^[a-f0-9]{64}$/.test(challengeId) || !/^[A-Za-z0-9_-]{43}$/.test(magicToken)) return Promise.resolve({ ok: false as const })
  return consumeChallenge(challengeId, { magicTokenHash: hashMagicToken(challengeId, magicToken) }, false, now)
}
