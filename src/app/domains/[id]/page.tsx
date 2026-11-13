import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AcronymCard } from "@/components/AcronymCard";
import { DOMAINS, domainById } from "@/data/taxonomy";
import type { DomainId } from "@/data/types";
import { acronymsInDomain } from "@/lib/content";

type Props = { params: Promise<{ id: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => DOMAINS.map((d) => ({ id: d.id }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const d = domainById[(await params).id as DomainId];
  return d ? { title: `${d.name} acronyms`, description: d.blurb, alternates: { canonical: `/domains/${d.id}` } } : {};
}

export default async function DomainPage({ params }: Props) {
  const d = domainById[(await params).id as DomainId];
  if (!d) notFound();
  const items = acronymsInDomain(d.id);
  return (
    <div className="container">
      <nav className="crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>Domains</span></nav>
      <header style={{ display: "flex", gap: 18, alignItems: "center", flexWrap: "wrap" }}>
        <span className="glyph" style={{ width: 56, height: 56, fontSize: 26 }} aria-hidden="true">{d.glyph}</span>
        <div style={{ flex: 1, minWidth: 240 }}>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 40px)" }}>{d.name}</h1>
          <p className="hero-lede" style={{ marginTop: 6 }}>{d.blurb}</p>
        </div>
        <Link className="btn btn-primary" href={`/quiz/play?mode=domain&domain=${d.id}`}>Quiz this domain</Link>
      </header>
      <p className="muted" style={{ margin: "28px 0 14px" }}>{items.length} acronyms</p>
      <div className="grid grid-3">{items.map((a) => <AcronymCard key={a.slug} a={a} />)}</div>
    </div>
  );
}
