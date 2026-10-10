import { ACTIVE_CATEGORY_SLUGS, categoryMeta } from "./categories"

export const footer = {
  quickLinksHeading: "Quick Links",

  quickLinks: [
    ...ACTIVE_CATEGORY_SLUGS.map((category) => ({ label: categoryMeta[category].title, href: `/${category}` })),
    { label: "Collections", href: "/collections" },
    { label: "About Us", href: "/#about-us" },
    { label: "Contact", href: "/contact" },
    { label: "Track Order", href: "/track-order" },
    { label: "My Account", href: "/account" },
  ],

  policyLinks: [
    { label: "Shipping & Returns", href: "/policies/shipping-returns" },
    { label: "Terms", href: "/policies/terms" },
    { label: "Privacy", href: "/policies/privacy" },
  ],

  servicesHeading: "Services",

  servicesList: [
    { label: "Ready-to-Wear", href: "/services#ready-to-wear" },
    { label: "Made to Measure", href: "/services#made-to-measure" },
    { label: "Bespoke Commissions", href: "/services#bespoke" },
    { label: "Alterations & Aftercare", href: "/services#alterations-aftercare" },
    { label: "Private Appointments", href: "/services#appointments" },
    { label: "Collaborations & Stockists", href: "/services#collaborations" },
  ],
}
