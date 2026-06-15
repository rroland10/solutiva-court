import type { MetadataRoute } from "next";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "https://solutivacourt.com";
const apiUrl = process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000";

const staticPaths = ["/", "/dashboard", "/disputes", "/jury", "/profile"];

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  const staticEntries: MetadataRoute.Sitemap = staticPaths.map((path) => ({
    url: `${siteUrl}${path === "/" ? "" : path}`,
    lastModified: now,
    changeFrequency: path === "/" || path === "/disputes" ? "daily" : "weekly",
    priority: path === "/" ? 1 : 0.8,
  }));

  let disputeEntries: MetadataRoute.Sitemap = [];

  try {
    const res = await fetch(`${apiUrl}/api/disputes`, {
      next: { revalidate: 3600 },
    });

    if (res.ok) {
      const disputes = (await res.json()) as { id: string; updatedAt?: string }[];
      disputeEntries = disputes.map((dispute) => ({
        url: `${siteUrl}/disputes/${dispute.id}`,
        lastModified: dispute.updatedAt ? new Date(dispute.updatedAt) : now,
        changeFrequency: "weekly",
        priority: 0.6,
      }));
    }
  } catch {
    // API unavailable at build time — static entries only
  }

  return [...staticEntries, ...disputeEntries];
}
