import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { ordersToCsv, CsvOrder, CsvOrderItem } from "../csvExport";

// Feature: website-improvements, Property 14: CSV export round-trip

/**
 * Validates: Requirements 6.2, 6.3, 6.6
 *
 * For any set of orders, serializing them to CSV format and then parsing
 * the CSV back into structured records should produce data matching the
 * original orders for all included columns.
 */

// --- Simple CSV parser for round-trip verification ---

function parseCsv(csv: string): Record<string, string>[] {
  const lines = splitCsvLines(csv);
  if (lines.length === 0) return [];
  const headers = parseCsvRow(lines[0]);
  const records: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const values = parseCsvRow(lines[i]);
    const record: Record<string, string> = {};
    for (let j = 0; j < headers.length; j++) {
      record[headers[j]] = values[j] ?? "";
    }
    records.push(record);
  }
  return records;
}

function splitCsvLines(csv: string): string[] {
  const lines: string[] = [];
  let current = "";
  let inQuotes = false;
  for (let i = 0; i < csv.length; i++) {
    const ch = csv[i];
    if (ch === '"') {
      inQuotes = !inQuotes;
      current += ch;
    } else if (ch === "\n" && !inQuotes) {
      if (current.length > 0) {
        lines.push(current);
      }
      current = "";
    } else if (ch === "\r" && !inQuotes) {
      // skip \r
    } else {
      current += ch;
    }
  }
  if (current.length > 0) {
    lines.push(current);
  }
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
        if (i + 1 < row.length && row[i + 1] === '"') {
          current += '"';
          i++; // skip escaped quote
        } else {
          inQuotes = false;
        }
      } else {
        current += ch;
      }
    } else {
      if (ch === '"') {
        inQuotes = true;
      } else if (ch === ",") {
        fields.push(current);
        current = "";
      } else {
        current += ch;
      }
    }
  }
  fields.push(current);
  return fields;
}

// --- Generators ---

/** Generate a string without newlines (but may contain commas and quotes) */
const safeStringArb = fc
  .string({ minLength: 0, maxLength: 30 })
  .map((s) => s.replace(/[\n\r]/g, ""));

/** Generate a non-empty string without newlines */
const nonEmptyStringArb = fc
  .string({ minLength: 1, maxLength: 20 })
  .map((s) => s.replace(/[\n\r]/g, "") || "a");

/** Strings that specifically exercise CSV escaping (commas, quotes) */
const csvTrickyStringArb = fc.oneof(
  nonEmptyStringArb,
  fc.constant('hello, world'),
  fc.constant('say "hi"'),
  fc.constant('a "b, c" d'),
  fc.constant('comma,and"quote'),
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
    phone: fc
      .array(fc.constantFrom("0", "1", "2", "3", "4", "5", "6", "7", "8", "9"), {
        minLength: 10,
        maxLength: 10,
      })
      .map((digits) => digits.join("")),
    email: fc.option(
      fc.emailAddress().map((e) => e.replace(/[\n\r]/g, "")),
      { nil: null }
    ),
  }),
  amount: fc.integer({ min: 0, max: 1_000_000 }),
  discount: fc.integer({ min: 0, max: 100_000 }),
  paymentMethod: fc.constantFrom("UPI_MANUAL", "COD"),
  status: fc.constantFrom(
    "UNDER_VERIFICATION",
    "VERIFIED",
    "REJECTED",
    "PROCESSING",
    "SHIPPED",
    "DELIVERED",
    "CANCELLED",
    "REFUNDED"
  ),
  createdAt: fc.date({
    min: new Date("2024-01-01"),
    max: new Date("2026-12-31"),
  }),
  items: fc.array(csvOrderItemArb, { minLength: 1, maxLength: 5 }),
});

const orderListArb = fc.array(csvOrderArb, { minLength: 1, maxLength: 10 });

// --- Helpers ---

function formatItemsExpected(items: CsvOrderItem[]): string {
  return items
    .map((item) => `${item.name} (${item.size} x${item.quantity})`)
    .join("; ");
}

// --- Property Tests ---

describe("CSV Export Round-Trip - Property Tests", () => {
  // Feature: website-improvements, Property 14: CSV export round-trip
  describe("Property 14: CSV export round-trip", () => {
    /**
     * Validates: Requirements 6.2, 6.3, 6.6
     */
    it("parsed CSV records match original order data for all columns", () => {
      fc.assert(
        fc.property(orderListArb, (orders) => {
          const csv = ordersToCsv(orders);
          const records = parseCsv(csv);

          expect(records.length).toBe(orders.length);

          for (let i = 0; i < orders.length; i++) {
            const order = orders[i];
            const record = records[i];

            expect(record["orderCode"]).toBe(order.orderCode);
            expect(record["customerName"]).toBe(order.address?.fullName ?? "");
            expect(record["phone"]).toBe(order.address?.phone ?? "");
            expect(record["email"]).toBe(order.address?.email ?? "");
            expect(record["amount"]).toBe(String(order.amount));
            expect(record["discount"]).toBe(String(order.discount));
            expect(record["paymentMethod"]).toBe(order.paymentMethod);
            expect(record["status"]).toBe(order.status);

            const expectedCreatedAt =
              order.createdAt instanceof Date
                ? order.createdAt.toISOString()
                : order.createdAt;
            expect(record["createdAt"]).toBe(expectedCreatedAt);

            expect(record["items"]).toBe(formatItemsExpected(order.items));
          }
        }),
        { numRuns: 100 }
      );
    });

    it("empty order list produces header-only CSV", () => {
      const csv = ordersToCsv([]);
      const lines = csv.trim().split("\n");
      expect(lines.length).toBe(1);
      expect(lines[0]).toBe(
        "orderCode,customerName,phone,email,amount,discount,paymentMethod,status,createdAt,items"
      );
    });
  });
});
