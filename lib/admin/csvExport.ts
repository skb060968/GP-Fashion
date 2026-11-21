

import { adminStatusLabel, paymentLabel } from "@/lib/orders/labels";
import { isSnapshot } from "@/lib/measurements/fields";
import { placeOfSupplyLabel } from "@/lib/gst/states";

export interface CsvOrderItem {
  name: string;
  size: string;
  color?: string | null;
  quantity: number;
  price?: number;
  measurements?: unknown;
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
  billingAddress?: {
    fullName: string;
    addressLine1: string;
    addressLine2?: string | null;
    city: string;
    state: string;
    pincode: string;
  } | null;
  amount: number;
  discount: number;
  couponCode?: string | null;
  paymentMethod: string;
  paymentReference?: string | null;
  status: string;
  createdAt: Date | string;
  items: CsvOrderItem[];
  invoiceNumber?: string | null;
  invoiceDate?: Date | string | null;
  placeOfSupply?: string | null;
  buyerGstin?: string | null;
  buyerName?: string | null;
  taxableValue?: number;
  cgst?: number;
  sgst?: number;
  igst?: number;
}

export const CSV_COLUMNS = [
  "orderCode",
  "placedAt",
  "status",
  "paymentMethod",
  "paymentReference",
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
  "invoiceNumber",
  "invoiceDate",
  "placeOfSupply",
  "buyerGstin",
  "buyerName",
  "taxableValue",
  "cgst",
  "sgst",
  "igst",
  "billingName",
  "billingAddress",
  "billingCity",
  "billingState",
  "billingPincode",
] as const;

export function escapeCsvField(value: string): string {
  if (value.includes(",") || value.includes('"') || value.includes("\n") || value.includes("\r")) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

export function formatItems(items: CsvOrderItem[]): string {
  return items
    .map((item) => {
      const size = isSnapshot(item.measurements) ? `Made to measure: ${item.measurements.name}` : item.size;
      return `${item.name} (${size}${item.color ? `, ${item.color}` : ""} x${item.quantity})`;
    })
    .join("; ");
}

export function formatCsvMoney(paise: number): string {
  return (paise / 100).toFixed(2);
}

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
    const b = o.billingAddress;
    const addressLine = [a?.addressLine1, a?.addressLine2].filter(Boolean).join(", ");
    const fields: string[] = [
      o.orderCode,
      formatCsvDate(o.createdAt),
      adminStatusLabel(o.status),
      paymentLabel(o.paymentMethod),
      o.paymentReference ?? "",
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
      o.invoiceNumber ?? "",
      o.invoiceDate ? formatCsvDate(o.invoiceDate) : "",
      o.placeOfSupply ? placeOfSupplyLabel(o.placeOfSupply) : "",
      o.buyerGstin ?? "",
      o.buyerName ?? "",
      typeof o.taxableValue === "number" ? formatCsvMoney(o.taxableValue) : "",
      typeof o.cgst === "number" ? formatCsvMoney(o.cgst) : "",
      typeof o.sgst === "number" ? formatCsvMoney(o.sgst) : "",
      typeof o.igst === "number" ? formatCsvMoney(o.igst) : "",
      b?.fullName ?? "",
      b ? [b.addressLine1, b.addressLine2].filter(Boolean).join(", ") : "",
      b?.city ?? "",
      b?.state ?? "",
      b?.pincode ?? "",
    ];
    return fields.map(escapeCsvField).join(",");
  });

  return header + "\n" + rows.join("\n") + "\n";
}
