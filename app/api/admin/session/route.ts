import { NextResponse, type NextRequest } from "next/server";
import { isAdminRequest } from "@/lib/security/adminAuth";

export async function GET(req: NextRequest) {
  return NextResponse.json({ authenticated: await isAdminRequest(req) });
}
