import {
  ACTIVE_CATEGORY_SLUGS,
  categoryMeta,
  getAllProducts,
  getCategoryImage,
  getCategoryViews,
  getCollections,
} from "@/lib/data/categories"
import { policies } from "@/lib/data/policies"

const SITE_URL = process.env.SITE_URL || "https://gpfashion.in"
const BRAND = "Piyush Bholla"
const DEFAULT_IMAGE = `${SITE_URL}/images/hero/poster.jpg`

export interface PageMetadata {
  path: string
  title: string
  description: string
  ogTitle: string
  ogDescription: string
  ogImage: string
  ogUrl: string
}

const page = (path: string, title: string, description: string, image = DEFAULT_IMAGE): PageMetadata => ({
  path,
  title,
  description,
  ogTitle: title,
  ogDescription: description,
  ogImage: image,
  ogUrl: `${SITE_URL}${path === "/" ? "" : path}`,
})

export function getAllPageMetadata(): PageMetadata[] {
  const pages: PageMetadata[] = [
    page("/", `${BRAND} | Contemporary Designer Label`, "Bold, sensual, expressive dressing. Western silhouettes in dialogue with Indian craftsmanship."),
    ...ACTIVE_CATEGORY_SLUGS.map((category) => {
      const meta = categoryMeta[category]
      return page(`/${category}`, `${meta.title} | ${BRAND}`, meta.description, `${SITE_URL}${getCategoryImage(category)}`)
    }),
    page("/collections", `Collections | ${BRAND}`, "Every release from PIYUSH BHOLLA LABEL, newest first."),
    page("/shop", `All Pieces | ${BRAND}`, "Search every piece from Piyush Bholla by name, size and price."),
    page("/services", `Services | ${BRAND}`, "Ready-to-wear, made to measure, bespoke commissions, alterations and private appointments in Delhi."),
    page("/contact", `Contact | ${BRAND}`, "Contact the studio about orders, sizing, fittings, bespoke commissions and collaborations."),
    page("/track-order", `Track Order | ${BRAND}`, "Check the status of your order with your order number and mobile number."),
    ...policies.map((policy) => page(`/policies/${policy.slug}`, `${policy.title} | ${BRAND}`, policy.description)),
  ]

  for (const category of ACTIVE_CATEGORY_SLUGS) {
    const meta = categoryMeta[category]
    for (const view of getCategoryViews(category)) {
      pages.push(page(`/${category}/${view.slug}`, `${view.title} · ${meta.title} | ${BRAND}`, `${view.title} for ${meta.title.toLowerCase()} by ${BRAND}.`, `${SITE_URL}${getCategoryImage(category)}`))
    }
  }

  for (const collection of getCollections()) {
    pages.push(page(`/collections/${collection.slug}`, `${collection.name} | ${BRAND}`, collection.description || `The ${collection.name} collection by ${BRAND}.`, `${SITE_URL}${collection.coverImage}`))
  }

  for (const product of getAllProducts()) {
    const description = product.description || `${product.name} by ${BRAND}. ₹${(product.price / 100).toLocaleString("en-IN")}.`
    pages.push(page(`/shop/${product.slug}`, `${product.name} | ${BRAND}`, description, `${SITE_URL}${product.coverImage}`))
  }

  return pages
}
