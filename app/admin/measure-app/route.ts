import { readFile } from "node:fs/promises"
import path from "node:path"
import { NextResponse, type NextRequest } from "next/server"
import { isAdminRequest } from "@/lib/security/adminAuth"

export const runtime = "nodejs"
export const dynamic = "force-dynamic"

const APP_FILE = path.join(process.cwd(), "measureapp", "index.html")
const LOGIN_URL = "/admin-login?next=%2Fadmin%2Fmeasure&expired=1"

const HTML_HEADERS = {
  "Content-Type": "text/html; charset=utf-8",
  "Cache-Control": "private, no-store",
  "X-Robots-Tag": "noindex, nofollow",
}

const SIGNED_OUT_PAGE = `<!DOCTYPE html>
<html lang="en">
<head><meta charset="utf-8"><meta name="robots" content="noindex, nofollow"><title>Signed out</title></head>
<body style="font-family: system-ui, sans-serif; padding: 24px">
<p>Your admin session has ended. <a href="${LOGIN_URL}" target="_top">Sign in again</a></p>
<script>window.top.location.href = ${JSON.stringify(LOGIN_URL)}</script>
</body>
</html>`

export async function GET(req: NextRequest) {
  if (!(await isAdminRequest(req))) {
    return new NextResponse(SIGNED_OUT_PAGE, { status: 401, headers: HTML_HEADERS })
  }
  const html = await readFile(APP_FILE, "utf8")
  return new NextResponse(html, { status: 200, headers: HTML_HEADERS })
}
