import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { validateCoupon } from "@/lib/services/couponService";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { code, subtotal } = body;

  if (!code || typeof code !== "string" || typeof subtotal !== "number") {
    return NextResponse.json(
      { error: "Missing or invalid 'code' (string) and 'subtotal' (number)" },
      { status: 400 }
    );
  }

  const result = await validateCoupon(code, subtotal);
  return NextResponse.json(result);
}
