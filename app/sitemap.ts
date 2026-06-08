import type { MetadataRoute } from "next";
import { listGameSlugs } from "@/lib/games";

export const dynamic = "force-static";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const slugs = await listGameSlugs();
  const gameUrls = slugs.map((slug) => ({
    url: `https://promptarcade.vercel.app/game/${slug}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.8,
  }));

  return [
    {
      url: "https://promptarcade.vercel.app",
      lastModified: new Date(),
      changeFrequency: "daily" as const,
      priority: 1.0,
    },
    ...gameUrls,
  ];
}
