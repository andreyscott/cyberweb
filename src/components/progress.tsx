"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { domainById } from "@/data/taxonomy";
import type { DomainId } from "@/data/types";
import { getDb } from "@/lib/local-db";
import { domainStats, missedQuestionIds, readiness, type Attempt } from "@/lib/readiness";

/** Reads quiz history from IndexedDB and refreshes when a new answer is recorded. */
export function useAttempts() {
  const [attempts, setAttempts] = useState<Attempt[] | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => getDb().attempts.toArray().then((rows) => alive && setAttempts(rows), () => alive && setAttempts([]));
    load();
    window.addEventListener("cybersec:progress", load);
    return () => { alive = false; window.removeEventListener("cybersec:progress", load); };
  }, []);
  return attempts;
}

export function ReadinessPanel() {
  const attempts = useAttempts();
  const stats = attempts ? domainStats(attempts) : [];
  const score = attempts ? readiness(attempts) : 0;
  const answered = attempts?.length ?? 0;
  const weakest = [...stats].filter((s) => s.answered > 0).sort((a, b) => a.mastery - b.mastery)[0];
  const missed = attempts ? missedQuestionIds(attempts).length : 0;

  return (
    <div className="card card-pad readiness">
      <div className="ring" style={{ ["--p" as string]: score }} role="img" aria-label={`Readiness ${score} percent`}>
        <div><div><b>{score}%</b><small>readiness</small></div></div>
      </div>
      <div>
        <h2 style={{ fontSize: 20 }}>Your readiness</h2>
        <p className="muted" style={{ marginTop: 6, fontSize: 15 }}>
          {answered === 0
            ? "Answer a few questions and we'll show how ready you are in each domain."
            : weakest
              ? <>Weakest area right now: <b style={{ color: "var(--text)" }}>{domainById[weakest.domain].name}</b>.</>
              : "Keep going to build confidence across every domain."}
        </p>
        <div className="hero-actions" style={{ marginTop: 16 }}>
          <Link className="btn btn-primary" href={weakest ? `/quiz/play?mode=domain&domain=${weakest.domain}` : "/quiz/play?mode=quick"}>
            {weakest ? "Improve weakest area" : "Take a quick quiz"}
          </Link>
          {missed > 0 && <Link className="btn" href="/quiz/play?mode=missed">Redo {missed} missed</Link>}
        </div>
      </div>
    </div>
  );
}

/** The progress bar on a domain card. Renders an empty bar on the server, then fills in. */
export function DomainMastery({ domain }: { domain: DomainId }) {
  const attempts = useAttempts();
  const s = attempts ? domainStats(attempts).find((x) => x.domain === domain) : undefined;
  const pct = s?.mastery ?? 0;
  return (
    <>
      <div className="bar" aria-hidden="true"><span style={{ width: `${pct}%` }} /></div>
      <span className="mono" aria-label={`${pct} percent mastered`}>{pct}%</span>
    </>
  );
}
