import { button, escapeHtml, heading, paragraph, shell, siteUrl } from "./layout"

export function backInStockEmail(product: { name: string; slug: string; coverImage: string }) {
  const site = siteUrl()
  const url = `${site}/shop/${product.slug}`
  const html = shell({
    preheader: `${product.name} is available to order again.`,
    sections: [
      heading("It's back") +
        paragraph(`<strong>${escapeHtml(product.name)}</strong>, which you asked us about, is available to order again.`),
      `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" style="display:block;text-decoration:none;">
        <img src="${escapeHtml(site + product.coverImage)}" width="280" alt="${escapeHtml(product.name)}" style="display:block;margin:0 auto;width:280px;max-width:100%;height:auto;border:0;outline:none;">
      </a>`,
      button("Shop now", url),
      paragraph(
        "You are receiving this one-time email because you asked to be told when this piece was back. We have now removed your request, so you will not hear from us about it again.",
        { muted: true }
      ),
    ],
  })
  return { subject: `${product.name} is back | Piyush Bholla`, html }
}
