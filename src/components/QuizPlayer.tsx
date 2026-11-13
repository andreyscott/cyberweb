"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState } from "react";
import { domainById } from "@/data/taxonomy";
import type { DomainId, Question } from "@/data/types";
import { getDb, recordAttempt } from "@/lib/local-db";
import { buildQuiz, QUIZ_MODES, TIMED_SECONDS, type QuizMode } from "@/lib/quiz";
import { missedQuestionIds } from "@/lib/readiness";

const KEYS = ["A", "B", "C", "D", "E"];
const MODES = new Set(QUIZ_MODES.map((m) => m.id).concat("term"));

export function QuizPlayer() {
  const params = useSearchParams();
  const rawMode = params.get("mode") ?? "quick";
  const mode = (MODES.has(rawMode as QuizMode) ? rawMode : "quick") as QuizMode;
  const domain = params.get("domain") as DomainId | null;
  const slug = params.get("slug") ?? undefined;

  const [seed, setSeed] = useState(() => Date.now());
  const [questions, setQuestions] = useState<Question[] | null>(null);
  const [i, setI] = useState(0);
  const [picked, setPicked] = useState<number | null>(null);
  const [results, setResults] = useState<{ q: Question; choice: number }[]>([]);
  const [timeLeft, setTimeLeft] = useState(TIMED_SECONDS);
  const [done, setDone] = useState(false);

  // Build the quiz. "Missed" needs history from IndexedDB first.
  useEffect(() => {
    let alive = true;
    (async () => {
      const missedIds = mode === "missed" ? missedQuestionIds(await getDb().attempts.toArray()) : undefined;
      const qs = buildQuiz({ mode, seed, domain: domain && domainById[domain] ? domain : "general", slug, missedIds });
      if (alive) { setQuestions(qs); setI(0); setPicked(null); setResults([]); setDone(false); setTimeLeft(TIMED_SECONDS); }
    })();
    return () => { alive = false; };
  }, [mode, seed, domain, slug]);

  // Timed mode countdown.
  useEffect(() => {
    if (mode !== "timed" || done || !questions?.length) return;
    if (timeLeft <= 0) { setDone(true); return; }
    const t = setTimeout(() => setTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [mode, done, timeLeft, questions]);

  const q = questions?.[i];

  const choose = useCallback((c: number) => {
    if (!q || picked !== null || done) return;
    setPicked(c);
    setResults((r) => [...r, { q, choice: c }]);
    void recordAttempt({ questionId: q.id, domain: q.domain, correct: c === q.answer, at: Date.now() });
  }, [q, picked, done]);

  const next = useCallback(() => {
    if (!questions) return;
    if (i + 1 >= questions.length) setDone(true);
    else { setI(i + 1); setPicked(null); }
  }, [i, questions]);

  // Keyboard: 1–4 or A–D to answer, Enter or → to continue.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement).closest("input, textarea")) return;
      const n = "1234".indexOf(e.key) >= 0 ? Number(e.key) - 1 : KEYS.indexOf(e.key.toUpperCase());
      if (picked === null && n >= 0 && q && n < q.choices.length) { e.preventDefault(); choose(n); }
      else if (picked !== null && (e.key === "Enter" || e.key === "ArrowRight")) { e.preventDefault(); next(); }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [picked, q, choose, next]);

  const correct = useMemo(() => results.filter((r) => r.choice === r.q.answer).length, [results]);
  const title = mode === "domain" && domain && domainById[domain] ? domainById[domain].name : QUIZ_MODES.find((m) => m.id === mode)?.name ?? "Quiz";

  if (!questions) return <p className="empty">Building your quiz…</p>;

  if (!questions.length) {
    return (
      <div className="quiz-shell card result">
        <h1 style={{ fontSize: 24 }}>{mode === "missed" ? "Nothing to redo" : "No questions here yet"}</h1>
        <p className="muted" style={{ marginTop: 10 }}>{mode === "missed" ? "You haven't missed any questions. Nice work." : "Try another mode."}</p>
        <div className="hero-actions" style={{ justifyContent: "center" }}><Link className="btn btn-primary" href="/quiz">Back to quizzes</Link></div>
      </div>
    );
  }

  if (done) {
    const pct = results.length ? Math.round((correct / results.length) * 100) : 0;
    const wrong = results.filter((r) => r.choice !== r.q.answer);
    return (
      <div className="quiz-shell">
        <div className="card result">
          <p className="eyebrow" style={{ justifyContent: "center" }}>{title} · complete</p>
          <div className="score">{pct}%</div>
          <p style={{ marginTop: 10, fontSize: 17 }}>{correct} of {results.length} correct{mode === "timed" && ` in ${TIMED_SECONDS} seconds`}.</p>
          <div className="hero-actions" style={{ justifyContent: "center" }}>
            <button className="btn btn-primary" onClick={() => setSeed(Date.now())}>Try another set</button>
            {wrong.length > 0 && <Link className="btn" href="/quiz/play?mode=missed">Redo missed</Link>}
            <Link className="btn btn-ghost" href="/">Back to dashboard</Link>
          </div>
          {wrong.length > 0 && (
            <div className="review-list">
              <h2 style={{ fontSize: 17, marginTop: 8 }}>Review what you missed</h2>
              {wrong.map(({ q: w, choice }) => (
                <div key={w.id} className="review-item">
                  <p style={{ fontWeight: 600 }}>{w.prompt}</p>
                  <p style={{ marginTop: 6 }}><span className="muted">You said:</span> {w.choices[choice]}</p>
                  <p><span className="muted">Answer:</span> <b style={{ color: "var(--accent)" }}>{w.choices[w.answer]}</b></p>
                  <p className="muted" style={{ marginTop: 6 }}>{w.explanation}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  }

  if (!q) return null;
  const answered = picked !== null;
  const isRight = picked === q.answer;
  const progress = mode === "timed" ? ((TIMED_SECONDS - timeLeft) / TIMED_SECONDS) * 100 : (i / questions.length) * 100;

  return (
    <div className="quiz-shell">
      <div className="quiz-top">
        <span>{title}</span>
        <div className="bar" role="progressbar" aria-valuenow={Math.round(progress)} aria-valuemin={0} aria-valuemax={100} aria-label="Quiz progress">
          <span style={{ width: `${progress}%` }} />
        </div>
        {mode === "timed"
          ? <span className="timer" aria-live="off">{Math.floor(timeLeft / 60)}:{String(timeLeft % 60).padStart(2, "0")}</span>
          : <span className="mono">{i + 1}/{questions.length}</span>}
      </div>

      <div className="card question">
        <div className="tags" style={{ marginBottom: 14 }}>
          <span className="tag">{domainById[q.domain].short}</span>
          {q.difficulty && <span className="tag amber">{q.difficulty}</span>}
        </div>
        <h1 className="prompt" id="q-prompt">{q.prompt}</h1>
        <ul className="choices" role="list" aria-labelledby="q-prompt">
          {q.choices.map((c, n) => {
            const state = !answered ? "" : n === q.answer ? "correct" : n === picked ? "wrong" : "";
            return (
              <li key={n}>
                <button type="button" className={`choice ${state}`} disabled={answered} onClick={() => choose(n)} aria-describedby={answered ? "q-feedback" : undefined}>
                  <span className="key" aria-hidden="true">{KEYS[n]}</span>
                  <span>{c}</span>
                  {state === "correct" && <span className="sr-only">(correct answer)</span>}
                  {state === "wrong" && <span className="sr-only">(your answer, incorrect)</span>}
                </button>
              </li>
            );
          })}
        </ul>

        <div aria-live="polite">
          {answered && (
            <div id="q-feedback" className={`feedback ${isRight ? "ok" : "no"}`}>
              <b>{isRight ? "Correct." : `Not quite. The answer is ${KEYS[q.answer]}.`}</b>
              {q.explanation}
            </div>
          )}
        </div>

        <div className="quiz-actions">
          <span className="muted" style={{ fontSize: 14 }}>{correct} correct so far</span>
          {answered
            ? <button className="btn btn-primary" onClick={next} autoFocus>{i + 1 >= questions.length ? "See results" : "Next question"} →</button>
            : <span className="muted" style={{ fontSize: 13 }}>Press 1–4 or A–D</span>}
        </div>
      </div>
      {q.about?.[0] && answered && (
        <p style={{ marginTop: 14, fontSize: 14 }} className="muted">
          Want the full story? <Link href={`/acronyms/${q.about[0]}`} style={{ color: "var(--accent)" }}>Read the dictionary entry →</Link>
        </p>
      )}
    </div>
  );
}
