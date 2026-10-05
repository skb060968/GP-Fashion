import { prisma } from "../prisma";
import { OrderEmailData } from "../types/OrderEmailData";
import { OrderStatus } from "@prisma/client";
import { canTransition } from "../orders/transitions";

export class InvalidTransitionError extends Error {
  constructor(public from: string, public to: string) {
    super(`Cannot move an order from ${from} to ${to}`);
  }
}

/**
 * Moves an order to a new status, recording the change (and optional note)
 * in StatusHistory. Validates the transition and runs atomically.
 * Returns null if the order does not exist.
 */
export async function updateOrderStatus(orderCode: string, newStatus: OrderStatus, note?: string) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.order.findUnique({ where: { orderCode }, select: { id: true, status: true } });
    if (!current) return null;

    if (!canTransition(current.status, newStatus)) {
      throw new InvalidTransitionError(current.status, newStatus);
    }

    await tx.order.update({ where: { id: current.id }, data: { status: newStatus } });
    await tx.statusHistory.create({
      data: { status: newStatus, orderId: current.id, note: note?.trim() || null },
    });

    return tx.order.findUnique({
      where: { id: current.id },
      include: { items: true, address: true, history: { orderBy: { changedAt: "asc" } } },
    });
  });
}

/** Saves the admin's internal notes for an order. Returns null if not found. */
export async function updateOrderNotes(orderCode: string, notes: string) {
  const exists = await prisma.order.findUnique({ where: { orderCode }, select: { id: true } });
  if (!exists) return null;
  return prisma.order.update({
    where: { id: exists.id },
    data: { notes: notes.trim() || null },
    include: { items: true, address: true, history: { orderBy: { changedAt: "asc" } } },
  });
}

/**
 * Build email data from an order (for use in route handler's after() callback).
 */
export function buildOrderEmailData(order: {
  orderCode: string;
  amount: number;
  discount: number;
  status: string;
  createdAt: Date;
  paymentMethod: string;
  address: { fullName: string; phone: string; email: string | null; addressLine1: string; addressLine2: string | null; city: string; state: string; pincode: string } | null;
  items: { name: string; size: string; price: number; quantity: number; coverThumbnail: string }[];
}): OrderEmailData {
  return {
    orderCode: order.orderCode,
    amount: order.amount,
    discount: order.discount ?? undefined,
    status: order.status,
    createdAt: order.createdAt,
    paymentMethod: order.paymentMethod,
    customer: {
      fullName: order.address?.fullName ?? "",
      phone: order.address?.phone ?? "",
      email: order.address?.email ?? undefined,
      addressLine1: order.address?.addressLine1 ?? "",
      addressLine2: order.address?.addressLine2 ?? undefined,
      city: order.address?.city ?? "",
      state: order.address?.state ?? "",
      pincode: order.address?.pincode ?? "",
    },
    items: order.items.map(i => ({
      name: i.name,
      size: i.size,
      price: i.price,
      quantity: i.quantity,
      coverThumbnail: i.coverThumbnail,
    })),
  };
}
