import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { domainById, modelById } from "@/data/taxonomy";
import { allAcronyms, getAcronym, otherMeanings, relatedTo, summary } from "@/lib/content";
import { SITE_URL } from "@/lib/site";

type Props = { params: Promise<{ slug: string }> };

/** Every entry is pre-rendered at build time and served from the CDN. */
export const dynamicParams = false;
export function generateStaticParams() {
  return allAcronyms.map((a) => ({ slug: a.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = getAcronym((await params).slug);
  if (!a) return {};
  return {
    title: `${a.acronym}: ${a.expansion}`,
    description: `${a.acronym} stands for ${a.expansion}. ${summary(a, 140)}`,
    alternates: { canonical: `/acronyms/${a.slug}` },
  };
}

export default async function AcronymPage({ params }: Props) {
  const a = getAcronym((await params).slug);
  if (!a) notFound();
  const others = otherMeanings(a);
  const related = relatedTo(a).filter((r) => !others.includes(r));

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "DefinedTerm",
    name: a.acronym,
    alternateName: a.expansion,
    description: a.scope,
    url: `${SITE_URL}/acronyms/${a.slug}`,
    inDefinedTermSet: { "@type": "DefinedTermSet", name: "CyberSec cybersecurity acronyms", url: `${SITE_URL}/acronyms` },
  };

  return (
    <div className="container">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }} />
      <nav className="crumbs" aria-label="Breadcrumb">
        <Link href="/acronyms">Dictionary</Link><span aria-hidden="true">/</span>
        <Link href={`/domains/${a.domains[0]}`}>{domainById[a.domains[0]].short}</Link><span aria-hidden="true">/</span>
        <span aria-current="page">{a.acronym}</span>
      </nav>

      <article>
        <header className="card term-hero" data-ghost={a.acronym}>
          <h1>
            <span className="abbr">{a.acronym}</span>
            <span className="exp" style={{ display: "block" }}>{a.expansion}</span>
          </h1>
          <div className="tags">
            {a.domains.map((d) => <Link key={d} href={`/domains/${d}`} className="tag">{domainById[d].name}</Link>)}
            {a.models?.map((m) => <Link key={m} href={`/models/${m}`} className="tag green">{modelById[m].name}</Link>)}
            {a.aliases?.map((x) => <span key={x} className="tag amber">aka {x}</span>)}
          </div>
        </header>

        <div className="detail-grid">
          <div>
            {others.length > 0 && (
              <div className="callout" style={{ marginBottom: 14 }}>
                <b>{a.acronym} has {others.length + 1} meanings.</b>{" "}
                Also: {others.map((o, i) => (
                  <span key={o.slug}>{i > 0 && ", "}<Link href={`/acronyms/${o.slug}`} style={{ textDecoration: "underline" }}>{o.expansion}</Link></span>
                ))}. Check the context before you answer.
              </div>
            )}
            <section className="card prose-block">
              <h2>Meaning and scope</h2>
              <p>{a.scope}</p>
            </section>
            <section className="card prose-block">
              <h2>Origin</h2>
              <p>{a.origin}</p>
            </section>
            <div className="hero-actions">
              <Link className="btn btn-primary" href={`/quiz/play?mode=term&slug=${a.slug}`}>Quiz me on {a.acronym}</Link>
              <Link className="btn" href={`/flashcards?start=${a.slug}`}>Add to flashcards</Link>
            </div>
          </div>

          <aside className="card card-pad" aria-labelledby="related-h">
            <h2 id="related-h" className="eyebrow" style={{ color: "var(--muted)" }}>Related terms</h2>
            {related.length ? (
              <div className="side-list">
                {related.map((r) => (
                  <Link key={r.slug} href={`/acronyms/${r.slug}`}>
                    <span className="abbr">{r.acronym}</span><span className="exp">{r.expansion}</span>
                  </Link>
                ))}
              </div>
            ) : <p className="muted">No related terms yet.</p>}
          </aside>
        </div>
      </article>
    </div>
  );
}
