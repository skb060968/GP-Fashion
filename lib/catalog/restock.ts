import { prisma } from "@/lib/prisma"
import { sendMail } from "@/lib/mailer"
import { getProduct } from "@/lib/data/categories"
import { backInStockEmail } from "@/lib/emails/backInStock"

export async function sendRestockEmails(slug: string): Promise<{ sent: number; failed: number }> {
  const product = getProduct(slug)
  if (!product) return { sent: 0, failed: 0 }

  const requests = await prisma.restockRequest.findMany({ where: { slug }, orderBy: { createdAt: "asc" } })
  const { subject, html } = backInStockEmail(product)

  let sent = 0
  let failed = 0
  for (const request of requests) {
    const claimed = await prisma.restockRequest.deleteMany({ where: { id: request.id } })
    if (claimed.count === 0) continue
    try {
      await sendMail({ to: request.email, subject, html })
      sent++
    } catch (error) {
      failed++
      console.error("RESTOCK_EMAIL_FAILED:", slug, error)
      await prisma.restockRequest
        .upsert({
          where: { slug_email: { slug: request.slug, email: request.email } },
          create: { slug: request.slug, email: request.email, createdAt: request.createdAt },
          update: {},
        })
        .catch((restoreError) => console.error("RESTOCK_REQUEST_RESTORE_FAILED:", slug, restoreError))
    }
  }
  return { sent, failed }
}
