import { ACRONYMS } from "@/data/acronyms";
import { DOMAINS, MODELS } from "@/data/taxonomy";
import type { Acronym, DomainId, ModelId } from "@/data/types";

/** Alphabetical by acronym, then by expansion, ignoring case and symbols. */
export const sortKey = (s: string) => s.toUpperCase().replace(/[^A-Z0-9]/g, "");

export const allAcronyms: Acronym[] = [...ACRONYMS].sort(
  (a, b) => sortKey(a.acronym).localeCompare(sortKey(b.acronym)) || a.expansion.localeCompare(b.expansion),
);

const bySlug = new Map(allAcronyms.map((a) => [a.slug, a]));

export const getAcronym = (slug: string) => bySlug.get(slug);

export const firstLetter = (a: Acronym) => {
  const c = sortKey(a.acronym)[0] ?? "#";
  return /[A-Z]/.test(c) ? c : "#";
};

export const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");

export function groupByLetter(list: Acronym[] = allAcronyms) {
  const groups = new Map<string, Acronym[]>();
  for (const a of list) {
    const l = firstLetter(a);
    groups.set(l, [...(groups.get(l) ?? []), a]);
  }
  return groups;
}

export const acronymsInDomain = (id: DomainId) => allAcronyms.filter((a) => a.domains.includes(id));
export const acronymsInModel = (id: ModelId) => allAcronyms.filter((a) => a.models?.includes(id));

/** Other entries written the same way, e.g. the three meanings of MAC. */
export const otherMeanings = (a: Acronym) =>
  allAcronyms.filter((x) => x.slug !== a.slug && sortKey(x.acronym) === sortKey(a.acronym));

export const relatedTo = (a: Acronym) =>
  (a.related ?? []).map(getAcronym).filter((x): x is Acronym => Boolean(x));

export const domainCounts = Object.fromEntries(
  DOMAINS.map((d) => [d.id, acronymsInDomain(d.id).length]),
) as Record<DomainId, number>;

export const modelCounts = Object.fromEntries(
  MODELS.map((m) => [m.id, acronymsInModel(m.id).length]),
) as Record<ModelId, number>;

export { summary } from "./text";
