import type { MetadataRoute } from "next";
import { DOMAINS, MODELS } from "@/data/taxonomy";
import { allAcronyms } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

export default function sitemap(): MetadataRoute.Sitemap {
  const page = (path: string, priority = 0.6): MetadataRoute.Sitemap[number] => ({ url: `${SITE_URL}${path}`, priority });
  return [
    page("/", 1),
    page("/acronyms", 0.9),
    page("/quiz", 0.7),
    page("/flashcards", 0.7),
    ...DOMAINS.map((d) => page(`/domains/${d.id}`, 0.7)),
    ...MODELS.map((m) => page(`/models/${m.id}`, 0.6)),
    ...allAcronyms.map((a) => page(`/acronyms/${a.slug}`, 0.8)),
  ];
}
