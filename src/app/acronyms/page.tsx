import type { Metadata } from "next";
import { AcronymBrowser } from "@/components/AcronymBrowser";
import { allAcronyms } from "@/lib/content";

export const metadata: Metadata = {
  title: "Cybersecurity Acronyms A–Z",
  description: `Browse ${allAcronyms.length} cybersecurity acronyms alphabetically or by domain, with meanings, origins, and scope.`,
  alternates: { canonical: "/acronyms" },
};

export default function AcronymsPage() {
  return (
    <div className="container">
      <header style={{ paddingTop: 40 }}>
        <p className="eyebrow">Dictionary</p>
        <h1 style={{ fontSize: "clamp(30px, 4vw, 42px)" }}>Cybersecurity acronyms, A–Z</h1>
        <p className="hero-lede" style={{ marginTop: 10 }}>Pick a letter, filter by domain, or press <span className="kbd">/</span> to search.</p>
      </header>
      <AcronymBrowser items={allAcronyms} />
    </div>
  );
}
