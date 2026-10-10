import { NextResponse, type NextRequest } from "next/server"
import { ADMIN_COOKIE, validateSession } from "./session"

export async function isAdminRequest(req: NextRequest): Promise<boolean> {
  const token = req.cookies.get(ADMIN_COOKIE)?.value
  if (!token) return false
  return validateSession(token)
}

export async function requireAdmin(req: NextRequest): Promise<NextResponse | null> {
  if (await isAdminRequest(req)) return null
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
}

export function requireSameOriginJson(req: NextRequest): NextResponse | null {
  const origin = req.headers.get("origin")
  if (!origin || origin === "null" || origin !== req.nextUrl.origin) {
    return NextResponse.json({ error: "Invalid request." }, { status: 403 })
  }

  const contentType = req.headers.get("content-type")?.split(";", 1)[0].trim().toLowerCase()
  if (contentType !== "application/json") {
    return NextResponse.json({ error: "Invalid request." }, { status: 415 })
  }

  return null
}

export async function requireAdminMutation(req: NextRequest): Promise<NextResponse | null> {
  const invalid = requireSameOriginJson(req)
  if (invalid) return invalid
  return requireAdmin(req)
}
