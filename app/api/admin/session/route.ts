import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/security/adminAuth";

/** Lightweight probe used by the login page to skip itself when already signed in. */
export async function GET(req: NextRequest) {
  return NextResponse.json({ authenticated: await isAdminRequest(req) });
}
