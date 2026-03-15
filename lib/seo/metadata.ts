/**
 * Centralized registry of all public page metadata.
 * Used by property tests to verify uniqueness and completeness.
 */

import { dresses } from "@/lib/data/shop";
import { collections } from "@/lib/data/collections";
import { journalPosts } from "@/lib/data/journal";

const SITE_URL = process.env.SITE_URL || "https://gpfashion.in";

export interface PageMetadata {
  path: string;
  title: string;
  description: string;
  ogTitle: string;
  ogDescription: string;
  ogImage: string;
  ogUrl: string;
}

export function getAllPageMetadata(): PageMetadata[] {
  const pages: PageMetadata[] = [
    // Static pages
    {
      path: "/",
      title: "GP Fashion | Premium Designer Wear",
      description:
        "Discover premium designer wear crafted with intention, texture, and timeless silhouettes.",
      ogTitle: "GP Fashion | Premium Designer Wear",
      ogDescription:
        "Discover premium designer wear crafted with intention, texture, and timeless silhouettes.",
      ogImage: `${SITE_URL}/images/hero/poster.jpg`,
      ogUrl: SITE_URL,
    },
    {
      path: "/shop",
      title: "Shop | GP Fashion",
      description:
        "Browse our curated collection of premium designer garments crafted with intention, texture, and timeless silhouettes.",
      ogTitle: "Shop | GP Fashion",
      ogDescription:
        "Browse our curated collection of premium designer garments crafted with intention, texture, and timeless silhouettes.",
      ogImage: `${SITE_URL}/images/hero/poster.jpg`,
      ogUrl: `${SITE_URL}/shop`,
    },
    {
      path: "/collections",
      title: "Collections | GP Fashion",
      description:
        "Explore curated collections celebrating craftsmanship, innovation, and timeless elegance.",
      ogTitle: "Collections | GP Fashion",
      ogDescription:
        "Explore curated collections celebrating craftsmanship, innovation, and timeless elegance.",
      ogImage: `${SITE_URL}/images/hero/poster.jpg`,
      ogUrl: `${SITE_URL}/collections`,
    },
    {
      path: "/about",
      title: "About | GP Fashion",
      description:
        "Learn about GP Fashion — where heritage meets innovation in premium designer wear.",
      ogTitle: "About | GP Fashion",
      ogDescription:
        "Learn about GP Fashion — where heritage meets innovation in premium designer wear.",
      ogImage: `${SITE_URL}/images/about/piyush1.jpg`,
      ogUrl: `${SITE_URL}/about`,
    },
    {
      path: "/services",
      title: "Services | GP Fashion",
      description:
        "Explore our design services — from creative and technical design to production, styling, and brand consulting.",
      ogTitle: "Services | GP Fashion",
      ogDescription:
        "Explore our design services — from creative and technical design to production, styling, and brand consulting.",
      ogImage: `${SITE_URL}/images/hero/poster.jpg`,
      ogUrl: `${SITE_URL}/services`,
    },
    {
      path: "/journal",
      title: "Journal | GP Fashion",
      description:
        "Design insights, creative process, and inspiration from the GP Fashion studio.",
      ogTitle: "Journal | GP Fashion",
      ogDescription:
        "Design insights, creative process, and inspiration from the GP Fashion studio.",
      ogImage: `${SITE_URL}/images/hero/poster.jpg`,
      ogUrl: `${SITE_URL}/journal`,
    },
    {
      path: "/contact",
      title: "Contact | GP Fashion",
      description:
        "Get in touch with GP Fashion for custom designs, collaborations, or inquiries.",
      ogTitle: "Contact | GP Fashion",
      ogDescription:
        "Get in touch with GP Fashion for custom designs, collaborations, or inquiries.",
      ogImage: `${SITE_URL}/images/hero/poster.jpg`,
      ogUrl: `${SITE_URL}/contact`,
    },
    {
      path: "/track-order",
      title: "Track Order | GP Fashion",
      description:
        "Track your GP Fashion order status using your order code and phone number.",
      ogTitle: "Track Order | GP Fashion",
      ogDescription:
        "Track your GP Fashion order status using your order code and phone number.",
      ogImage: `${SITE_URL}/images/hero/poster.jpg`,
      ogUrl: `${SITE_URL}/track-order`,
    },
  ];

  // Dynamic product pages
  for (const dress of dresses) {
    const description = dress.description
      ? dress.description
      : `Shop ${dress.name} at GP Fashion. Premium designer wear starting at ₹${(dress.price / 100).toLocaleString("en-IN")}.`;
    pages.push({
      path: `/shop/${dress.slug}`,
      title: `${dress.name} | GP Fashion`,
      description,
      ogTitle: `${dress.name} | GP Fashion`,
      ogDescription: description,
      ogImage: `${SITE_URL}${dress.coverImage}`,
      ogUrl: `${SITE_URL}/shop/${dress.slug}`,
    });
  }

  // Dynamic collection pages
  for (const collection of collections) {
    pages.push({
      path: `/collections/${collection.slug}`,
      title: `${collection.name} | GP Fashion`,
      description: collection.description,
      ogTitle: `${collection.name} | GP Fashion`,
      ogDescription: collection.description,
      ogImage: `${SITE_URL}${collection.coverImage}`,
      ogUrl: `${SITE_URL}/collections/${collection.slug}`,
    });
  }

  // Dynamic journal pages
  for (const post of journalPosts) {
    pages.push({
      path: `/journal/${post.slug}`,
      title: `${post.title} | GP Fashion`,
      description: post.excerpt,
      ogTitle: `${post.title} | GP Fashion`,
      ogDescription: post.excerpt,
      ogImage: `${SITE_URL}${post.coverImage}`,
      ogUrl: `${SITE_URL}/journal/${post.slug}`,
    });
  }

  return pages;
}
