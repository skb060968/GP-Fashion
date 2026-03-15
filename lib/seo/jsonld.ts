const SITE_URL = process.env.SITE_URL || "https://gpfashion.in";

export interface ProductJsonLdInput {
  name: string;
  coverImage: string;
  price: number; // in paise
}

export function generateProductJsonLd(product: ProductJsonLdInput) {
  return {
    "@context": "https://schema.org" as const,
    "@type": "Product" as const,
    name: product.name,
    image: `${SITE_URL}${product.coverImage}`,
    offers: {
      "@type": "Offer" as const,
      price: product.price / 100,
      priceCurrency: "INR" as const,
      availability: "https://schema.org/InStock" as const,
    },
  };
}
