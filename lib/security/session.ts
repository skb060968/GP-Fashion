import crypto from "crypto";
import { prisma } from "@/lib/prisma";

function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}

const SESSION_DURATION_MS = 60 * 60 * 1000; // 1 hour

export async function createSession(): Promise<{
  token: string;
  hashedToken: string;
}> {
  const token = crypto.randomBytes(32).toString("hex");
  const hashedToken = hashToken(token);
  const expiresAt = new Date(Date.now() + SESSION_DURATION_MS);

  await prisma.adminSession.create({
    data: {
      tokenHash: hashedToken,
      expiresAt,
    },
  });

  return { token, hashedToken };
}

export async function validateSession(token: string): Promise<boolean> {
  const hashedToken = hashToken(token);

  const session = await prisma.adminSession.findUnique({
    where: { tokenHash: hashedToken },
  });

  if (!session) {
    return false;
  }

  if (session.expiresAt < new Date()) {
    // Delete expired session
    await prisma.adminSession.delete({
      where: { tokenHash: hashedToken },
    });
    return false;
  }

  return true;
}

export async function deleteSession(hashedToken: string): Promise<void> {
  await prisma.adminSession.delete({
    where: { tokenHash: hashedToken },
  }).catch(() => {
    // Silently ignore if session doesn't exist
  });
}
