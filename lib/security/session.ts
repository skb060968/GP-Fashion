import crypto from "crypto";
import { prisma } from "@/lib/prisma";

export const ADMIN_COOKIE = "admin_session";

export const SESSION_DURATION_MS = 8 * 60 * 60 * 1000;

const RENEW_AFTER_MS = 10 * 60 * 1000;

export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export async function createSession(): Promise<{ token: string; hashedToken: string; expiresAt: Date }> {
  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.adminSession.create({ data: { tokenHash: hashedToken, expiresAt } });

  prisma.adminSession
    .deleteMany({ where: { expiresAt: { lt: new Date() } } })
    .catch(() => {});

  return { token, hashedToken, expiresAt };
}

export async function validateSession(token: string): Promise<boolean> {
  if (!token || token.length !== 64) return false;
  const hashedToken = hashToken(token);

  const session = await prisma.adminSession.findUnique({ where: { tokenHash: hashedToken } });
  if (!session) return false;

  const now = Date.now();
  if (session.expiresAt.getTime() < now) {
    await prisma.adminSession.delete({ where: { tokenHash: hashedToken } }).catch(() => {});
    return false;
  }

  const remaining = session.expiresAt.getTime() - now;
  if (SESSION_DURATION_MS - remaining > RENEW_AFTER_MS) {
    await prisma.adminSession
      .update({ where: { tokenHash: hashedToken }, data: { expiresAt: new Date(now + SESSION_DURATION_MS) } })
      .catch(() => {});
  }

  return true;
}

export async function deleteSession(hashedToken: string): Promise<void> {
  await prisma.adminSession.delete({ where: { tokenHash: hashedToken } }).catch(() => {});
}

export function sessionCookieOptions(expiresAt: Date) {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict" as const,
    path: "/",
    expires: expiresAt,
  };
}
