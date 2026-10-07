"use client"

import { useState, type FormEvent } from "react"
import { Check } from "lucide-react"
import { Alert, Dialog, btn, input } from "@/components/admin/ui"
import { adminFetch, AdminApiError } from "@/lib/admin/fetch"
import type { Coupon } from "./types"

interface CouponFormProps {
  coupon?: Coupon
  onClose: () => void
  onSaved: (coupon: Coupon) => void
}

type FieldErrors = Record<string, string>

function toDateInput(iso: string | null): string {
  if (!iso) return ""
  return new Date(iso).toLocaleDateString("en-CA", { timeZone: "Asia/Kolkata" })
}

function endOfDayIST(date: string): string {
  return new Date(`${date}T23:59:59.999+05:30`).toISOString()
}

const paiseToRupeeInput = (paise: number | null | undefined) => (paise == null ? "" : String(paise / 100))
const rupeeInputToPaise = (v: string) => Math.round(Number(v) * 100)

export default function CouponForm({ coupon, onClose, onSaved }: CouponFormProps) {
  const isEdit = Boolean(coupon)

  const [code, setCode] = useState(coupon?.code ?? "")
  const [discountType, setDiscountType] = useState<"PERCENTAGE" | "FIXED">(coupon?.discountType ?? "PERCENTAGE")
  const [discountValue, setDiscountValue] = useState(
    coupon ? (coupon.discountType === "PERCENTAGE" ? String(coupon.discountValue) : paiseToRupeeInput(coupon.discountValue)) : ""
  )
  const [minOrder, setMinOrder] = useState(paiseToRupeeInput(coupon?.minOrderAmount))
  const [maxUses, setMaxUses] = useState(coupon?.maxUses != null ? String(coupon.maxUses) : "")
  const [expiresAt, setExpiresAt] = useState(toDateInput(coupon?.expiresAt ?? null))
  const [isActive, setIsActive] = useState(coupon?.isActive ?? true)

  const [errors, setErrors] = useState<FieldErrors>({})
  const [generalError, setGeneralError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const switchType = (t: "PERCENTAGE" | "FIXED") => {
    setDiscountType(t)
    setDiscountValue("")
    setErrors((e) => ({ ...e, discountValue: "" }))
  }

  function validate(): FieldErrors {
    const e: FieldErrors = {}
    const c = code.trim()
    if (!c) e.code = "Enter a code."
    else if (!/^[A-Z0-9-]+$/.test(c)) e.code = "Use capital letters, numbers and hyphens only."

    const dv = Number(discountValue)
    if (discountValue === "" || Number.isNaN(dv) || dv <= 0) e.discountValue = "Enter a value above 0."
    else if (discountType === "PERCENTAGE" && (!Number.isInteger(dv) || dv > 100)) e.discountValue = "Whole number between 1 and 100."

    if (minOrder !== "") {
      const m = Number(minOrder)
      if (Number.isNaN(m) || m < 0) e.minOrderAmount = "Enter 0 or more."
    }
    if (maxUses !== "") {
      const u = Number(maxUses)
      if (!Number.isInteger(u) || u < 1) e.maxUses = "Whole number, 1 or more."
      else if (coupon && u < coupon.currentUses) e.maxUses = `Already used ${coupon.currentUses} times.`
    }
    return e
  }

  async function handleSubmit(ev: FormEvent) {
    ev.preventDefault()
    setGeneralError(null)
    const e = validate()
    setErrors(e)
    if (Object.values(e).some(Boolean)) return

    const body = {
      code: code.trim(),
      discountType,
      discountValue: discountType === "PERCENTAGE" ? Number(discountValue) : rupeeInputToPaise(discountValue),
      minOrderAmount: minOrder !== "" ? rupeeInputToPaise(minOrder) : null,
      maxUses: maxUses !== "" ? Number(maxUses) : null,
      expiresAt: expiresAt ? endOfDayIST(expiresAt) : null,
      isActive,
    }

    setSubmitting(true)
    try {
      const url = isEdit ? `/api/admin/coupons/${coupon!.id}` : "/api/admin/coupons"
      const res = await fetch(url, { method: isEdit ? "PATCH" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) })
      if (res.status === 401) {
        window.location.href = `/admin-login?next=${encodeURIComponent("/admin/coupons")}&expired=1`
        return
      }
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        if (data?.fieldErrors) setErrors(data.fieldErrors)
        setGeneralError(data?.fieldErrors ? null : data?.error || "Could not save the coupon.")
        return
      }
      onSaved(data.coupon)
    } catch (err) {
      setGeneralError(err instanceof AdminApiError ? err.message : "Could not save the coupon. Check your connection.")
    } finally {
      setSubmitting(false)
    }
  }

  const field = (label: string, name: string, control: React.ReactNode, hint?: string) => (
    <div>
      <label htmlFor={`coupon-${name}`} className="block font-jost text-xs font-semibold uppercase tracking-[0.15em] text-black/60">
        {label}
      </label>
      <div className="mt-1.5">{control}</div>
      {errors[name] ? (
        <p className="mt-1 font-jost text-xs text-red-600">{errors[name]}</p>
      ) : hint ? (
        <p className="mt-1 font-jost text-xs text-black/45">{hint}</p>
      ) : null}
    </div>
  )
  const cls = (name: string) => `${input} w-full ${errors[name] ? "!border-red-500 focus:!ring-red-500" : ""}`

  return (
    <Dialog
      open
      onClose={() => !submitting && onClose()}
      title={isEdit ? `Edit ${coupon!.code}` : "New coupon"}
      footer={
        <>
          <button type="button" onClick={onClose} disabled={submitting} className={btn.secondary}>
            Cancel
          </button>
          <button type="submit" form="coupon-form" disabled={submitting} className={btn.primary}>
            {submitting ? "Saving…" : isEdit ? "Save changes" : "Create coupon"}
          </button>
        </>
      }
    >
      <form id="coupon-form" onSubmit={handleSubmit} noValidate className="space-y-5">
        {generalError && <Alert onDismiss={() => setGeneralError(null)}>{generalError}</Alert>}

        {field(
          "Code",
          "code",
          <input
            id="coupon-code"
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase().replace(/\s+/g, "-"))}
            placeholder="FESTIVE-25"
            autoComplete="off"
            className={`${cls("code")} font-mono tracking-wider`}
          />,
          "What the customer types at checkout."
        )}

        <div>
          <span className="block font-jost text-xs font-semibold uppercase tracking-[0.15em] text-black/60">Discount</span>
          <div role="radiogroup" className="mt-1.5 grid grid-cols-2 gap-2">
            {(["PERCENTAGE", "FIXED"] as const).map((t) => (
              <button
                key={t}
                type="button"
                role="radio"
                aria-checked={discountType === t}
                onClick={() => switchType(t)}
                className={`rounded-md border px-3 py-2 font-jost text-sm transition-colors ${
                  discountType === t ? "border-black bg-black text-white" : "border-black/15 text-black/70 hover:border-black"
                }`}
              >
                {t === "PERCENTAGE" ? "Percentage" : "Fixed amount"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-4">
          {field(
            discountType === "PERCENTAGE" ? "Percent off" : "Amount off",
            "discountValue",
            <div className="relative">
              {discountType === "FIXED" && <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-jost text-sm text-black/50">₹</span>}
              <input
                id="coupon-discountValue"
                type="number"
                inputMode="decimal"
                min={discountType === "PERCENTAGE" ? 1 : 0.01}
                max={discountType === "PERCENTAGE" ? 100 : undefined}
                step={discountType === "PERCENTAGE" ? 1 : 0.01}
                value={discountValue}
                onChange={(e) => setDiscountValue(e.target.value)}
                placeholder={discountType === "PERCENTAGE" ? "15" : "500"}
                className={`${cls("discountValue")} ${discountType === "FIXED" ? "pl-7" : ""}`}
              />
              {discountType === "PERCENTAGE" && <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 font-jost text-sm text-black/50">%</span>}
            </div>
          )}
          {field(
            "Minimum order",
            "minOrderAmount",
            <div className="relative">
              <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 font-jost text-sm text-black/50">₹</span>
              <input
                id="coupon-minOrderAmount"
                type="number"
                inputMode="decimal"
                min={0}
                step={1}
                value={minOrder}
                onChange={(e) => setMinOrder(e.target.value)}
                placeholder="None"
                className={`${cls("minOrderAmount")} pl-7`}
              />
            </div>,
            "Optional"
          )}
        </div>

        <div className="grid grid-cols-2 gap-4">
          {field(
            "Usage limit",
            "maxUses",
            <input
              id="coupon-maxUses"
              type="number"
              inputMode="numeric"
              min={1}
              step={1}
              value={maxUses}
              onChange={(e) => setMaxUses(e.target.value)}
              placeholder="Unlimited"
              className={cls("maxUses")}
            />,
            coupon ? `Used ${coupon.currentUses} ${coupon.currentUses === 1 ? "time" : "times"} so far` : "Optional"
          )}
          {field(
            "Expires",
            "expiresAt",
            <input id="coupon-expiresAt" type="date" value={expiresAt} onChange={(e) => setExpiresAt(e.target.value)} className={cls("expiresAt")} />,
            "Optional · valid until the end of that day"
          )}
        </div>

        <label className="flex cursor-pointer items-start gap-3 rounded-md border border-black/10 p-3">
          <span className="relative mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center">
            <input
              type="checkbox"
              checked={isActive}
              onChange={(e) => setIsActive(e.target.checked)}
              className="peer h-4 w-4 cursor-pointer appearance-none rounded border border-black/30 checked:border-black checked:bg-black focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-black focus-visible:ring-offset-2"
            />
            <Check className="pointer-events-none absolute h-3 w-3 text-white opacity-0 peer-checked:opacity-100" strokeWidth={3} aria-hidden />
          </span>
          <span className="font-jost text-sm">
            <span className="font-medium">Active</span>
            <span className="mt-0.5 block text-xs text-black/55">Customers can apply this code. Untick to pause it without deleting.</span>
          </span>
        </label>
      </form>
    </Dialog>
  )
}
