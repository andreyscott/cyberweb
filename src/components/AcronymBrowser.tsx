"use client";

import { useMemo, useState } from "react";
import { DOMAINS } from "@/data/taxonomy";
import type { Acronym, DomainId } from "@/data/types";
import { AcronymCard } from "./AcronymCard";

// Defined here rather than imported from lib/content so the full dataset isn't bundled twice.
const LETTERS = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
const firstLetter = (a: Acronym) => {
  const c = a.acronym.toUpperCase().replace(/[^A-Z0-9]/g, "")[0] ?? "#";
  return /[A-Z]/.test(c) ? c : "#";
};

/**
 * A–Z list with domain filters. The page itself is static; filtering happens in
 * the browser so the URL stays cacheable (no searchParams on the server).
 */
export function AcronymBrowser({ items }: { items: Acronym[] }) {
  const [domain, setDomain] = useState<DomainId | null>(null);
  const shown = useMemo(() => (domain ? items.filter((a) => a.domains.includes(domain)) : items), [items, domain]);
  const groups = useMemo(() => {
    const m = new Map<string, Acronym[]>();
    for (const a of shown) m.set(firstLetter(a), [...(m.get(firstLetter(a)) ?? []), a]);
    return m;
  }, [shown]);

  return (
    <>
      <div className="filters" role="group" aria-label="Filter by domain">
        <button type="button" className="chip" aria-pressed={domain === null} onClick={() => setDomain(null)}>All</button>
        {DOMAINS.map((d) => (
          <button key={d.id} type="button" className="chip" aria-pressed={domain === d.id} onClick={() => setDomain(domain === d.id ? null : d.id)}>
            {d.short}
          </button>
        ))}
      </div>
      <p className="muted" aria-live="polite" style={{ marginTop: 12, fontSize: 14 }}>{shown.length} acronyms</p>

      <nav className="letter-bar" aria-label="Jump to letter">
        {LETTERS.map((l) => (groups.has(l) ? <a key={l} href={`#letter-${l}`}>{l}</a> : <span key={l} aria-hidden="true">{l}</span>))}
      </nav>

      {[...groups.entries()].map(([letter, list]) => (
        <section key={letter} id={`letter-${letter}`} className="letter-group" aria-label={`Letter ${letter}`}>
          <h2>{letter}</h2>
          <div className="grid grid-3">
            {list.map((a) => <AcronymCard key={a.slug} a={a} />)}
          </div>
        </section>
      ))}
      {!shown.length && <p className="empty">No acronyms in this domain yet.</p>}
    </>
  );
}
