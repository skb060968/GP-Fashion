

import { CATEGORY_SLUGS, categoryMeta, getAllProducts, getCategoryViews, getCollections } from "@/lib/data/categories";
import { policies } from "@/lib/data/policies";

const SITE_URL = process.env.SITE_URL || "https://gpfashion.in";
const BRAND = "Piyush Bholla";
const DEFAULT_IMAGE = `${SITE_URL}/images/hero/poster.jpg`;

export interface PageMetadata {
  path: string;
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogUrl: string;
}

const page = (path: string, title: string, description: string, image = DEFAULT_IMAGE): PageMetadata => ({
  path,
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: image,
  ogUrl: `${SITE_URL}${path === "/" ? "" : path}`,
});

export function getAllPageMetadata(): PageMetadata[] {
  const pages: PageMetadata[] = [
    page("/", `${BRAND} | Contemporary Designer Label`, "Bold, sensual, expressive dressing. Western silhouettes in dialogue with Indian craftsmanship."),
    page("/menswear", `Menswear | ${BRAND}`, "Refined tailoring that balances tradition with contemporary style.", `${SITE_URL}/images/home/menswear.webp`),
    page("/womenswear", `Womenswear | ${BRAND}`, "Timeless silhouettes reimagined with a contemporary sensibility.", `${SITE_URL}/images/home/womenswear.webp`),
    page("/collections", `Collections | ${BRAND}`, "Every release from PIYUSH BHOLLA LABEL, newest first."),
    page("/shop", `All Pieces | ${BRAND}`, "Search every piece from Piyush Bholla by name, size and price."),
    page("/services", `Services | ${BRAND}`, "Ready-to-wear, made to measure, bespoke commissions, alterations and private appointments in Delhi."),
    page("/contact", `Contact | ${BRAND}`, "Contact the studio about orders, sizing, fittings, bespoke commissions and collaborations."),
    page("/track-order", `Track Order | ${BRAND}`, "Check the status of your order with your order number and mobile number."),
    ...policies.map((p) => page(`/policies/${p.slug}`, `${p.title} | ${BRAND}`, p.description)),
  ];

  for (const c of CATEGORY_SLUGS) {
    const meta = categoryMeta[c];
    for (const v of getCategoryViews(c)) {
      pages.push(page(`/${c}/${v.slug}`, `${v.title} · ${meta.title} | ${BRAND}`, `${v.title} for ${meta.title.toLowerCase()} by ${BRAND}.`, `${SITE_URL}${meta.image}`));
    }
  }

  for (const c of getCollections()) {
    pages.push(page(`/collections/${c.slug}`, `${c.name} | ${BRAND}`, c.description || `The ${c.name} collection by ${BRAND}.`, `${SITE_URL}${c.coverImage}`));
  }

  for (const p of getAllProducts()) {
    const description = p.description || `${p.name} by ${BRAND}. ₹${(p.price / 100).toLocaleString("en-IN")}.`;
    pages.push(page(`/shop/${p.slug}`, `${p.name} | ${BRAND}`, description, `${SITE_URL}${p.coverImage}`));
  }

  return pages;
}
