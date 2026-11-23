import { prisma } from "../prisma";
import { OrderEmailData } from "../types/OrderEmailData";
import { OrderStatus } from "@prisma/client";
import { transitionFor } from "../orders/transitions";
import { isSnapshot, validateMeasurements } from "../measurements/fields";
import { Prisma } from "@prisma/client";
import { financialYear } from "../gst/tax";
import { business, formatInvoiceNumber, sellerSnapshot } from "../data/business";
import { emailBilling } from "../emails/sendOrderPlaced";
import { checkReturnRequest, describeReturn, returnHistoryNote, ReturnRequestError, type ReturnRequestInput } from "../orders/returns";
import { returnableOrder } from "../orders/returnableOrder";
import { CreditNoteError, creditLines, creditNoteDeadline, creditNoteNumber, creditNoteSlug, creditTotals } from "../gst/creditNote";

export { CreditNoteError };

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

export const orderInclude = {
  items: true,
  address: true,
  billingAddress: true,
  history: { orderBy: { changedAt: "asc" } },
  creditNotes: {
    orderBy: { date: "asc" },
    select: { number: true, date: true, amount: true, reason: true, items: { select: { orderItemId: true, quantity: true } } },
  },
  returnRequests: { orderBy: { createdAt: "asc" } },
} as const;

export async function requestReturn(orderCode: string, input: ReturnRequestInput) {
  return prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({
      where: { orderCode },
      include: { items: true, history: { select: { status: true, changedAt: true } } },
    });
    if (!order) return null;
    if (order.status !== OrderStatus.DELIVERED) {
      throw new ReturnRequestError(
        order.status === OrderStatus.RETURN_REQUESTED ? "A return is already open for this order. We will be in touch." : "This order cannot be returned now.",
        409
      );
    }
    const allowed = returnableOrder(order);
    if (!allowed) throw new ReturnRequestError("The 7 days for returning this order have passed, or it has no pieces that can be returned.", 409);
    const items = checkReturnRequest(allowed, input);
    const record = { reason: input.reason, resolution: input.resolution, note: input.note?.trim() || null, items };
    const moved = await tx.order.updateMany({ where: { id: order.id, status: OrderStatus.DELIVERED }, data: { status: OrderStatus.RETURN_REQUESTED } });
    if (moved.count === 0) throw new ReturnRequestError("This order was just updated. Refresh the page and try again.", 409);
    await tx.returnRequest.create({ data: { ...record, items: items as unknown as Prisma.InputJsonValue, orderId: order.id } });
    await tx.statusHistory.create({ data: { status: OrderStatus.RETURN_REQUESTED, orderId: order.id, note: returnHistoryNote(record) } });
    return tx.order.findUnique({ where: { id: order.id }, include: orderInclude });
  });
}

export { ReturnRequestError };

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

export async function updateOrderStatus(orderCode: string, newStatus: OrderStatus, note?: string, creditNote?: CreditNoteRequest) {
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

    let invoice: ({ invoiceNumber: string; invoiceDate: Date } & ReturnType<typeof sellerSnapshot>) | null = null;
    if (newStatus === OrderStatus.SHIPPED) {
      const existing = await tx.order.findUnique({ where: { id: current.id }, select: { invoiceNumber: true } });
      if (!existing?.invoiceNumber) {
        const now = new Date();
        const fy = financialYear(now);
        const counter = await tx.invoiceCounter.upsert({
          where: { financialYear: fy },
          create: { financialYear: fy, last: 1 },
          update: { last: { increment: 1 } },
        });
        invoice = { invoiceNumber: formatInvoiceNumber(fy, counter.last), invoiceDate: now, ...sellerSnapshot() };
      }
    }

    let issued: string | null = null;
    if (newStatus === OrderStatus.REFUNDED) {
      issued = await issueCreditNote(tx, current.id, creditNote);
    }

    await tx.order.update({ where: { id: current.id }, data: { status: newStatus, ...(invoice ?? {}) } });
    await tx.statusHistory.create({
      data: { status: newStatus, orderId: current.id, note: issued ? [cleanNote, `Credit note ${issued} issued`].filter(Boolean).join(" · ") : cleanNote },
    });

    return tx.order.findUnique({ where: { id: current.id }, include: orderInclude });
  });
}

