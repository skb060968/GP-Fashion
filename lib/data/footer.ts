// lib/data/footer.ts
// SINGLE SOURCE OF TRUTH — FOOTER CONTENT

export const footer = {
  quickLinksHeading: "Quick Links",
  // Mirrors the navbar menu. Extend as revamped pages come online.
  quickLinks: [
    { label: "Menswear", href: "/menswear" },
    { label: "Womenswear", href: "/womenswear" },
    { label: "Collections", href: "/collections" },
    { label: "About Us", href: "/#about-us" },
    { label: "Contact", href: "/contact" },
    { label: "Track Order", href: "/track-order" },
    { label: "My Account", href: "/account" },
  ],

  // Shown in the bottom bar next to the copyright. Slugs match lib/data/policies.ts
  policyLinks: [
    { label: "Shipping & Returns", href: "/policies/shipping-returns" },
    { label: "Terms", href: "/policies/terms" },
    { label: "Privacy", href: "/policies/privacy" },
  ],

  servicesHeading: "Services",
  // Anchors match the slugs in lib/data/services.ts
  servicesList: [
    { label: "Ready-to-Wear", href: "/services#ready-to-wear" },
    { label: "Made to Measure", href: "/services#made-to-measure" },
    { label: "Bespoke Commissions", href: "/services#bespoke" },
    { label: "Alterations & Aftercare", href: "/services#alterations-aftercare" },
    { label: "Private Appointments", href: "/services#appointments" },
    { label: "Collaborations & Stockists", href: "/services#collaborations" },
  ],
}
