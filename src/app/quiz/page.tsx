import type { Metadata } from "next";
import Link from "next/link";
import { DomainMastery } from "@/components/progress";
import { DOMAINS } from "@/data/taxonomy";
import { QUIZ_MODES } from "@/lib/quiz";

export const metadata: Metadata = {
  title: "Cybersecurity Quiz",
  description: "Practise cybersecurity acronyms and scenarios with quick, timed, domain, and missed-question quizzes.",
  alternates: { canonical: "/quiz" },
};

export default function QuizHome() {
  return (
    <div className="container">
      <header style={{ paddingTop: 40 }}>
        <p className="eyebrow">Test</p>
        <h1 style={{ fontSize: "clamp(30px, 4vw, 42px)" }}>Choose how to practise</h1>
        <p className="hero-lede" style={{ marginTop: 10 }}>Every answer comes with an explanation. Your results stay on this device and shape your readiness score.</p>
      </header>

      <section className="section" aria-labelledby="modes-h">
        <h2 id="modes-h" className="sr-only">Quiz modes</h2>
        <div className="grid grid-3">
          {QUIZ_MODES.filter((m) => m.id !== "domain").map((m) => (
            <Link key={m.id} href={`/quiz/play?mode=${m.id}`} className="card mode-card">
              <span className="glyph" aria-hidden="true">{m.glyph}</span>
              <div><h3>{m.name}</h3><p>{m.blurb}</p></div>
            </Link>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="domains-h">
        <div className="section-head"><div><p className="eyebrow">Focus</p><h2 id="domains-h">Quiz by domain</h2></div></div>
        <div className="grid grid-3">
          {DOMAINS.map((d) => (
            <Link key={d.id} href={`/quiz/play?mode=domain&domain=${d.id}`} className="card domain-card" style={{ minHeight: 0 }}>
              <div className="top"><span className="glyph" aria-hidden="true">{d.glyph}</span><h3>{d.name}</h3></div>
              <div className="meta"><DomainMastery domain={d.id} /></div>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
