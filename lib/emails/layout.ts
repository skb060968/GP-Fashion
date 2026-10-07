

import { formatRupees } from "@/lib/money"
import { formatDateDDMMYYYY } from "@/lib/date"
import { paymentLabel, statusLabel } from "@/lib/orders/labels"
import type { OrderEmailData } from "@/lib/types/OrderEmailData"

export const BRAND = {
  name: "PIYUSH BHOLLA",
  legalName: "Piyush Bholla Label",
  location: "Delhi, India",
  email: "piyushbholla@gmail.com",
  phone: "+91 9821818352",
  instagram: "https://www.instagram.com/piyushbholla.label",
}

export function siteUrl(): string {
  const raw = process.env.SITE_URL || "https://gpfashion.in"
  try {
    return new URL(raw).origin
  } catch {
    return raw.replace(/\/+$/, "")
  }
}

const FONT = "Georgia, 'Times New Roman', serif"
const SANS = "Helvetica, Arial, sans-serif"
const INK = "#000000"
const MUTED = "#666666"
const FAINT = "#999999"
const RULE = "#e5e5e5"
const BG = "#f5f5f4"

export function escapeHtml(s: string | number | null | undefined): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
}

export function heading(text: string) {
  return `<h1 style="margin:0 0 12px;font:700 22px/1.3 ${FONT};letter-spacing:2px;text-transform:uppercase;color:${INK};">${escapeHtml(text)}</h1>`
}

export function paragraph(html: string, opts: { muted?: boolean } = {}) {
  return `<p style="margin:0 0 14px;font:400 15px/1.6 ${SANS};color:${opts.muted ? MUTED : "#333333"};">${html}</p>`
}

export function label(text: string) {
  return `<p style="margin:0 0 6px;font:700 10px/1.4 ${SANS};letter-spacing:2px;text-transform:uppercase;color:${FAINT};">${escapeHtml(text)}</p>`
}

export function rule() {
  return `<tr><td style="padding:0;"><div style="height:1px;background:${RULE};line-height:1px;font-size:0;">&nbsp;</div></td></tr>`
}

export function spacer(px: number) {
  return `<tr><td style="height:${px}px;line-height:${px}px;font-size:0;">&nbsp;</td></tr>`
}

export function button(text: string, href: string, variant: "solid" | "outline" = "solid") {
  const solid = variant === "solid"
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 auto;">
      <tr>
        <td align="center" bgcolor="${solid ? INK : "#ffffff"}" style="border-radius:999px;border:1px solid ${INK};">
          <a href="${href}" target="_blank"
             style="display:inline-block;padding:13px 32px;font:700 12px/1 ${SANS};letter-spacing:2px;text-transform:uppercase;text-decoration:none;color:${solid ? "#ffffff" : INK};border-radius:999px;">
            ${escapeHtml(text)}
          </a>
        </td>
      </tr>
    </table>`
}

export function orderNumber(code: string) {
  return `
    ${label("Order number")}
    <p style="margin:0;font:700 28px/1.2 ${FONT};letter-spacing:6px;color:${INK};">${escapeHtml(code)}</p>`
}

export function facts(items: { k: string; v: string }[]) {
  const cells = items
    .map(
      (f) => `
      <td valign="top" style="padding:0 12px 0 0;">
        ${label(f.k)}
        <p style="margin:0;font:400 14px/1.5 ${SANS};color:${INK};">${escapeHtml(f.v)}</p>
      </td>`
    )
    .join("")
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0"><tr>${cells}</tr></table>`
}

export function address(c: OrderEmailData["customer"], title = "Shipping to") {
  const line2 = c.addressLine2 ? `, ${escapeHtml(c.addressLine2)}` : ""
  return `
    ${label(title)}
    <p style="margin:0;font:400 14px/1.6 ${SANS};color:#333333;">
      <strong style="color:${INK};">${escapeHtml(c.fullName)}</strong><br>
      ${escapeHtml(c.addressLine1)}${line2}<br>
      ${escapeHtml(c.city)}, ${escapeHtml(c.state)} ${escapeHtml(c.pincode)}<br>
      <span style="color:${MUTED};">${escapeHtml(c.phone)}${c.email ? ` &middot; ${escapeHtml(c.email)}` : ""}</span>
    </p>`
}

