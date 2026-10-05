import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import {
  ordersToCsv,
  formatCsvMoney,
  formatCsvDate,
  formatItems,
  CSV_COLUMNS,
  type CsvOrder,
  type CsvOrderItem,
} from "../csvExport";
import { adminStatusLabel, paymentLabel } from "@/lib/orders/labels";

// --- Simple CSV parser for round-trip verification ---

function parseCsv(csv: string): Record<string, string>[] {
  const lines = splitCsvLines(csv);
  if (lines.length === 0) return [];
  const headers = parseCsvRow(lines[0]);
  const records: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvRow(lines[i]);
    const record: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) record[headers[j]] = values[j] ?? "";
    records.push(record);
  }
  return records;
}

function splitCsvLines(csv: string): string[] {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;
  for (const ch of csv) {
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if (ch === "\n" && !inQuotes) {
      if (current.length > 0) lines.push(current);
      current = "";
    } else if (ch === "\r" && !inQuotes) {
      // skip
    } else {
      current += ch;
    }
  }
  if (current.length > 0) lines.push(current);
  return lines;
}

function parseCsvRow(row: string): string[] {
  const fields: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < row.length; i++) {
    const ch = row[i];
    if (inQuotes) {
      if (ch === '"') {
        if (row[i + 1] === '"') {
          current += '"';
          i++;
        } else inQuotes = false;
      } else current += ch;
    } else if (ch === '"') inQuotes = true;
    else if (ch === ",") {
      fields.push(current);
      current = "";
    } else current += ch;
  }
  fields.push(current);
  return fields;
}

// --- Generators ---

const noNewlines = (s: string) => s.replace(/[\n\r]/g, "");
const nonEmptyStringArb = fc.string({ minLength: 1, maxLength: 20 }).map((s) => noNewlines(s) || "a");
const csvTrickyStringArb = fc.oneof(
  nonEmptyStringArb,
  fc.constant("hello, world"),
  fc.constant('say "hi"'),
  fc.constant('a "b, c" d'),
  fc.constant('comma,and"quote')
);

const csvOrderItemArb: fc.Arbitrary<CsvOrderItem> = fc.record({
  name: csvTrickyStringArb,
  size: fc.constantFrom("S", "M", "L", "XL"),
  quantity: fc.integer({ min: 1, max: 10 }),
});

const csvOrderArb: fc.Arbitrary<CsvOrder> = fc.record({
  orderCode: nonEmptyStringArb,
  address: fc.record({
    fullName: csvTrickyStringArb,
    phone: fc.array(fc.constantFrom(..."0123456789".split("")), { minLength: 10, maxLength: 10 }).map((d) => d.join("")),
    email: fc.option(fc.emailAddress().map(noNewlines), { nil: null }),
    addressLine1: csvTrickyStringArb,
    addressLine2: fc.option(csvTrickyStringArb, { nil: null }),
    city: nonEmptyStringArb,
    state: nonEmptyStringArb,
    pincode: fc.array(fc.constantFrom(..."0123456789".split("")), { minLength: 6, maxLength: 6 }).map((d) => d.join("")),
  }),
  amount: fc.integer({ min: 0, max: 1_000_000 }),
  discount: fc.integer({ min: 0, max: 100_000 }),
  couponCode: fc.option(fc.constantFrom("WELCOME10", "FEST-25"), { nil: null }),
  paymentMethod: fc.constantFrom("UPI_MANUAL", "COD", "RAZORPAY"),
  status: fc.constantFrom(
    "UNDER_VERIFICATION", "VERIFIED", "REJECTED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"
  ),
  createdAt: fc.date({ min: new Date("2024-01-01"), max: new Date("2026-12-31"), noInvalidDate: true }),
  items: fc.array(csvOrderItemArb, { minLength: 1, maxLength: 5 }),
});

const orderListArb = fc.array(csvOrderArb, { minLength: 1, maxLength: 10 });

// --- Tests ---

describe("CSV export", () => {
  it("round-trips every column through a CSV parser", () => {
    fc.assert(
      fc.property(orderListArb, (orders) => {
        const records = parseCsv(ordersToCsv(orders));
        expect(records.length).toBe(orders.length);

        orders.forEach((o, i) => {
          const r = records[i];
          const a = o.address!;
          expect(r.orderCode).toBe(o.orderCode);
          expect(r.placedAt).toBe(formatCsvDate(o.createdAt));
          expect(r.status).toBe(adminStatusLabel(o.status));
          expect(r.paymentMethod).toBe(paymentLabel(o.paymentMethod));
          expect(r.customerName).toBe(a.fullName);
          expect(r.phone).toBe(a.phone);
          expect(r.email).toBe(a.email ?? "");
          expect(r.address).toBe([a.addressLine1, a.addressLine2].filter(Boolean).join(", "));
          expect(r.city).toBe(a.city);
          expect(r.state).toBe(a.state);
          expect(r.pincode).toBe(a.pincode);
          expect(r.items).toBe(formatItems(o.items));
          expect(r.subtotal).toBe(formatCsvMoney(o.amount + o.discount));
          expect(r.discount).toBe(formatCsvMoney(o.discount));
          expect(r.couponCode).toBe(o.couponCode ?? "");
          expect(r.total).toBe(formatCsvMoney(o.amount));
        });
      }),
      { numRuns: 100 }
    );
  });

  it("writes money in rupees with two decimals", () => {
    expect(formatCsvMoney(1299000)).toBe("12990.00");
    expect(formatCsvMoney(5)).toBe("0.05");
    expect(formatCsvMoney(0)).toBe("0.00");
  });

  it("writes dates in IST as yyyy-mm-dd HH:mm", () => {
    // 2026-10-05T14:15:00Z is 19:45 IST
    expect(formatCsvDate(new Date("2026-10-05T14:15:00Z"))).toBe("2026-10-05 19:45");
  });

  it("empty order list produces header-only CSV", () => {
    const csv = ordersToCsv([]);
    expect(csv.trim()).toBe(CSV_COLUMNS.join(","));
  });
});
