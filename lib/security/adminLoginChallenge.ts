import crypto from "crypto"
import { prisma } from "@/lib/prisma"
import { newSessionMaterial } from "@/lib/security/session"

export const ADMIN_OTP_TTL_MS = 5 * 60 * 1000
export const ADMIN_OTP_MAX_ATTEMPTS = 5

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

function hashCode(challengeId: string, code: string): string {
  return crypto
    .createHmac("sha256", secret())
    .update(`admin-login-otp\0${challengeId}\0${code}`)
    .digest("hex")
}

export async function issueAdminLoginChallenge(now = new Date()) {
  const challengeId = crypto.randomBytes(32).toString("hex")
  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0")
  const expiresAt = new Date(now.getTime() + ADMIN_OTP_TTL_MS)
  const data = {
    challengeId,
    codeHash: hashCode(challengeId, code),
    expiresAt,
    attempts: 0,
    consumedAt: null,
    createdAt: now,
  }

  await prisma.$transaction(async (tx) => {
    await tx.$queryRaw`SELECT pg_advisory_xact_lock(${CHALLENGE_LOCK_ID}) IS NULL AS locked`
    const existing = await tx.adminLoginChallenge.findUnique({ where: { key: CHALLENGE_KEY } })
    if (existing && !existing.consumedAt && existing.expiresAt > now) {
      throw new AdminChallengeActiveError()
    }

    if (existing) await tx.adminLoginChallenge.delete({ where: { key: CHALLENGE_KEY } })
    await tx.adminLoginChallenge.create({ data: { key: CHALLENGE_KEY, ...data } })
  })

  return { challengeId, code, expiresAt }
}

export async function invalidateAdminLoginChallenge(challengeId: string): Promise<void> {
  await prisma.adminLoginChallenge.deleteMany({ where: { key: CHALLENGE_KEY, challengeId } })
}

export async function consumeAdminLoginChallenge(challengeId: string, codeRaw: string, now = new Date()) {
  const code = codeRaw.trim()
  if (!/^[a-f0-9]{64}$/.test(challengeId) || !/^\d{6}$/.test(code)) return { ok: false as const }

  const codeHash = hashCode(challengeId, code)
  const session = newSessionMaterial(now)

  return prisma.$transaction(async (tx) => {
    const consumed = await tx.adminLoginChallenge.updateMany({
      where: {
        key: CHALLENGE_KEY,
        challengeId,
        codeHash,
        consumedAt: null,
        expiresAt: { gt: now },
        attempts: { lt: ADMIN_OTP_MAX_ATTEMPTS },
      },
      data: { consumedAt: now },
    })

    if (consumed.count !== 1) {
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
    await tx.adminSession.create({
      data: { tokenHash: session.hashedToken, expiresAt: session.expiresAt },
    })

    return { ok: true as const, token: session.token, expiresAt: session.expiresAt }
  })
}
