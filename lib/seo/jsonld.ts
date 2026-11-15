import { categoryMeta, getClassification, type Product } from "@/lib/data/categories";
import { contact } from "@/lib/data/contact";

const SITE_URL = process.env.SITE_URL || "https://gpfashion.in";
const BRAND = "Piyush Bholla";

const absoluteUrl = (path: string) => `${SITE_URL}${path}`;

export function serializeJsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, "\\u003c");
}

export function generateProductJsonLd(product: Product) {
  const url = absoluteUrl(`/shop/${product.slug}`);
  const images = [
    product.coverImage,
    ...product.images,
    ...product.colors.flatMap((color) => [color.coverImage, ...color.images]),
  ].filter(Boolean);
  const classification = getClassification(product.classification);
  const category = [categoryMeta[product.category].title, classification?.title].filter(Boolean).join(" > ");

  return {
    "@context": "https://schema.org" as const,
    "@type": "Product" as const,
    name: product.name,
    description: product.description.split(/\n+/).map((line) => line.trim()).filter(Boolean).join(" · "),
    image: [...new Set(images)].map(absoluteUrl),
    sku: product.slug,
    brand: { "@type": "Brand" as const, name: BRAND },
    category,
    url,
    offers: {
      "@type": "Offer" as const,
      url,
      price: product.price / 100,
      priceCurrency: "INR" as const,
      availability: "https://schema.org/InStock" as const,
      itemCondition: "https://schema.org/NewCondition" as const,
      seller: { "@type": "Organization" as const, name: BRAND },
    },
  };
}

export function generateBreadcrumbJsonLd(items: { name: string; path: string }[]) {
  return {
    "@context": "https://schema.org" as const,
    "@type": "BreadcrumbList" as const,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem" as const,
      position: index + 1,
      name: item.name,
      item: absoluteUrl(item.path),
    })),
  };
}

export function generateOrganizationJsonLd() {
  return {
    "@context": "https://schema.org" as const,
    "@type": "Organization" as const,
    name: BRAND,
    url: SITE_URL,
    logo: absoluteUrl("/images/brand/logo-mark.png"),
    sameAs: [contact.instagram],
  };
}
