import Link from "next/link";
import { domainById } from "@/data/taxonomy";
import type { Acronym } from "@/data/types";
import { summary } from "@/lib/text";

export function AcronymCard({ a }: { a: Acronym }) {
  return (
    <Link href={`/acronyms/${a.slug}`} className="card acro-card">
      <span className="abbr">{a.acronym}</span>
      <span className="exp">{a.expansion}</span>
      <span className="sum">{summary(a, 110)}</span>
      <span className="tags">
        {a.domains.slice(0, 2).map((d) => <span key={d} className="tag">{domainById[d].short}</span>)}
      </span>
    </Link>
  );
}

export function DomainCard({ id, count, children }: { id: keyof typeof domainById; count: number; children?: React.ReactNode }) {
  const d = domainById[id];
  return (
    <Link href={`/domains/${d.id}`} className="card domain-card">
      <div className="top">
        <span className="glyph" aria-hidden="true">{d.glyph}</span>
        <h3>{d.name}</h3>
      </div>
      <p>{d.blurb}</p>
      <div className="meta">
        <span>{count} terms</span>
        {children}
      </div>
    </Link>
  );
}
