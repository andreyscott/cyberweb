"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Card } from "ts-fsrs";
import { DOMAINS } from "@/data/taxonomy";
import type { DomainId } from "@/data/types";
import { getDb, requestPersistence } from "@/lib/local-db";
import { GRADES, humanInterval, loadCard, previewIntervals, review, type GradeRating } from "@/lib/srs";

export interface FlashcardData {
  slug: string;
  acronym: string;
  expansion: string;
  summary: string;
  domains: DomainId[];
}

const NEW_PER_SESSION = 10;

export function Flashcards({ cards }: { cards: FlashcardData[] }) {
  const params = useSearchParams();
  const start = params.get("start");
  const [domain, setDomain] = useState<DomainId | null>(null);
  const [queue, setQueue] = useState<FlashcardData[] | null>(null);
  const [counts, setCounts] = useState({ due: 0, fresh: 0, learned: 0 });
  const [flipped, setFlipped] = useState(false);
  const [card, setCard] = useState<Card | null>(null);
  const [reviewed, setReviewed] = useState(0);
  const [turn, setTurn] = useState(0); // bumps on every review, so a requeued card reloads even if it's the same object
  const flipRef = useRef<HTMLButtonElement>(null);

  const deck = useMemo(() => (domain ? cards.filter((c) => c.domains.includes(domain)) : cards), [cards, domain]);

  /** Due cards first (oldest first), then a few new ones. A ?start= card goes to the front. */
  const buildQueue = useCallback(async () => {
    const rows = await getDb().cards.toArray();
    const known = new Map(rows.map((r) => [r.slug, r]));
    const now = Date.now();
    const inDeck = new Set(deck.map((c) => c.slug));
    const due = rows.filter((r) => r.due <= now && inDeck.has(r.slug)).sort((a, b) => a.due - b.due);
    const fresh = deck.filter((c) => !known.has(c.slug));
    const bySlug = new Map(cards.map((c) => [c.slug, c]));
    let q = [...due.map((r) => bySlug.get(r.slug)!).filter(Boolean), ...fresh.slice(0, NEW_PER_SESSION)];
    if (start && bySlug.has(start)) q = [bySlug.get(start)!, ...q.filter((c) => c.slug !== start)];
    setCounts({ due: due.length, fresh: fresh.length, learned: rows.filter((r) => inDeck.has(r.slug)).length });
    setQueue(q);
  }, [deck, cards, start]);

  useEffect(() => { void buildQueue(); }, [buildQueue]);

  const current = queue?.[0];
  useEffect(() => {
    setFlipped(false);
    setCard(null);
    if (current) void loadCard(current.slug).then(setCard);
  }, [current, turn]);

  const intervals = useMemo(() => (card ? previewIntervals(card) : null), [card]);

  const grade = useCallback(async (rating: GradeRating) => {
    if (!current || !card || !flipped) return;
    const next = await review(current.slug, card, rating);
    setReviewed((n) => n + 1);
    setTurn((t) => t + 1);
    if (reviewed === 0) void requestPersistence();
    // Cards due again within this session (e.g. "Again" → 1 minute) go to the back of the queue.
    const soon = new Date(next.due).getTime() - Date.now() < 10 * 60 * 1000;
    setQueue((q) => (q ? [...q.slice(1), ...(soon ? [current] : [])] : q));
    flipRef.current?.focus();
  }, [current, card, flipped, reviewed]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement).closest("input, textarea")) return;
      if (flipped) {
        const g = GRADES.find((x) => x.key === e.key);
        if (g) { e.preventDefault(); void grade(g.rating); }
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [flipped, grade]);

  return (
    <div style={{ maxWidth: 760, margin: "24px auto 0" }}>
      <div className="filters" role="group" aria-label="Choose a deck" style={{ marginTop: 0, marginBottom: 16 }}>
        <button type="button" className="chip" aria-pressed={domain === null} onClick={() => setDomain(null)}>All decks</button>
        {DOMAINS.map((d) => (
          <button key={d.id} type="button" className="chip" aria-pressed={domain === d.id} onClick={() => setDomain(d.id)}>{d.short}</button>
        ))}
      </div>

      <div className="deck-stats" aria-live="polite">
        <span className="tag amber">{counts.due} due</span>
        <span className="tag">{counts.fresh} new</span>
        <span className="tag green">{counts.learned} studied</span>
        {reviewed > 0 && <span className="tag green">{reviewed} reviewed this session</span>}
      </div>

      {!queue ? (
        <p className="empty">Loading deck…</p>
      ) : !current ? (
        <div className="card result">
          <div className="score" style={{ fontSize: 44 }}>All caught up</div>
          <p className="muted" style={{ marginTop: 12 }}>
            {reviewed ? `You reviewed ${reviewed} card${reviewed === 1 ? "" : "s"}. ` : ""}Nothing else is due in this deck right now. Come back later, or study more new cards.
          </p>
          <div className="hero-actions" style={{ justifyContent: "center" }}>
            <button className="btn btn-primary" onClick={() => void buildQueue()} disabled={counts.fresh === 0}>Study new cards</button>
            <Link className="btn" href="/quiz/play?mode=quick">Take a quiz instead</Link>
          </div>
        </div>
      ) : (
        <>
          <div className="flip-wrap">
            <button
              ref={flipRef}
              type="button"
              className={`flip ${flipped ? "flipped" : ""}`}
              onClick={() => setFlipped((f) => !f)}
              aria-label={flipped ? `${current.acronym}: ${current.expansion}. Press to show the front.` : `${current.acronym}. Press to reveal the meaning.`}
            >
              <div className="face front" inert={flipped}>
                <span className="abbr">{current.acronym}</span>
                <span className="muted">What does it stand for?</span>
                <span className="hint">tap or press Space to flip</span>
              </div>
              <div className="face back" inert={!flipped}>
                <span className="mono muted" style={{ fontSize: 15 }}>{current.acronym}</span>
                <span className="exp">{current.expansion}</span>
                <span className="sum">{current.summary}</span>
                <span className="hint">how well did you know it?</span>
              </div>
            </button>
          </div>

          {flipped ? (
            <div className="grades" role="group" aria-label="Rate your recall">
              {GRADES.map((g) => (
                <button key={g.label} type="button" className={`grade ${g.cls}`} onClick={() => void grade(g.rating)}>
                  {g.label}
                  <small>{intervals ? humanInterval(intervals[g.rating]) : "…"} · {g.key}</small>
                </button>
              ))}
            </div>
          ) : (
            <div className="hero-actions" style={{ justifyContent: "center", marginTop: 16 }}>
              <button className="btn btn-primary" onClick={() => setFlipped(true)}>Show answer</button>
            </div>
          )}
          <p className="muted" style={{ textAlign: "center", marginTop: 14, fontSize: 14 }}>
            {queue.length} card{queue.length === 1 ? "" : "s"} left · <Link href={`/acronyms/${current.slug}`} style={{ color: "var(--accent)" }}>full entry</Link>
          </p>
        </>
      )}
    </div>
  );
}
