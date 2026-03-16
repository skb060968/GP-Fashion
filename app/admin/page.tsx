"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { formatRupees } from "@/lib/money";
import { formatDateDDMMYYYY } from "@/lib/date";
import StatusBadge from "@/components/StatusBadge";


const ORDER_STATUSES = [
  "All",
  "UNDER_VERIFICATION",
  "VERIFIED",
  "REJECTED",
  "PROCESSING",
  "SHIPPED",
  "DELIVERED",
  "CANCELLED",
  "REFUNDED",
] as const;

interface OrderSummary {
  orderCode: string;
  amount: number;
  discount: number | null;
  couponCode: string | null;
  status: string;
  createdAt: string;
}

interface OrdersResponse {
  orders: OrderSummary[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

export default function AdminPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [orders, setOrders] = useState<OrderSummary[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async (p: number, s: string, st: string) => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      params.set("page", String(p));
      if (s) params.set("search", s);
      if (st !== "All") params.set("status", st);

      const res = await fetch(`/api/admin/orders?${params.toString()}`);
      if (!res.ok) return;
      const data: OrdersResponse = await res.json();
      setOrders(data.orders);
      setTotalPages(data.totalPages);
    } catch {
      // network error — keep previous state
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch when page or status changes immediately
  useEffect(() => {
    fetchOrders(page, search, status);
  }, [page, status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchOrders(1, search, status);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleExport = () => {
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (status !== "All") params.set("status", status);
    window.open(`/api/admin/orders/export?${params.toString()}`);
  };

  return (
    <section className="pt-28 px-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-serif font-bold">Admin Orders</h1>
      </div>

      {/* Controls: search, status filter, export */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Search order code…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border border-stone-300 rounded-md px-3 py-2 text-sm w-64 focus:outline-none focus:ring-2 focus:ring-fashion-gold"
        />

        <select
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
          className="border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fashion-gold"
        >
          {ORDER_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s === "All" ? "All Statuses" : s}
            </option>
          ))}
        </select>

        <button
          onClick={handleExport}
          className="ml-auto px-4 py-2 text-sm rounded-md bg-stone-800 text-white hover:bg-stone-700 transition"
        >
          Export CSV
        </button>
      </div>

      {/* Orders table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-stone-100 text-sm">
            <tr>
              <th className="p-4">Order Code</th>
              <th className="p-4">Subtotal</th>
              <th className="p-4">Discount</th>
              <th className="p-4">Coupon</th>
              <th className="p-4">Amount Paid</th>
              <th className="p-4">Status</th>
              <th className="p-4">Date</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={7} className="p-6 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const subtotal = order.amount + (order.discount ?? 0);
                return (
                  <tr
                    key={order.orderCode}
                    className="border-t hover:bg-stone-50"
                  >
                    <td className="p-4">
                      <Link
                        href={`/admin/orders/${order.orderCode}`}
                        className="text-fashion-gold hover:underline"
                      >
                        {order.orderCode}
                      </Link>
                    </td>
                    <td className="p-4">{formatRupees(subtotal)}</td>
                    <td className="p-4">
                      {order.discount && order.discount > 0
                        ? `-${formatRupees(order.discount)}`
                        : "—"}
                    </td>
                    <td className="p-4 text-sm">
                      {order.couponCode ? (
                        <span className="font-mono text-xs bg-stone-100 px-2 py-1 rounded">{order.couponCode}</span>
                      ) : "—"}
                    </td>
                    <td className="p-4 font-semibold">
                      {formatRupees(order.amount)}
                    </td>
                    <td className="p-4">
                      <StatusBadge status={order.status} />
                    </td>
                    <td className="p-4 text-sm text-gray-600">
                      {formatDateDDMMYYYY(order.createdAt)}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>

        {!loading && orders.length === 0 && (
          <p className="p-6 text-center text-gray-500">No orders found</p>
        )}
      </div>

      {/* Pagination controls */}
      {totalPages > 0 && (
        <div className="flex items-center justify-center gap-4 mt-6">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-4 py-2 text-sm rounded-md border border-stone-300 hover:bg-stone-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Previous
          </button>
          <span className="text-sm text-gray-700">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-4 py-2 text-sm rounded-md border border-stone-300 hover:bg-stone-100 transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            Next
          </button>
        </div>
      )}
    </section>
  );
}
