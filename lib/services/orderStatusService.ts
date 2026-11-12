import { prisma } from "../prisma";
import { OrderEmailData } from "../types/OrderEmailData";
import { OrderStatus } from "@prisma/client";
import { transitionFor } from "../orders/transitions";
import { isSnapshot, validateMeasurements } from "../measurements/fields";
import { Prisma } from "@prisma/client";

export class MeasurementsNotConfirmedError extends Error {
  constructor(public count: number) {
    super(`Confirm the measurements for ${count} made-to-measure ${count === 1 ? "item" : "items"} before starting processing`);
  }
}

export class MeasurementUpdateError extends Error {
  constructor(message: string, public status = 400) {
    super(message);
  }
}

const MEASUREMENT_EDIT_STATUSES: OrderStatus[] = [OrderStatus.UNDER_VERIFICATION, OrderStatus.VERIFIED];

const orderInclude = { items: true, address: true, history: { orderBy: { changedAt: "asc" as const } } };

async function loadMeasuredItem(orderCode: string, itemId: string) {
  const order = await prisma.order.findUnique({
    where: { orderCode },
    select: { id: true, status: true, items: { where: { id: itemId }, select: { id: true, measurements: true } } },
  });
  if (!order) return null;
  const item = order.items[0];
  if (!item || !isSnapshot(item.measurements)) throw new MeasurementUpdateError("This item is not made to measure", 404);
  if (!MEASUREMENT_EDIT_STATUSES.includes(order.status)) {
    throw new MeasurementUpdateError("Measurements can only be changed or confirmed before processing starts", 409);
  }
  return { order, item, snapshot: item.measurements };
}

export async function updateItemMeasurements(orderCode: string, itemId: string, values: Record<string, number>, notes?: string) {
  const found = await loadMeasuredItem(orderCode, itemId);
  if (!found) return null;
  const checked = validateMeasurements(found.snapshot.kind, values);
  if (!checked.ok) throw new MeasurementUpdateError(checked.error);
  const snapshot = { ...found.snapshot, values: checked.values, notes: notes?.trim() || null, editedAt: new Date().toISOString() };
  await prisma.orderItem.update({
    where: { id: itemId },
    data: { measurements: snapshot as unknown as Prisma.InputJsonValue, measurementsConfirmedAt: null, measurementsConfirmNote: null },
  });
  return prisma.order.findUnique({ where: { id: found.order.id }, include: orderInclude });
}

export async function confirmItemMeasurements(orderCode: string, itemId: string, note?: string) {
  const found = await loadMeasuredItem(orderCode, itemId);
  if (!found) return null;
  await prisma.orderItem.update({
    where: { id: itemId },
    data: { measurementsConfirmedAt: new Date(), measurementsConfirmNote: note?.trim() || null },
  });
  return prisma.order.findUnique({ where: { id: found.order.id }, include: orderInclude });
}

export class MissingTransitionNoteError extends Error {
  constructor(public from: string, public to: string) {
    super(`A history note is required to move an order from ${from} to ${to}`);
  }
}

export class InvalidTransitionError extends Error {
  constructor(public from: string, public to: string) {
    super(`Cannot move an order from ${from} to ${to}`);
  }
}

export async function updateOrderStatus(orderCode: string, newStatus: OrderStatus, note?: string) {
  return prisma.$transaction(async (tx) => {
    const current = await tx.order.findUnique({ where: { orderCode }, select: { id: true, status: true } });
    if (!current) return null;

    const transition = transitionFor(current.status, newStatus);
    if (!transition) {
      throw new InvalidTransitionError(current.status, newStatus);
    }
    const cleanNote = note?.trim() || null;
    if (transition.noteRequired && !cleanNote) {
      throw new MissingTransitionNoteError(current.status, newStatus);
    }

    if (newStatus === OrderStatus.PROCESSING) {
      const unconfirmed = await tx.orderItem.count({
        where: { orderId: current.id, measurementsConfirmedAt: null, measurements: { not: Prisma.DbNull } },
      });
      if (unconfirmed > 0) throw new MeasurementsNotConfirmedError(unconfirmed);
    }

    await tx.order.update({ where: { id: current.id }, data: { status: newStatus } });
    await tx.statusHistory.create({
      data: { status: newStatus, orderId: current.id, note: cleanNote },
    });

    return tx.order.findUnique({
      where: { id: current.id },
      include: { items: true, address: true, history: { orderBy: { changedAt: "asc" } } },
    });
  });
}

export async function updateOrderNotes(orderCode: string, notes: string) {
  const exists = await prisma.order.findUnique({ where: { orderCode }, select: { id: true } });
  if (!exists) return null;
  return prisma.order.update({
    where: { id: exists.id },
    data: { notes: notes.trim() || null },
    include: { items: true, address: true, history: { orderBy: { changedAt: "asc" } } },
  });
}

export function buildOrderEmailData(order: {
  orderCode: string;
  amount: number;
  discount: number;
  status: string;
  createdAt: Date;
  paymentMethod: string;
  address: { fullName: string; phone: string; email: string | null; addressLine1: string; addressLine2: string | null; city: string; state: string; pincode: string } | null;
  items: { name: string; size: string; color?: string | null; price: number; quantity: number; coverThumbnail: string; measurements?: unknown }[];
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
      color: i.color ?? null,
      price: i.price,
      quantity: i.quantity,
      coverThumbnail: i.coverThumbnail,
      madeToMeasureFor: isSnapshot(i.measurements) ? i.measurements.name : null,
    })),
  };
}
