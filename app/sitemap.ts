import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    { url: "/", lastModified: new Date(), changeFrequency: "weekly", priority: 1 },
    { url: "/race", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "/stadium", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "/fashion", lastModified: new Date(), changeFrequency: "monthly", priority: 0.8 },
    { url: "/learn", lastModified: new Date(), changeFrequency: "monthly", priority: 0.7 },
    { url: "/rewards", lastModified: new Date(), changeFrequency: "monthly", priority: 0.5 },
    { url: "/settings", lastModified: new Date(), changeFrequency: "monthly", priority: 0.3 },
  ];
}
