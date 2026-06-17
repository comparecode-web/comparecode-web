import type { MetadataRoute } from "next";
import { absoluteUrl } from "@/config/seo";

export default function sitemap(): MetadataRoute.Sitemap {
  const lastModified = new Date();

  return [
    {
      url: absoluteUrl("/"),
      lastModified,
      changeFrequency: "weekly",
      priority: 1
    },
    {
      url: absoluteUrl("/text"),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.9
    },
    {
      url: absoluteUrl("/image"),
      lastModified,
      changeFrequency: "weekly",
      priority: 0.8
    }
  ];
}
