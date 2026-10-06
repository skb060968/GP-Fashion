// lib/data/index.ts

import { siteInfo } from "./siteInfo"
import { services } from "./services"
import { servicesPage } from "./servicesPage"
import { footer } from "./footer"
import { contact } from "./contact"
import { faq } from "./faq"
import { products as shop } from "./shop"

/**
 * Central content object used by pages/components.
 *   import { content } from "@/lib/data"
 */
export const content = {
  siteInfo,
  services,
  servicesPage,
  footer,
  contact,
  faq,
  shop,
}

export { siteInfo, services, servicesPage, footer, contact, faq, shop }
