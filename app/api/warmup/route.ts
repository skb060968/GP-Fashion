import { prisma } from "@/lib/prisma";

export async function POST() {
  const maxAttempts = 3;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      await prisma.$queryRaw`SELECT 1`;
      return new Response("Warm-up successful", { status: 200 });
    } catch (err) {
      if (attempt === maxAttempts) {
        console.error("Warm-up failed after retries:", err);
        return new Response("Warm-up failed", { status: 500 });
      }
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  }
}
