import { MetadataRoute } from "next";
import { getAllProducts } from "@/lib/data/categories";

const BASE_URL = process.env.SITE_URL || "https://gpfashion.in";

export const STATIC_PATHS: { path: string; changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"]; priority: number }[] = [
  { path: "", changeFrequency: "weekly", priority: 1.0 },
  { path: "/menswear", changeFrequency: "weekly", priority: 0.9 },
  { path: "/womenswear", changeFrequency: "weekly", priority: 0.9 },
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

  const productPages: MetadataRoute.Sitemap = getAllProducts().map((d) => ({
    url: `${BASE_URL}/shop/${d.slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [...staticPages, ...productPages];
}
