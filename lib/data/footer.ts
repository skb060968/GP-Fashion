// lib/data/footer.ts
// SINGLE SOURCE OF TRUTH — FOOTER CONTENT

export const footer = {
  quickLinksHeading: "Quick Links",
  // Mirrors the navbar menu. Extend as revamped pages come online.
  quickLinks: [
    { label: "Menswear", href: "/#menswear" },
    { label: "Womenswear", href: "/#womenswear" },
    { label: "About Us", href: "/#about-us" },
    { label: "Contact", href: "/contact" },
    { label: "Track Order", href: "/track-order" },
    { label: "My Account", href: "/account" },
  ],

  servicesHeading: "Services Offered",
  servicesList: [
    {
      label: "Creative Design",
      href: "/services#creative-design",
    },
    {
      label: "Technical Design",
      href: "/services#technical-design",
    },
    {
      label: "Production & Sourcing",
      href: "/services#production-sourcing",
    },
    {
      label: "Styling & Personal Services",
      href: "/services#styling-personal-services",
    },
    {
      label: "Consulting & Brand Development",
      href: "/services#consulting-brand-development",
    },
    {
      label: "Specialized Services",
      href: "/services#specialized-services",
    },
  ],
}
