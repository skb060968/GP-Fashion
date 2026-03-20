import crypto from "crypto";

/**
 * Verifies a Razorpay payment signature using HMAC SHA256.
 * Uses timingSafeEqual to prevent timing attacks.
 */
export function verifyRazorpaySignature(
  razorpayOrderId: string,
  razorpayPaymentId: string,
  razorpaySignature: string,
  secret: string
): boolean {
  const body = razorpayOrderId + "|" + razorpayPaymentId;
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(body)
    .digest("hex");

  const expected = Buffer.from(expectedSignature, "utf-8");
  const received = Buffer.from(razorpaySignature, "utf-8");

  if (expected.length !== received.length) {
    return false;
  }

  return crypto.timingSafeEqual(expected, received);
}
