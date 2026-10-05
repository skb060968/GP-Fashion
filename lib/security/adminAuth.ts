import { NextResponse, type NextRequest } from "next/server";
import { ADMIN_COOKIE, validateSession } from "./session";

/** True when the request carries a valid admin session cookie. */
export async function isAdminRequest(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(ADMIN_COOKIE)?.value;
  if (!token) return false;
  return validateSession(token);
}

/**
 * Guard for admin API routes. Returns a 401 response to send back, or null
 * when the caller is authenticated.
 *
 *   const denied = await requireAdmin(req); if (denied) return denied;
 */
export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  if (await isAdminRequest(req)) return null;
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}
