import { prisma } from "../prisma";
import { OrderEmailData } from "../types/OrderEmailData";
import { OrderStatus } from "@prisma/client";

export async function updateOrderStatus(orderCode: string, newStatus: OrderStatus) {
  // ✅ Update order by orderCode
  const order = await prisma.order.update({
    where: { orderCode },
    data: { status: newStatus },
    include: { items: true, address: true },
  });

  // ✅ Log the status change in history
  await prisma.statusHistory.create({
    data: { status: newStatus, orderId: order.id },
  });

  // ✅ Return updated order including history for API response
  const updatedOrder = await prisma.order.findUnique({
    where: { orderCode },
    include: { items: true, address: true, history: true },
  });

  return updatedOrder;
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