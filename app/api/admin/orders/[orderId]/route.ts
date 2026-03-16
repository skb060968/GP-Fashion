import { NextResponse, NextRequest, after } from "next/server";
import { updateOrderStatus, buildOrderEmailData } from "@/lib/services/orderStatusService";
import { prisma } from "@/lib/prisma";
import { validateSession } from "@/lib/security/session";
import { updateStatusSchema } from "@/lib/validation/schemas";
import { sendMail } from "@/lib/mailer";
import { orderStatusEmailCustomer } from "@/lib/emails/orderStatusEmailCustomer";

async function verifyAdmin(req: NextRequest) {
  const token = req.cookies.get("admin_session")?.value;

  if (!token) return false;

  return validateSession(token);
}

// GET
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderId } = await context.params; // ✅ IMPORTANT FIX

    const order = await prisma.order.findUnique({
      where: { orderCode: orderId },
      include: { items: true, address: true, history: true },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("ADMIN ORDER FETCH ERROR:", error);
    return NextResponse.json(
      { error: "Failed to fetch order" },
      { status: 500 }
    );
  }
}

// PATCH
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  if (!(await verifyAdmin(req))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { orderId } = await context.params; // ✅ IMPORTANT FIX
    const body = await req.json();

    const parsed = updateStatusSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid status value" },
        { status: 400 }
      );
    }

    const updatedOrder = await updateOrderStatus(orderId, parsed.data.status);

    // Send status email after response using Next.js after()
    if (updatedOrder?.address?.email) {
      const emailData = buildOrderEmailData(updatedOrder as any);
      after(async () => {
        try {
          const html = orderStatusEmailCustomer(emailData);
          const subject = `Order Status: ${parsed.data.status.replace(/_/g, " ")}`;
          await sendMail({ to: emailData.customer.email!, subject, html });
        } catch (err) {
          console.error("STATUS_EMAIL_FAILED:", err);
        }
      });
    }

    return NextResponse.json(updatedOrder);
  } catch (err) {
    console.error("ADMIN STATUS UPDATE ERROR", err);
    return NextResponse.json(
      { error: "Failed to update status" },
      { status: 500 }
    );
  }
}
