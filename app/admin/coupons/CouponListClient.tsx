"use client";

import { useState, useEffect, useCallback } from "react";
import CouponForm from "./CouponForm";

interface Coupon {
  id: string;
  code: string;
  discountType: "PERCENTAGE" | "FIXED";
  discountValue: number;
  minOrderAmount: number | null;
  maxUses: number | null;
  currentUses: number;
  expiresAt: string | null;
  isActive: boolean;
  createdAt: string;
}

interface CouponsResponse {
  coupons: Coupon[];
  totalCount: number;
  page: number;
  pageSize: number;
  totalPages: number;
}

const STATUS_OPTIONS = ["All", "Active", "Inactive"] as const;

function formatMoney(paise: number): string {
  return `₹${(paise / 100).toLocaleString("en-IN")}`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    timeZone: "Asia/Kolkata",
  });
}

export default function CouponListClient() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal state
  const [showForm, setShowForm] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState<Coupon | undefined>(undefined);

  // Delete confirmation state
  const [deletingCoupon, setDeletingCoupon] = useState<Coupon | null>(null);

  const fetchCoupons = useCallback(async (p: number, s: string, st: string) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      params.set("page", String(p));
      if (s) params.set("search", s);
      if (st !== "All") params.set("status", st);

      const res = await fetch(`/api/admin/coupons?${params.toString()}`);
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to fetch coupons");
      }
      const data: CouponsResponse = await res.json();
      setCoupons(data.coupons);
      setTotalPages(data.totalPages);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }, []);

  // Fetch when page or status changes immediately
  useEffect(() => {
    fetchCoupons(page, search, status);
  }, [page, status]); // eslint-disable-line react-hooks/exhaustive-deps

  // Debounce search input
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(1);
      fetchCoupons(1, search, status);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleToggle = async (coupon: Coupon) => {
    const previousActive = coupon.isActive;
    // Optimistic update
    setCoupons((prev) =>
      prev.map((c) => (c.id === coupon.id ? { ...c, isActive: !c.isActive } : c))
    );
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}/toggle`, {
        method: "PATCH",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to toggle coupon");
      }
      const data = await res.json();
      setCoupons((prev) =>
        prev.map((c) => (c.id === coupon.id ? data.coupon : c))
      );
    } catch (err) {
      // Rollback optimistic update
      setCoupons((prev) =>
        prev.map((c) =>
          c.id === coupon.id ? { ...c, isActive: previousActive } : c
        )
      );
      setError(err instanceof Error ? err.message : "Failed to toggle coupon");
    }
  };

  const handleDelete = async (coupon: Coupon) => {
    try {
      const res = await fetch(`/api/admin/coupons/${coupon.id}`, {
        method: "DELETE",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error || "Failed to delete coupon");
      }
      setCoupons((prev) => prev.filter((c) => c.id !== coupon.id));
      setDeletingCoupon(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete coupon");
      setDeletingCoupon(null);
    }
  };

  const openCreate = () => {
    setEditingCoupon(undefined);
    setShowForm(true);
  };

  const openEdit = (coupon: Coupon) => {
    setEditingCoupon(coupon);
    setShowForm(true);
  };

  const handleFormClose = () => {
    setShowForm(false);
    setEditingCoupon(undefined);
  };

  const handleFormSaved = () => {
    setShowForm(false);
    setEditingCoupon(undefined);
    fetchCoupons(page, search, status);
  };

  return (
    <section className="pt-28 px-6 max-w-6xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-3xl font-serif font-bold">Coupons</h1>
      </div>

      {/* Error banner */}
      {error && (
        <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm flex items-center justify-between">
          <span>{error}</span>
          <button
            onClick={() => setError(null)}
            className="ml-4 text-red-500 hover:text-red-700"
            aria-label="Dismiss error"
          >
            ✕
          </button>
        </div>
      )}

      {/* Controls: search, status filter, create button */}
      <div className="flex flex-wrap items-center gap-4 mb-6">
        <input
          type="text"
          placeholder="Search coupon code…"
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
          {STATUS_OPTIONS.map((s) => (
            <option key={s} value={s}>
              {s === "All" ? "All Statuses" : s}
            </option>
          ))}
        </select>

        <button
          onClick={openCreate}
          className="ml-auto px-4 py-2 text-sm rounded-md bg-stone-800 text-white hover:bg-stone-700 transition"
        >
          Create Coupon
        </button>
      </div>

      {/* Coupons table */}
      <div className="bg-white rounded-xl shadow overflow-x-auto">
        <table className="w-full text-left">
          <thead className="bg-stone-100 text-sm">
            <tr>
              <th className="p-4">Code</th>
              <th className="p-4">Type</th>
              <th className="p-4">Value</th>
              <th className="p-4">Min Order</th>
              <th className="p-4">Max Uses</th>
              <th className="p-4">Used</th>
              <th className="p-4">Expires</th>
              <th className="p-4">Status</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={9} className="p-6 text-center text-gray-500">
                  Loading…
                </td>
              </tr>
            ) : (
              coupons.map((coupon) => (
                <tr key={coupon.id} className="border-t hover:bg-stone-50">
                  <td className="p-4 font-mono text-sm">{coupon.code}</td>
                  <td className="p-4 text-sm">{coupon.discountType}</td>
                  <td className="p-4 text-sm">
                    {coupon.discountType === "PERCENTAGE"
                      ? `${coupon.discountValue}%`
                      : formatMoney(coupon.discountValue)}
                  </td>
                  <td className="p-4 text-sm">
                    {coupon.minOrderAmount != null
                      ? formatMoney(coupon.minOrderAmount)
                      : "—"}
                  </td>
                  <td className="p-4 text-sm">
                    {coupon.maxUses != null ? coupon.maxUses : "—"}
                  </td>
                  <td className="p-4 text-sm">{coupon.currentUses}</td>
                  <td className="p-4 text-sm text-gray-600">
                    {coupon.expiresAt ? formatDate(coupon.expiresAt) : "—"}
                  </td>
                  <td className="p-4">
                    <span
                      className={`px-2 py-1 rounded text-xs font-semibold ${
                        coupon.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-200 text-gray-600"
                      }`}
                    >
                      {coupon.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => openEdit(coupon)}
                        className="text-sm text-blue-600 hover:underline"
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleToggle(coupon)}
                        className="text-sm text-amber-600 hover:underline"
                      >
                        {coupon.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => setDeletingCoupon(coupon)}
                        className="text-sm text-red-600 hover:underline"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {!loading && coupons.length === 0 && (
          <p className="p-6 text-center text-gray-500">No coupons found</p>
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

      {/* Delete confirmation dialog */}
      {deletingCoupon && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
            <h2 className="text-lg font-semibold mb-2">Delete Coupon</h2>
            <p className="text-sm text-gray-600 mb-4">
              Are you sure you want to delete coupon{" "}
              <span className="font-mono font-semibold">{deletingCoupon.code}</span>?
              This action cannot be undone.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => setDeletingCoupon(null)}
                className="px-4 py-2 text-sm rounded-md border border-stone-300 hover:bg-stone-100 transition"
              >
                Cancel
              </button>
              <button
                onClick={() => handleDelete(deletingCoupon)}
                className="px-4 py-2 text-sm rounded-md bg-red-600 text-white hover:bg-red-700 transition"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Coupon form modal */}
      {showForm && (
        <CouponForm
          coupon={editingCoupon}
          onClose={handleFormClose}
          onSaved={handleFormSaved}
        />
      )}
    </section>
  );
}
