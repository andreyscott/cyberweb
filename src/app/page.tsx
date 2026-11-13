import Link from "next/link";
import { AcronymCard, DomainCard } from "@/components/AcronymCard";
import { HeroSearch } from "@/components/HeroSearch";
import { DomainMastery, ReadinessPanel } from "@/components/progress";
import { DOMAINS, MODELS } from "@/data/taxonomy";
import { allAcronyms, domainCounts, getAcronym, modelCounts, otherMeanings } from "@/lib/content";
import { QUIZ_MODES } from "@/lib/quiz";
import { SCENARIO_QUESTIONS } from "@/data/questions";

const FEATURED = ["xss", "zta", "siem", "mfa", "tls", "attck"];

export default function Home() {
  const multi = allAcronyms.filter((a, i, arr) => otherMeanings(a).length > 0 && arr.findIndex((x) => x.acronym === a.acronym) === i);
  const totalQuestions = SCENARIO_QUESTIONS.length + allAcronyms.length * 2;

  return (
    <div className="container">
      <section className="hero">
        <div>
          <p className="eyebrow">▍ cybersecurity, decoded</p>
          <h1>Every acronym. <em>Explained.</em> Then drilled until it sticks.</h1>
          <p className="hero-lede">
            Look up any cybersecurity acronym to see what it means, where it came from, and where it applies.
            Then test yourself with quizzes and flashcards that schedule reviews around your memory.
          </p>
          <HeroSearch />
          <div className="hero-stats">
            <div><b>{allAcronyms.length}</b><span>acronyms</span></div>
            <div><b>{DOMAINS.length}</b><span>domains</span></div>
            <div><b>{totalQuestions}</b><span>practice questions</span></div>
          </div>
        </div>
        <div className="card terminal" aria-hidden="true">
          <div className="terminal-bar"><i /><i /><i /></div>
          <div className="terminal-body">
            <div><span className="p">$</span> cybersec define <span className="k">XSS</span></div>
            <div className="c"># Cross-Site Scripting</div>
            <div className="c"># &quot;X&quot; avoids a clash with CSS</div>
            <br />
            <div><span className="p">$</span> cybersec define <span className="k">MAC</span></div>
            <div className="c"># 3 meanings found:</div>
            <div>  Mandatory Access Control</div>
            <div>  Media Access Control</div>
            <div>  Message Authentication Code</div>
          </div>
        </div>
      </section>

      <section className="section" aria-labelledby="progress-h">
        <h2 id="progress-h" className="sr-only">Your progress</h2>
        <ReadinessPanel />
      </section>

      <section className="section" aria-labelledby="study-h">
        <div className="section-head">
          <div><p className="eyebrow">01 · Study</p><h2 id="study-h">Learn by domain</h2></div>
          <Link href="/acronyms" className="muted">A–Z dictionary →</Link>
        </div>
        <div className="grid grid-3">
          {DOMAINS.map((d) => (
            <DomainCard key={d.id} id={d.id} count={domainCounts[d.id]}>
              <DomainMastery domain={d.id} />
            </DomainCard>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="quiz-h">
        <div className="section-head">
          <div><p className="eyebrow">02 · Test</p><h2 id="quiz-h">Quiz yourself</h2></div>
          <Link href="/flashcards" className="muted">Flashcards →</Link>
        </div>
        <div className="grid grid-3">
          {QUIZ_MODES.map((m) => (
            <Link key={m.id} href={m.id === "domain" ? "/quiz" : `/quiz/play?mode=${m.id}`} className="card mode-card">
              <span className="glyph" aria-hidden="true">{m.glyph}</span>
              <div><h3>{m.name}</h3><p>{m.blurb}</p></div>
            </Link>
          ))}
          <Link href="/flashcards" className="card mode-card">
            <span className="glyph" aria-hidden="true">⧉</span>
            <div><h3>Flashcards</h3><p>Spaced repetition that works offline once loaded.</p></div>
          </Link>
        </div>
      </section>

      <section className="section" aria-labelledby="featured-h">
        <div className="section-head">
          <div><p className="eyebrow">03 · Explore</p><h2 id="featured-h">Start with the essentials</h2></div>
        </div>
        <div className="grid grid-3">
          {FEATURED.map((s) => getAcronym(s)).filter(Boolean).map((a) => <AcronymCard key={a!.slug} a={a!} />)}
        </div>
      </section>

      <section className="section" aria-labelledby="multi-h">
        <div className="section-head">
          <div><p className="eyebrow">Watch out</p><h2 id="multi-h">Same letters, different meanings</h2></div>
        </div>
        <div className="tags" style={{ gap: 10 }}>
          {multi.map((a) => (
            <Link key={a.slug} href={`/acronyms/${a.slug}`} className="chip">
              <b className="mono">{a.acronym}</b> × {otherMeanings(a).length + 1}
            </Link>
          ))}
        </div>
      </section>

      <section className="section" aria-labelledby="models-h">
        <div className="section-head">
          <div><p className="eyebrow">Frameworks</p><h2 id="models-h">Browse by model</h2></div>
        </div>
        <div className="grid grid-4">
          {MODELS.map((m) => (
            <Link key={m.id} href={`/models/${m.id}`} className="card card-pad">
              <h3 style={{ fontSize: 16 }}>{m.name}</h3>
              <p className="muted" style={{ fontSize: 14, marginTop: 6 }}>{m.blurb}</p>
              <p className="mono" style={{ fontSize: 13, marginTop: 10, color: "var(--accent)" }}>{modelCounts[m.id]} terms</p>
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}
