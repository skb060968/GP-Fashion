"use client";

import { useState, FormEvent } from "react";

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

interface CouponFormProps {
  coupon?: Coupon;
  onClose: () => void;
  onSaved: () => void;
}

interface FieldErrors {
  [key: string]: string;
}

function toDateInputValue(iso: string | null): string {
  if (!iso) return "";
  try {
    return new Date(iso).toISOString().split("T")[0];
  } catch {
    return "";
  }
}

export default function CouponForm({ coupon, onClose, onSaved }: CouponFormProps) {
  const isEdit = !!coupon;

  const [code, setCode] = useState(coupon?.code ?? "");
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">(
    coupon?.discountType ?? "PERCENTAGE"
  );
  const [discountValue, setDiscountValue] = useState(
    coupon?.discountValue?.toString() ?? ""
  );
  const [minOrderAmount, setMinOrderAmount] = useState(
    coupon?.minOrderAmount != null ? coupon.minOrderAmount.toString() : ""
  );
  const [maxUses, setMaxUses] = useState(
    coupon?.maxUses != null ? coupon.maxUses.toString() : ""
  );
  const [expiresAt, setExpiresAt] = useState(toDateInputValue(coupon?.expiresAt ?? null));

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  function validate(): FieldErrors {
    const errors: FieldErrors = {};

    // Code validation
    const trimmedCode = code.trim();
    if (!trimmedCode) {
      errors.code = "Code is required";
    } else if (!/^[A-Z0-9-]+$/.test(trimmedCode)) {
      errors.code = "Code must contain only uppercase letters, numbers, and hyphens";
    }

    // Discount value validation
    const dv = Number(discountValue);
    if (!discountValue || isNaN(dv) || !Number.isInteger(dv) || dv < 1) {
      errors.discountValue = "Discount value must be a positive integer";
    } else if (discountType === "PERCENTAGE" && (dv < 1 || dv > 100)) {
      errors.discountValue = "Percentage discount must be between 1 and 100";
    }

    // Min order amount validation (optional)
    if (minOrderAmount !== "") {
      const moa = Number(minOrderAmount);
      if (isNaN(moa) || !Number.isInteger(moa) || moa < 0) {
        errors.minOrderAmount = "Minimum order amount must be a non-negative integer";
      }
    }

    // Max uses validation (optional)
    if (maxUses !== "") {
      const mu = Number(maxUses);
      if (isNaN(mu) || !Number.isInteger(mu) || mu < 1) {
        errors.maxUses = "Max uses must be a positive integer";
      }
    }

    return errors;
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setFieldErrors({});
    setGeneralError(null);

    const errors = validate();
    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      return;
    }

    const body: Record<string, unknown> = {
      code: code.trim(),
      discountType,
      discountValue: Number(discountValue),
      minOrderAmount: minOrderAmount !== "" ? Number(minOrderAmount) : null,
      maxUses: maxUses !== "" ? Number(maxUses) : null,
      expiresAt: expiresAt ? new Date(expiresAt + "T23:59:59.999Z").toISOString() : null,
    };

    setSubmitting(true);
    try {
      const url = isEdit
        ? `/api/admin/coupons/${coupon.id}`
        : "/api/admin/coupons";
      const method = isEdit ? "PATCH" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => null);
        if (res.status === 400 && data?.fieldErrors) {
          setFieldErrors(data.fieldErrors);
          return;
        }
        throw new Error(data?.error || `Failed to ${isEdit ? "update" : "create"} coupon`);
      }

      onSaved();
    } catch (err) {
      setGeneralError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white rounded-lg shadow-xl p-6 max-w-md w-full mx-4 max-h-[90vh] overflow-y-auto">
        <h2 className="text-lg font-semibold mb-4">
          {isEdit ? "Edit Coupon" : "Create Coupon"}
        </h2>

        {generalError && (
          <div className="mb-4 p-3 rounded-md bg-red-50 border border-red-200 text-red-700 text-sm">
            {generalError}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Code */}
          <div>
            <label htmlFor="coupon-code" className="block text-sm font-medium text-gray-700 mb-1">
              Code
            </label>
            <input
              id="coupon-code"
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. SUMMER-2024"
              className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fashion-gold ${
                fieldErrors.code ? "border-red-400" : "border-stone-300"
              }`}
            />
            {fieldErrors.code && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.code}</p>
            )}
          </div>

          {/* Discount Type */}
          <div>
            <label htmlFor="discount-type" className="block text-sm font-medium text-gray-700 mb-1">
              Discount Type
            </label>
            <select
              id="discount-type"
              value={discountType}
              onChange={(e) => setDiscountType(e.target.value as "PERCENTAGE" | "FIXED")}
              className="w-full border border-stone-300 rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fashion-gold"
            >
              <option value="PERCENTAGE">Percentage</option>
              <option value="FIXED">Fixed Amount</option>
            </select>
          </div>

          {/* Discount Value */}
          <div>
            <label htmlFor="discount-value" className="block text-sm font-medium text-gray-700 mb-1">
              Discount Value {discountType === "PERCENTAGE" ? "(1–100%)" : "(in paise)"}
            </label>
            <input
              id="discount-value"
              type="number"
              value={discountValue}
              onChange={(e) => setDiscountValue(e.target.value)}
              placeholder={discountType === "PERCENTAGE" ? "e.g. 15" : "e.g. 50000"}
              min="1"
              step="1"
              className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fashion-gold ${
                fieldErrors.discountValue ? "border-red-400" : "border-stone-300"
              }`}
            />
            {fieldErrors.discountValue && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.discountValue}</p>
            )}
          </div>

          {/* Min Order Amount */}
          <div>
            <label htmlFor="min-order" className="block text-sm font-medium text-gray-700 mb-1">
              Min Order Amount <span className="text-gray-400">(optional, in paise)</span>
            </label>
            <input
              id="min-order"
              type="number"
              value={minOrderAmount}
              onChange={(e) => setMinOrderAmount(e.target.value)}
              placeholder="e.g. 100000"
              min="0"
              step="1"
              className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fashion-gold ${
                fieldErrors.minOrderAmount ? "border-red-400" : "border-stone-300"
              }`}
            />
            {fieldErrors.minOrderAmount && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.minOrderAmount}</p>
            )}
          </div>

          {/* Max Uses */}
          <div>
            <label htmlFor="max-uses" className="block text-sm font-medium text-gray-700 mb-1">
              Max Uses <span className="text-gray-400">(optional)</span>
            </label>
            <input
              id="max-uses"
              type="number"
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="e.g. 100"
              min="1"
              step="1"
              className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fashion-gold ${
                fieldErrors.maxUses ? "border-red-400" : "border-stone-300"
              }`}
            />
            {fieldErrors.maxUses && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.maxUses}</p>
            )}
          </div>

          {/* Expiration Date */}
          <div>
            <label htmlFor="expires-at" className="block text-sm font-medium text-gray-700 mb-1">
              Expiration Date <span className="text-gray-400">(optional)</span>
            </label>
            <input
              id="expires-at"
              type="date"
              value={expiresAt}
              onChange={(e) => setExpiresAt(e.target.value)}
              className={`w-full border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-fashion-gold ${
                fieldErrors.expiresAt ? "border-red-400" : "border-stone-300"
              }`}
            />
            {fieldErrors.expiresAt && (
              <p className="mt-1 text-xs text-red-600">{fieldErrors.expiresAt}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="px-4 py-2 text-sm rounded-md border border-stone-300 hover:bg-stone-100 transition disabled:opacity-40"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-4 py-2 text-sm rounded-md bg-stone-800 text-white hover:bg-stone-700 transition disabled:opacity-40"
            >
              {submitting ? "Saving…" : isEdit ? "Update" : "Create"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
