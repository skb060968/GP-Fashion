/**
 * Pure CSV export helper for order data.
 * Money is written in rupees (two decimals) and dates in IST, so the file
 * opens readably in Excel / Sheets without conversion.
 */

import { adminStatusLabel, paymentLabel } from "@/lib/orders/labels";

export interface CsvOrderItem {
  name: string;
  size: string;
  quantity: number;
  price?: number;
}

export interface CsvOrder {
  orderCode: string;
  address: {
    fullName: string;
    phone: string;
    email?: string | null;
    addressLine1?: string;
    addressLine2?: string | null;
    city?: string;
    state?: string;
    pincode?: string;
  } | null;
  amount: number;
  discount: number;
  couponCode?: string | null;
  paymentMethod: string;
  status: string;
  createdAt: Date | string;
  items: CsvOrderItem[];
}

export const CSV_COLUMNS = [
  "orderCode",
  "placedAt",
  "status",
  "paymentMethod",
  "customerName",
  "phone",
  "email",
  "address",
  "city",
  "state",
  "pincode",
  "items",
  "subtotal",
  "discount",
  "couponCode",
  "total",
] as const;

export function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/** "Style 1 (M x2); Style 3 (L x1)" */
export function formatItems(items: CsvOrderItem[]): string {
  return items.map((item) => `${item.name} (${item.size} x${item.quantity})`).join("; ");
}

/** Paise → "1299.00" */
export function formatCsvMoney(paise: number): string {
  return (paise / 100).toFixed(2);
}

/** "2026-10-05 19:45" in IST */
export function formatCsvDate(d: Date | string): string {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return "";
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);
  const get = (t: string) => parts.find((p) => p.type === t)?.value ?? "";
  return `${get("year")}-${get("month")}-${get("day")} ${get("hour")}:${get("minute")}`;
}

export function ordersToCsv(orders: CsvOrder[]): string {
  const header = CSV_COLUMNS.join(",");
  if (orders.length === 0) return header + "\n";

  const rows = orders.map((o) => {
    const a = o.address;
    const addressLine = [a?.addressLine1, a?.addressLine2].filter(Boolean).join(", ");
    const fields: string[] = [
      o.orderCode,
      formatCsvDate(o.createdAt),
      adminStatusLabel(o.status),
      paymentLabel(o.paymentMethod),
      a?.fullName ?? "",
      a?.phone ?? "",
      a?.email ?? "",
      addressLine,
      a?.city ?? "",
      a?.state ?? "",
      a?.pincode ?? "",
      formatItems(o.items),
      formatCsvMoney(o.amount + o.discount),
      formatCsvMoney(o.discount),
      o.couponCode ?? "",
      formatCsvMoney(o.amount),
    ];
    return fields.map(escapeCsvField).join(",");
  });

  return header + "\n" + rows.join("\n") + "\n";
}