export function itemsTable(order: OrderEmailData) {
  const rows = order.items
    .map(
      (it) => `
      <tr>
        <td style="padding:12px 0;border-bottom:1px solid ${RULE};font:400 14px/1.4 ${SANS};color:${INK};">
          <strong>${escapeHtml(it.name)}</strong><br>
          <span style="color:${MUTED};font-size:12px;">Size ${escapeHtml(it.size)} &middot; Qty ${it.quantity}</span>
        </td>
        <td align="right" valign="top" style="padding:12px 0;border-bottom:1px solid ${RULE};font:400 14px/1.4 ${SANS};color:${INK};white-space:nowrap;">
          ${formatRupees(it.price * it.quantity)}
        </td>
      </tr>`
    )
    .join("")

  const subtotal = order.amount + (order.discount ?? 0)
  const totalRow = (k: string, v: string, strong = false) => `
    <tr>
      <td style="padding:6px 0 0;font:${strong ? "700" : "400"} ${strong ? "13px" : "14px"}/1.4 ${SANS};${strong ? "letter-spacing:2px;text-transform:uppercase;" : ""}color:${strong ? INK : MUTED};">${k}</td>
      <td align="right" style="padding:6px 0 0;font:${strong ? "700" : "400"} ${strong ? "16px" : "14px"}/1.4 ${SANS};color:${INK};white-space:nowrap;">${v}</td>
    </tr>`

  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${RULE};">
      ${rows}
      <tr><td colspan="2" style="height:10px;line-height:10px;font-size:0;">&nbsp;</td></tr>
      ${totalRow("Subtotal", formatRupees(subtotal))}
      ${order.discount ? totalRow("Discount", `&minus;${formatRupees(order.discount)}`) : ""}
      ${totalRow("Shipping", "Complimentary")}
      <tr><td colspan="2" style="padding-top:10px;"><div style="height:1px;background:${RULE};line-height:1px;font-size:0;">&nbsp;</div></td></tr>
      ${totalRow("Total", formatRupees(order.amount), true)}
    </table>`
}

export function orderFacts(order: OrderEmailData) {
  return facts([
    { k: "Status", v: statusLabel(order.status) },
    { k: "Payment", v: paymentLabel(order.paymentMethod) },
    { k: "Placed on", v: formatDateDDMMYYYY(order.createdAt) },
  ])
}

export function shell(opts: { preheader: string; sections: string[]; footerNote?: string }) {
  const site = siteUrl()
  const body = opts.sections
    .map((s) => `<tr><td style="padding:0 40px;">${s}</td></tr>`)
    .join(spacer(28))

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <meta name="x-apple-disable-message-reformatting">
  <title>${escapeHtml(BRAND.name)}</title>
</head>
<body style="margin:0;padding:0;background:${BG};">

  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:${BG};">${escapeHtml(opts.preheader)}</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BG};">
    <tr>
      <td align="center" style="padding:32px 12px;">
        <table role="presentation" width="600" cellpadding="0" cellspacing="0" border="0" style="width:600px;max-width:100%;background:#ffffff;">

          <tr>
            <td align="center" style="padding:36px 40px 28px;">
              <a href="${site}" target="_blank" style="text-decoration:none;color:${INK};">
                <img src="${site}/images/brand/logo-mark.png" width="40" height="60" alt="" style="display:block;margin:0 auto 10px;border:0;outline:none;height:60px;width:auto;">
                <span style="font:700 14px/1 ${FONT};letter-spacing:5px;text-transform:uppercase;color:${INK};">${escapeHtml(BRAND.name)}</span>
              </a>
            </td>
          </tr>
          ${rule()}
          ${spacer(32)}

          ${body}

          ${spacer(36)}
          ${rule()}

          <tr>
            <td align="center" style="padding:24px 40px 32px;">
              ${opts.footerNote ? `<p style="margin:0 0 14px;font:400 12px/1.6 ${SANS};color:${MUTED};">${opts.footerNote}</p>` : ""}
              <p style="margin:0 0 6px;font:400 12px/1.6 ${SANS};color:${FAINT};">
                <a href="${site}" style="color:${FAINT};text-decoration:none;">${escapeHtml(site.replace(/^https?:\/\//, ""))}</a>
                &nbsp;&middot;&nbsp;
                <a href="${BRAND.instagram}" style="color:${FAINT};text-decoration:none;">Instagram</a>
                &nbsp;&middot;&nbsp;
                <a href="mailto:${BRAND.email}" style="color:${FAINT};text-decoration:none;">${BRAND.email}</a>
              </p>
              <p style="margin:0;font:400 11px/1.6 ${SANS};color:${FAINT};">&copy; ${new Date().getFullYear()} ${escapeHtml(BRAND.legalName)}. ${escapeHtml(BRAND.location)}.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`
}
