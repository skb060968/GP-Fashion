import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { createRateLimiter } from "@/lib/security/rateLimiter";
import { createSession } from "@/lib/security/session";

const loginRateLimiter = createRateLimiter({ windowMs: 15 * 60 * 1000, maxRequests: 5 });

export async function POST(req: NextRequest) {
  // Rate limiting check
  const clientIp = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "unknown";
  const rateResult = loginRateLimiter.check(clientIp);
  if (!rateResult.allowed) {
    return NextResponse.json(
      { error: "Too many requests" },
      { status: 429, headers: { "Retry-After": String(rateResult.retryAfterSeconds) } }
    );
  }

  const { email, password } = await req.json();

  if (
    email !== process.env.ADMIN_EMAIL ||
    password !== process.env.ADMIN_PASSWORD
  ) {
    return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
  }

  const { token } = await createSession();

  // ✅ Set cookie on the response, not via cookies()
  const res = NextResponse.json({ success: true });
  res.cookies.set("admin_session", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
    path: "/",
    maxAge: 60 * 60 * 1, // ⏰ 1 hour
  });

  return res;
}
