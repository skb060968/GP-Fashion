
import { describe, it, expect } from "vitest";
import * as fc from "fast-check";
import { getAllProducts, type Product } from "@/lib/data/categories";
import {
  generateBreadcrumbJsonLd,
  generateOrganizationJsonLd,
  generateProductJsonLd,
  serializeJsonLd,
} from "@/lib/seo/jsonld";

const SITE_URL = process.env.SITE_URL || "https://gpfashion.in";

const baseProduct: Product = {
  ...getAllProducts()[0],
  slug: "test-dress",
  name: "Test Dress",
  category: "womenswear",
  classification: "dresses-gowns",
  collection: null,
  releaseDate: "2026-01-01",
  description: "Silk crepe\n\nBias cut",
  price: 1250000,
  hsn: "6204",
  sizes: ["S", "M"],
  bestseller: false,
  order: 1,
  images: ["/images/shop/test/1.webp", "/images/shop/test/2.webp"],
  coverImage: "/images/shop/test/1.webp",
  coverThumbnail: "/images/shop/test/1-thumb.webp",
  colors: [
    {
      slug: "black",
      name: "Black",
      hex: "#000000",
      images: ["/images/shop/test/black-1.webp", "/images/shop/test/2.webp"],
      coverImage: "/images/shop/test/black-1.webp",
      coverThumbnail: "/images/shop/test/black-1-thumb.webp",
    },
  ],
  defaultColor: "black",
  pattern: null,
};

describe("Product JSON-LD", () => {
  it("builds a full schema.org Product", () => {
    const jsonLd = generateProductJsonLd(baseProduct);
    const url = `${SITE_URL}/shop/test-dress`;

    expect(jsonLd["@context"]).toBe("https://schema.org");
    expect(jsonLd["@type"]).toBe("Product");
    expect(jsonLd.name).toBe("Test Dress");
    expect(jsonLd.description).toBe("Silk crepe · Bias cut");
    expect(jsonLd.image).toEqual([
      `${SITE_URL}/images/shop/test/1.webp`,
      `${SITE_URL}/images/shop/test/2.webp`,
      `${SITE_URL}/images/shop/test/black-1.webp`,
    ]);
    expect(jsonLd.sku).toBe("test-dress");
    expect(jsonLd.brand).toEqual({ "@type": "Brand", name: "Piyush Bholla" });
    expect(jsonLd.category).toBe("Womenswear > Dresses & Gowns");
    expect(jsonLd.url).toBe(url);
    expect(jsonLd.offers).toEqual({
      "@type": "Offer",
      url,
      price: 12500,
      priceCurrency: "INR",
      availability: "https://schema.org/InStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: "Piyush Bholla" },
    });
  });

  it("marks a sold-out product as out of stock", () => {
    expect(generateProductJsonLd({ ...baseProduct, soldOut: true }).offers.availability).toBe("https://schema.org/OutOfStock");
    expect(generateProductJsonLd({ ...baseProduct, soldOut: false }).offers.availability).toBe("https://schema.org/InStock");
  });

  it("has absolute, unique images and a category for every catalogue product", () => {
    for (const product of getAllProducts()) {
      const jsonLd = generateProductJsonLd(product);
      expect(jsonLd.image.length).toBeGreaterThan(0);
      expect(new Set(jsonLd.image).size).toBe(jsonLd.image.length);
      for (const image of jsonLd.image) expect(image.startsWith(`${SITE_URL}/`)).toBe(true);
      expect(jsonLd.category).toMatch(/^\S.* > \S/);
      expect(jsonLd.offers.price).toBe(product.price / 100);
    }
  });

  it("keeps name and price for any input (property-based)", () => {
    fc.assert(
      fc.property(fc.string({ minLength: 1 }), fc.integer({ min: 1 }), (name, price) => {
        const jsonLd = generateProductJsonLd({ ...baseProduct, name, price });
        expect(jsonLd.name).toBe(name);
        expect(jsonLd.offers.price).toBe(price / 100);
      }),
      { numRuns: 100 },
    );
  });
});

describe("Breadcrumb JSON-LD", () => {
  it("numbers the items and makes the paths absolute", () => {
    const jsonLd = generateBreadcrumbJsonLd([
      { name: "Home", path: "/" },
      { name: "Womenswear", path: "/womenswear" },
    ]);
    expect(jsonLd["@type"]).toBe("BreadcrumbList");
    expect(jsonLd.itemListElement).toEqual([
      { "@type": "ListItem", position: 1, name: "Home", item: `${SITE_URL}/` },
      { "@type": "ListItem", position: 2, name: "Womenswear", item: `${SITE_URL}/womenswear` },
    ]);
  });
});

describe("Organization JSON-LD", () => {
  it("has name, url, logo and sameAs", () => {
    const jsonLd = generateOrganizationJsonLd();
    expect(jsonLd["@type"]).toBe("Organization");
    expect(jsonLd.name).toBe("Piyush Bholla");
    expect(jsonLd.url).toBe(SITE_URL);
    expect(jsonLd.logo).toBe(`${SITE_URL}/images/brand/logo-mark.png`);
    expect(jsonLd.sameAs).toEqual(["https://www.instagram.com/piyushbholla.label"]);
  });
});

describe("serializeJsonLd", () => {
  it("escapes < so a string cannot close the script tag (property-based)", () => {
    fc.assert(
      fc.property(fc.string(), (value) => {
        const name = `${value}</script><script>`;
        const out = serializeJsonLd({ name });
        expect(out).not.toContain("<");
        expect(JSON.parse(out).name).toBe(name);
      }),
      { numRuns: 100 },
    );
  });
});
