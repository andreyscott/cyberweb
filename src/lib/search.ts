import type { Acronym } from "@/data/types";

/** One row of the search index: only short fields, so the index stays small. */
export interface SearchDoc {
  id: string; // slug
  acronym: string;
  expansion: string;
  aliases: string;
  domains: string;
  /** acronym with punctuation removed: "PCI DSS" -> "PCIDSS", "ATT&CK" -> "ATTCK" */
  compact: string;
}

export const compact = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

export const toSearchDoc = (a: Acronym): SearchDoc => ({
  id: a.slug,
  acronym: a.acronym,
  expansion: a.expansion,
  aliases: (a.aliases ?? []).join(" "),
  domains: a.domains.join(" "),
  compact: compact(a.acronym),
});

/** Shared MiniSearch config, used both when building and when loading the index. */
export const MINISEARCH_OPTIONS = {
  idField: "id",
  fields: ["acronym", "compact", "expansion", "aliases"],
  storeFields: ["acronym", "expansion", "domains"],
  searchOptions: {
    boost: { acronym: 4, compact: 4, aliases: 2, expansion: 1 },
    prefix: true,
    fuzzy: (term: string) => (term.length > 4 ? 0.2 : false),
  },
} as const;

/**
 * Exact acronym matches go first ("cia" shows both CIA entries before "CIS"),
 * then MiniSearch's own score order.
 */
export function rankResults<T extends { acronym: string; score: number }>(query: string, results: T[]): T[] {
  const q = compact(query);
  const exact = (r: T) => (compact(r.acronym) === q ? 1 : 0);
  return [...results].sort((a, b) => exact(b) - exact(a) || b.score - a.score);
}
