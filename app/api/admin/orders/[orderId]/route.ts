import { NextResponse, NextRequest, after } from "next/server";
import {
  updateOrderStatus,
  updateOrderNotes,
  buildOrderEmailData,
  InvalidTransitionError,
  MissingTransitionNoteError,
} from "@/lib/services/orderStatusService";
import { prisma } from "@/lib/prisma";
import { requireAdmin, requireAdminMutation } from "@/lib/security/adminAuth";
import { adminOrderPatchSchema } from "@/lib/validation/schemas";
import { sendMail } from "@/lib/mailer";
import { orderStatusEmailCustomer } from "@/lib/emails/orderStatusEmailCustomer";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const denied = await requireAdmin(req);
  if (denied) return denied;

  try {
    const { orderId } = await context.params;

    const order = await prisma.order.findUnique({
      where: { orderCode: orderId },
      include: { items: true, address: true, history: { orderBy: { changedAt: "asc" } } },
    });

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    return NextResponse.json(order);
  } catch (error) {
    console.error("ADMIN ORDER FETCH ERROR:", error);
    return NextResponse.json({ error: "Failed to fetch order" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ orderId: string }> }
) {
  const denied = await requireAdminMutation(req);
  if (denied) return denied;

  try {
    const { orderId } = await context.params;
    const body = await req.json().catch(() => null);

    const parsed = adminOrderPatchSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }

    if (parsed.data.action === "notes") {
      const updated = await updateOrderNotes(orderId, parsed.data.notes);
      if (!updated) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      return NextResponse.json(updated);
    }

    const { status, note, notifyCustomer = true } = parsed.data;

    let updatedOrder;
    try {
      updatedOrder = await updateOrderStatus(orderId, status, note);
    } catch (err) {
      if (err instanceof InvalidTransitionError) {
        return NextResponse.json({ error: err.message }, { status: 409 });
      }
      if (err instanceof MissingTransitionNoteError) {
        return NextResponse.json({ error: err.message }, { status: 400 });
      }
      throw err;
    }
    if (!updatedOrder) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const to = updatedOrder.address?.email;
    if (notifyCustomer && to) {
      const emailData = buildOrderEmailData(updatedOrder);
      const code = updatedOrder.orderCode;
      after(async () => {
        try {
          const { subject, html } = orderStatusEmailCustomer(emailData);
          await sendMail({ to, subject, html });
          console.log(`STATUS_EMAIL_SENT ${code} -> ${status}`);
        } catch (err) {
          console.error("STATUS_EMAIL_FAILED:", err);
        }
      });
    }

    return NextResponse.json(updatedOrder);
  } catch (err) {
    console.error("ADMIN STATUS UPDATE ERROR", err);
    return NextResponse.json({ error: "Failed to update order" }, { status: 500 });
  }
}
