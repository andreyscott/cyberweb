import { allAcronyms } from "@/lib/content";
import { toSearchDoc } from "@/lib/search";

/** Built once at deploy time and served from the CDN. */
export const dynamic = "force-static";

export function GET() {
  return Response.json(allAcronyms.map(toSearchDoc));
}
