import { prisma } from "@/lib/prisma";
import { OrderStatus, PaymentMethod } from "@prisma/client";

async function generateOrderCode(year: number) {
  const yearSuffix = year.toString().slice(-2);

  const lastOrder = await prisma.order.findFirst({
    where: { orderCode: { startsWith: yearSuffix } },
    orderBy: { createdAt: "desc" },
  });

  const lastSeq = lastOrder
    ? parseInt(lastOrder.orderCode.slice(2))
    : 0;

  const nextSeq = (lastSeq + 1).toString().padStart(3, "0");

  return `${yearSuffix}${nextSeq}`;
}

export async function createOrder(data: {
  amount: number;
  discount?: number;
  status: OrderStatus;
  paymentMethod: PaymentMethod;
}) {
  const year = new Date().getFullYear();
  const orderCode = await generateOrderCode(year);

  return prisma.order.create({
    data: {
      orderCode,
      amount: data.amount,
      discount: data.discount ?? 0,
      status: data.status,
      paymentMethod: data.paymentMethod,
    },
  });
}
