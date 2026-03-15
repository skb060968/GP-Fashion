/**
 * Pure CSV export helper for order data.
 * Converts order objects to a CSV string with proper escaping.
 */

export interface CsvOrderItem {
  name: string;
  size: string;
  quantity: number;
}

export interface CsvOrder {
  orderCode: string;
  address: {
    fullName: string;
    phone: string;
    email?: string | null;
  } | null;
  amount: number;
  discount: number;
  paymentMethod: string;
  status: string;
  createdAt: Date | string;
  items: CsvOrderItem[];
}

const CSV_COLUMNS = [
  "orderCode",
  "customerName",
  "phone",
  "email",
  "amount",
  "discount",
  "paymentMethod",
  "status",
  "createdAt",
  "items",
] as const;

/**
 * Escape a CSV field value. If the value contains a comma, double quote,
 * or newline, wrap it in double quotes and escape internal double quotes
 * by doubling them.
 */
export function escapeCsvField(value: string): string {
  if (
    value.includes(",") ||
    value.includes('"') ||
    value.includes("\n") ||
    value.includes("\r")
  ) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

/**
 * Format order items as a semicolon-separated string.
 * Example: "Style 1 (M x2); Style 3 (L x1)"
 */
export function formatItems(items: CsvOrderItem[]): string {
  return items
    .map((item) => `${item.name} (${item.size} x${item.quantity})`)
    .join("; ");
}

/**
 * Convert an array of orders to a CSV string.
 * Returns header-only CSV when the array is empty.
 */
export function ordersToCsv(orders: CsvOrder[]): string {
  const header = CSV_COLUMNS.join(",");
  if (orders.length === 0) {
    return header + "\n";
  }

  const rows = orders.map((order) => {
    const createdAt =
      order.createdAt instanceof Date
        ? order.createdAt.toISOString()
        : order.createdAt;

    const fields: string[] = [
      escapeCsvField(order.orderCode),
      escapeCsvField(order.address?.fullName ?? ""),
      escapeCsvField(order.address?.phone ?? ""),
      escapeCsvField(order.address?.email ?? ""),
      escapeCsvField(String(order.amount)),
      escapeCsvField(String(order.discount)),
      escapeCsvField(order.paymentMethod),
      escapeCsvField(order.status),
      escapeCsvField(createdAt),
      escapeCsvField(formatItems(order.items)),
    ];

    return fields.join(",");
  });

  return header + "\n" + rows.join("\n") + "\n";
}
