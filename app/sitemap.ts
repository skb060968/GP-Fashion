import { MetadataRoute } from "next";
import { CATEGORY_SLUGS, getAllProducts, getCategoryViews, getCollections } from "@/lib/data/categories";

const BASE_URL = process.env.SITE_URL || "https://gpfashion.in";

export const STATIC_PATHS: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "", changeFrequency: "weekly", priority: 1.0 },
  { path: "/menswear", changeFrequency: "weekly", priority: 0.9 },
  { path: "/womenswear", changeFrequency: "weekly", priority: 0.9 },
  { path: "/collections", changeFrequency: "monthly", priority: 0.8 },
  { path: "/shop", changeFrequency: "weekly", priority: 0.8 },
  { path: "/services", changeFrequency: "monthly", priority: 0.6 },
  { path: "/contact", changeFrequency: "monthly", priority: 0.6 },
  { path: "/track-order", changeFrequency: "monthly", priority: 0.4 },
];

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date().toISOString();

  const staticPages: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => ({
    url: `${BASE_URL}${p.path}`,
    lastModified: now,
    changeFrequency: p.changeFrequency,
    priority: p.priority,
  }));

  const viewPages: MetadataRoute.Sitemap = categoryViewPaths().map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.7,
  }));

  const collectionPages: MetadataRoute.Sitemap = getCollections().map((c) => ({
    url: `${BASE_URL}/collections/${c.slug}`,
    lastModified: now,
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const productPages: MetadataRoute.Sitemap = getAllProducts().map((d) => ({
    url: `${BASE_URL}/shop/${d.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...viewPages, ...collectionPages, ...productPages];
}

/** /menswear/new-arrivals, /menswear/<classification>, /menswear/bestsellers, and the same for womenswear. */
export function categoryViewPaths(): string[] {
  return CATEGORY_SLUGS.flatMap((c) => getCategoryViews(c).map((v) => `/${c}/${v.slug}`));
}
