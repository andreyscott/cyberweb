import type { Acronym } from "@/data/types";

/** First sentence of the scope, trimmed: used on cards and in meta descriptions. Kept data-free so client bundles stay small. */
export const summary = (a: Pick<Acronym, "scope">, max = 150) => {
  const first = a.scope.split(/(?<=\.)\s/)[0] ?? a.scope;
  return first.length > max ? first.slice(0, max - 1).trimEnd() + "…" : first;
};
