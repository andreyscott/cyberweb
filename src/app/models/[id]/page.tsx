import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AcronymCard } from "@/components/AcronymCard";
import { MODELS, modelById } from "@/data/taxonomy";
import type { ModelId } from "@/data/types";
import { acronymsInModel } from "@/lib/content";

type Props = { params: Promise<{ id: string }> };

export const dynamicParams = false;
export const generateStaticParams = () => MODELS.map((m) => ({ id: m.id }));

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const m = modelById[(await params).id as ModelId];
  return m ? { title: `${m.name} acronyms`, description: m.blurb, alternates: { canonical: `/models/${m.id}` } } : {};
}

export default async function ModelPage({ params }: Props) {
  const m = modelById[(await params).id as ModelId];
  if (!m) notFound();
  const items = acronymsInModel(m.id);
  return (
    <div className="container">
      <nav className="crumbs" aria-label="Breadcrumb"><Link href="/">Home</Link><span aria-hidden="true">/</span><span>Models</span></nav>
      <p className="eyebrow">Framework</p>
      <h1 style={{ fontSize: "clamp(28px, 4vw, 40px)" }}>{m.name}</h1>
      <p className="hero-lede" style={{ marginTop: 8 }}>{m.blurb}</p>
      <p className="muted" style={{ margin: "28px 0 14px" }}>{items.length} related acronyms</p>
      <div className="grid grid-3">{items.map((a) => <AcronymCard key={a.slug} a={a} />)}</div>
    </div>
  );
}
