// lib/security/userSession.ts
// Customer sessions: opaque token in an httpOnly cookie, sha256 hash in the DB.

import crypto from "crypto"
import type { NextRequest } from "next/server"
import { cookies } from "next/headers"
import { prisma } from "@/lib/prisma"
import { hashToken } from "./session"

export const USER_COOKIE = "pb_session"
export const USER_SESSION_MS = 30 * 24 * 60 * 60 * 1000 // 30 days, sliding
const RENEW_AFTER_MS = 24 * 60 * 60 * 1000 // extend at most once a day

export type SessionUser = {
  id: string
  email: string
  name: string | null
  phone: string | null
}

export async function createUserSession(userId: string) {
  const token = crypto.randomBytes(32).toString("hex")
  const expiresAt = new Date(Date.now() + USER_SESSION_MS)
  await prisma.userSession.create({ data: { tokenHash: hashToken(token), expiresAt, userId } })
  prisma.userSession.deleteMany({ where: { expiresAt: { lt: new Date() } } }).catch(() => {})
  return { token, expiresAt }
}

/** Resolves the user for a raw cookie token, renewing the session if due. */
export async function userFromToken(token: string | undefined): Promise<SessionUser | null> {
  if (!token || token.length !== 64) return null
  const tokenHash = hashToken(token)
  const session = await prisma.userSession.findUnique({
    where: { tokenHash },
    include: { user: { select: { id: true, email: true, name: true, phone: true } } },
  })
  if (!session) return null

  const now = Date.now()
  if (session.expiresAt.getTime() < now) {
    await prisma.userSession.delete({ where: { tokenHash } }).catch(() => {})
    return null
  }
  if (USER_SESSION_MS - (session.expiresAt.getTime() - now) > RENEW_AFTER_MS) {
    prisma.userSession
      .update({ where: { tokenHash }, data: { expiresAt: new Date(now + USER_SESSION_MS) } })
      .catch(() => {})
  }
  return session.user
}

/** For route handlers. */
export function getUserFromRequest(req: NextRequest) {
  return userFromToken(req.cookies.get(USER_COOKIE)?.value)
}

/** For server components / layouts. */
export async function getCurrentUser() {
  const store = await cookies()
  return userFromToken(store.get(USER_COOKIE)?.value)
}

export async function deleteUserSession(token: string | undefined) {
  if (!token) return
  await prisma.userSession.delete({ where: { tokenHash: hashToken(token) } }).catch(() => {})
}

export function userCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const, // lax so links from the confirmation email open signed in
    path: "/",
    expires: expiresAt,
  }
}

/* ------------------------------ login codes ------------------------------ */

export const LOGIN_CODE_TTL_MS = 10 * 60 * 1000
export const LOGIN_CODE_MAX_ATTEMPTS = 5
const CODES_PER_EMAIL_PER_15M = 5

export const normaliseEmail = (e: string) => e.trim().toLowerCase()

function codeHash(email: string, code: string) {
  return crypto.createHash("sha256").update(`${email}:${code}`).digest("hex")
}

/**
 * Issues a fresh 6-digit code for the email, invalidating earlier unused ones.
 * Returns null when the per-email rate limit is hit.
 */
export async function issueLoginCode(emailRaw: string): Promise<{ code: string; expiresAt: Date } | null> {
  const email = normaliseEmail(emailRaw)
  const since = new Date(Date.now() - 15 * 60 * 1000)
  const recent = await prisma.loginCode.count({ where: { email, createdAt: { gte: since } } })
  if (recent >= CODES_PER_EMAIL_PER_15M) return null

  const code = crypto.randomInt(0, 1_000_000).toString().padStart(6, "0")
  const expiresAt = new Date(Date.now() + LOGIN_CODE_TTL_MS)

  await prisma.$transaction([
    prisma.loginCode.updateMany({ where: { email, consumedAt: null }, data: { consumedAt: new Date() } }),
    prisma.loginCode.create({ data: { email, codeHash: codeHash(email, code), expiresAt } }),
  ])
  prisma.loginCode.deleteMany({ where: { createdAt: { lt: new Date(Date.now() - 24 * 60 * 60 * 1000) } } }).catch(() => {})

  return { code, expiresAt }
}

export type VerifyResult =
  | { ok: true; user: SessionUser }
  | { ok: false; reason: "invalid" | "expired" | "too_many_attempts" }

/** Checks a code; on success creates the user if needed and returns them. */
export async function verifyLoginCode(emailRaw: string, codeRaw: string): Promise<VerifyResult> {
  const email = normaliseEmail(emailRaw)
  const code = codeRaw.replace(/\D/g, "")

  const record = await prisma.loginCode.findFirst({
    where: { email, consumedAt: null },
    orderBy: { createdAt: "desc" },
  })
  if (!record) return { ok: false, reason: "invalid" }
  if (record.expiresAt.getTime() < Date.now()) return { ok: false, reason: "expired" }
  if (record.attempts >= LOGIN_CODE_MAX_ATTEMPTS) return { ok: false, reason: "too_many_attempts" }

  const expected = Buffer.from(record.codeHash)
  const actual = Buffer.from(codeHash(email, code))
  const matches = expected.length === actual.length && crypto.timingSafeEqual(expected, actual)

  if (!matches) {
    const updated = await prisma.loginCode.update({ where: { id: record.id }, data: { attempts: { increment: 1 } } })
    return { ok: false, reason: updated.attempts >= LOGIN_CODE_MAX_ATTEMPTS ? "too_many_attempts" : "invalid" }
  }

  const [, user] = await prisma.$transaction([
    prisma.loginCode.update({ where: { id: record.id }, data: { consumedAt: new Date() } }),
    prisma.user.upsert({
      where: { email },
      create: { email, lastLoginAt: new Date() },
      update: { lastLoginAt: new Date() },
      select: { id: true, email: true, name: true, phone: true },
    }),
  ])
  return { ok: true, user }
}