export type CreditNoteRequest = { items: { orderItemId: string; quantity: number }[]; reason: string };

async function issueCreditNote(tx: Prisma.TransactionClient, orderId: string, request: CreditNoteRequest | undefined): Promise<string | null> {
  const order = await tx.order.findUnique({
    where: { id: orderId },
    include: { items: true, creditNotes: { include: { items: true } } },
  });
  if (!order?.invoiceNumber) return null;
  const invoiceDate = order.invoiceDate ?? order.updatedAt;
  const now = new Date();
  if (now >= creditNoteDeadline(invoiceDate)) return null;
  if (!request) throw new CreditNoteError("Choose the items to credit: this order has a tax invoice, so refunding it issues a credit note");
  if (order.sellerGstin !== business.gstin) {
    throw new CreditNoteError(`Invoice ${order.invoiceNumber} was issued under another GSTIN, so no credit note can be issued against it`, 409);
  }
  const reason = request.reason.trim();
  if (!reason) throw new CreditNoteError("Give a reason for the credit note");

  const lines = creditLines(
    order.items,
    order.creditNotes.flatMap((c) => c.items),
    request.items,
  );
  const seller = sellerSnapshot();
  const totals = creditTotals(lines, order.placeOfSupply === (order.sellerStateCode ?? seller.sellerStateCode));
  const fy = financialYear(now);
  const counter = await tx.invoiceCounter.upsert({
    where: { financialYear: `CN/${fy}` },
    create: { financialYear: `CN/${fy}`, last: 1 },
    update: { last: { increment: 1 } },
  });
  const number = creditNoteNumber(fy, counter.last);
  await tx.creditNote.create({
    data: {
      number,
      date: now,
      reason,
      ...totals,
      placeOfSupply: order.placeOfSupply,
      buyerGstin: order.buyerGstin,
      buyerName: order.buyerName,
      invoiceNumber: order.invoiceNumber,
      invoiceDate,
      invoiceAmount: order.amount,
      ...seller,
      orderId: order.id,
      items: { create: lines },
    },
  });
  return number;
}

export async function updateOrderNotes(orderCode: string, notes: string) {
  const exists = await prisma.order.findUnique({ where: { orderCode }, select: { id: true } });
  if (!exists) return null;
  return prisma.order.update({
    where: { id: exists.id },
    data: { notes: notes.trim() || null },
    include: orderInclude,
  });
}

export function buildOrderEmailData(order: {
  orderCode: string;
  amount: number;
  discount: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
  invoiceNumber?: string | null;
  status: string;
  createdAt: Date;
  paymentMethod: string;
  address: { fullName: string; phone: string; email: string | null; addressLine1: string; addressLine2: string | null; city: string; state: string; pincode: string } | null;
  items: { name: string; size: string; color?: string | null; price: number; quantity: number; coverThumbnail: string; measurements?: unknown }[];
  creditNotes?: { number: string; amount: number }[];
  billingAddress?: { fullName: string; addressLine1: string; addressLine2: string | null; city: string; state: string; pincode: string } | null;
  returnRequests?: { reason: string; resolution: string; note: string | null; items: unknown }[];
}): OrderEmailData {
  const credit = order.creditNotes?.[order.creditNotes.length - 1];
  const lastReturn = order.returnRequests?.[order.returnRequests.length - 1];
  return {
    returnRequest: lastReturn ? describeReturn(lastReturn) : null,
    billing: emailBilling(order.billingAddress),
    creditNote: credit ? { number: credit.number, slug: creditNoteSlug(credit.number), amount: credit.amount } : null,
    orderCode: order.orderCode,
    amount: order.amount,
    discount: order.discount ?? undefined,
    gst: (order.cgst ?? 0) + (order.sgst ?? 0) + (order.igst ?? 0),
    invoiceNumber: order.invoiceNumber ?? null,
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
