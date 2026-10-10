import crypto from "crypto"
import { prisma } from "@/lib/prisma"

export const ADMIN_COOKIE = "admin_session"
export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex")
}

export function newSessionMaterial(now = new Date()): { token: string; hashedToken: string; expiresAt: Date } {
  const token = crypto.randomBytes(32).toString("hex")
  return {
    token,
    hashedToken: hashToken(token),
    expiresAt: new Date(now.getTime() + SESSION_DURATION_MS),
  }
}

export async function createSession(): Promise<{ token: string; hashedToken: string; expiresAt: Date }> {
  const material = newSessionMaterial()
  const now = new Date()

  await prisma.adminSession.create({ data: { tokenHash: material.hashedToken, expiresAt: material.expiresAt } })
  prisma.adminSession
    .deleteMany({
      where: {
        OR: [
          { expiresAt: { lt: now } },
          { createdAt: { lt: new Date(now.getTime() - SESSION_DURATION_MS) } },
        ],
      },
    })
    .catch(() => {})

  return material
}

export async function validateSession(token: string): Promise<boolean> {
  if (!token || token.length !== 64) return false
  const hashedToken = hashToken(token)

  const session = await prisma.adminSession.findUnique({ where: { tokenHash: hashedToken } })
  if (!session) return false

  const now = Date.now()
  const absoluteExpiry = session.createdAt.getTime() + SESSION_DURATION_MS
  if (now >= session.expiresAt.getTime() || now >= absoluteExpiry) {
    await prisma.adminSession.delete({ where: { tokenHash: hashedToken } }).catch(() => {})
    return false
  }

  return true
}

export async function deleteSession(hashedToken: string): Promise<void> {
  await prisma.adminSession.delete({ where: { tokenHash: hashedToken } }).catch(() => {})
}

export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    expires: expiresAt,
    maxAge: Math.max(0, Math.floor((expiresAt.getTime() - Date.now()) / 1000)),
  }
}
