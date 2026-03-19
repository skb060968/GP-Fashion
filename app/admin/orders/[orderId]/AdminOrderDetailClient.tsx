"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { formatRupees } from "@/lib/money";
import { formatDateDDMMYYYY } from "@/lib/date";

interface OrderItem {
  id: string;
  name: string;
  slug: string;
  size: string;
  price: number;
  thumbnail: string;
  quantity: number;
}

interface Address {
  id: string;
  fullName: string;
  phone: string;
  addressLine1: string;
  addressLine2?: string;
  city: string;
  state: string;
  pincode: string;
}

interface StatusHistory {
  id: string;
  status: string;
  changedAt: string;
}

interface Order {
  orderCode: string;
  amount: number;
  discount?: number;
  couponCode?: string | null;
  paymentMethod: string;
  status: string;
  createdAt: string;
  address?: Address;
  items: OrderItem[];
  history?: StatusHistory[];
}

function StatusBadge({ status }: { status: string }) {
  const colors: Record<string, string> = {
    UNDER_VERIFICATION: "bg-yellow-200 text-yellow-800",
    VERIFIED: "bg-green-200 text-green-800",
    REJECTED: "bg-red-200 text-red-800",
    PROCESSING: "bg-blue-200 text-blue-800",
    SHIPPED: "bg-purple-200 text-purple-800",
    DELIVERED: "bg-green-300 text-green-900",
    CANCELLED: "bg-gray-300 text-gray-800",
    REFUNDED: "bg-pink-200 text-pink-800",
  };

  const style = colors[status] || "bg-gray-200 text-gray-800";

  return (
    <span className={`px-2 py-1 rounded text-xs font-semibold ${style}`}>
      {status}
    </span>
  );
}

export default function AdminOrderDetailPage() {
  const params = useParams();
  const orderCode =
    typeof params?.orderId === "string" ? params.orderId : "";

  const [order, setOrder] = useState<Order | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string>("");
  const [updating, setUpdating] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  useEffect(() => {
    if (!orderCode) return;

    async function fetchOrder() {
      const res = await fetch(`/api/admin/orders/${orderCode}`);
      if (res.ok) {
        const data = await res.json();
        setOrder(data);
        setSelectedStatus(data.status);
      }
    }

    fetchOrder();
  }, [orderCode]);

  async function handleUpdateStatus() {
    if (!orderCode || !selectedStatus || selectedStatus === order?.status) return;
    setUpdating(true);
    setStatusError(null);

    try {
      const res = await fetch(`/api/admin/orders/${orderCode}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selectedStatus }),
      });

      if (res.ok) {
        const updated = await res.json();
        setOrder(updated);
        setSelectedStatus(updated.status);
      } else {
        setStatusError("Failed to update status. Please try again.");
        setSelectedStatus(order?.status ?? "");
      }
    } catch {
      setStatusError("Network error. Please try again.");
      setSelectedStatus(order?.status ?? "");
    } finally {
      setUpdating(false);
    }
  }

  const subtotal = order ? order.amount + (order.discount ?? 0) : 0;
  const discountAmount = order?.discount ?? 0;

  return (
    <div className="pt-28 max-w-3xl mx-auto px-6 pb-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Order Details</h1>
          <p className="text-sm text-gray-500 mt-1">
            Order Code:{" "}
            <span className="font-semibold text-black">
              {order?.orderCode ?? orderCode}
            </span>
          </p>
        </div>
      </div>

      {!order && <div>Loading order details...</div>}

      {order && (
        <>
          {/* Status */}
          <div className="space-y-3">
            <div className="flex items-center space-x-4">
              <span className="font-medium">Current Status:</span>
              <StatusBadge status={order.status} />
            </div>
            <div className="flex items-center gap-3">
              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                disabled={updating}
                className="border rounded px-2 py-1"
              >
                <option value="UNDER_VERIFICATION">Under Verification</option>
                <option value="VERIFIED">Verified</option>
                <option value="REJECTED">Rejected</option>
                <option value="PROCESSING">Processing</option>
                <option value="SHIPPED">Shipped</option>
                <option value="DELIVERED">Delivered</option>
                <option value="CANCELLED">Cancelled</option>
                <option value="REFUNDED">Refunded</option>
              </select>
              <button
                onClick={handleUpdateStatus}
                disabled={updating || selectedStatus === order.status}
                className="px-4 py-1 text-sm rounded-md bg-stone-800 text-white hover:bg-stone-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {updating ? "Updating…" : "Update Status"}
              </button>
            </div>
            {statusError && (
              <p className="text-sm text-red-600">{statusError}</p>
            )}
          </div>

          {/* Payment */}
          <div className="border rounded-lg p-4">
            <h2 className="font-semibold mb-2">Payment</h2>
            <p>Method: {order.paymentMethod}</p>
            <p>Subtotal: {formatRupees(subtotal)}</p>
            {discountAmount > 0 && (
              <p>
                Discount: -{formatRupees(discountAmount)}
                {order.couponCode && (
                  <span className="text-sm text-gray-500 ml-1">({order.couponCode})</span>
                )}
              </p>
            )}
            <p className="font-bold">
              Amount Paid: {formatRupees(order.amount)}
            </p>
          </div>

          {/* Address */}
          {order.address && (
            <div className="border rounded-lg p-4">
              <h2 className="font-semibold mb-2">Shipping Address</h2>
              <p>{order.address.fullName}</p>
              <p>{order.address.phone}</p>
              <p>{order.address.addressLine1}</p>
              {order.address.addressLine2 && (
                <p>{order.address.addressLine2}</p>
              )}
              <p>
                {order.address.city}, {order.address.state} -{" "}
                {order.address.pincode}
              </p>
            </div>
          )}

          {/* Items */}
          <div className="border rounded-lg p-4">
            <h2 className="font-semibold mb-2">Items</h2>
            <ul className="space-y-2">
              {order.items.map((item) => (
                <li
                  key={item.id}
                  className="grid grid-cols-4 gap-4 border rounded px-3 py-2 text-sm"
                >
                  <div>{item.name}</div>
                  <div>Size: {item.size}</div>
                  <div>Qty: {item.quantity}</div>
                  <div className="text-right">
                    Price: {formatRupees(item.price)}
                  </div>
                </li>
              ))}
            </ul>
          </div>

          {/* History */}
          {order.history && order.history.length > 0 && (
            <div className="border rounded-lg p-4">
              <h2 className="font-semibold mb-2">Status History</h2>
              <ul className="space-y-2">
                {[...order.history]
                  .sort(
                    (a, b) =>
                      new Date(b.changedAt).getTime() -
                      new Date(a.changedAt).getTime()
                  )
                  .map((event) => (
                    <li key={event.id} className="flex justify-between text-sm">
                      <StatusBadge status={event.status} />
                      <span className="text-gray-600">
                        {formatDateDDMMYYYY(event.changedAt)}
                      </span>
                    </li>
                  ))}
              </ul>
            </div>
          )}

          {/* Back */}
          <div className="pt-6">
            <Link
              href="/admin"
              className="inline-block px-6 py-3 rounded-md border border-stone-300 bg-white hover:bg-stone-100 text-sm font-medium text-fashion-gold transition"
            >
              ← Back to Admin Dashboard
            </Link>
          </div>
        </>
      )}
    </div>
  );
}
