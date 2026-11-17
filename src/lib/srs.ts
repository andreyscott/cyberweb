"use client";

import { createEmptyCard, fsrs, Rating, type Card } from "ts-fsrs";
import { getDb, newId, type OutboxEvent } from "./local-db";

/** 90% target retention is FSRS's default and a good starting point. */
const scheduler = fsrs({ request_retention: 0.9, maximum_interval: 365, enable_fuzz: true });

export const GRADES = [
  { rating: Rating.Again, label: "Again", cls: "again", key: "1" },
  { rating: Rating.Hard, label: "Hard", cls: "hard", key: "2" },
  { rating: Rating.Good, label: "Good", cls: "good", key: "3" },
  { rating: Rating.Easy, label: "Easy", cls: "easy", key: "4" },
] as const;

export type GradeRating = (typeof GRADES)[number]["rating"];

export async function loadCard(slug: string): Promise<Card> {
  const row = await getDb().cards.get(slug);
  return row?.card ?? createEmptyCard(new Date());
}

/** Preview the next due date for each grade, shown under the buttons. */
export function previewIntervals(card: Card, now = new Date()) {
  const preview = scheduler.repeat(card, now);
  return Object.fromEntries(GRADES.map((g) => [g.rating, preview[g.rating].card.due])) as Record<GradeRating, Date>;
}

export async function review(slug: string, card: Card, rating: GradeRating, now = new Date()) {
  const next = scheduler.next(card, now, rating).card;
  const d = getDb();
  // Typed separately: Dexie's insert type is an Omit over the OutboxEvent union, which drops `slug`/`rating`.
  const event: OutboxEvent = { id: newId(), kind: "review", slug, rating, at: now.getTime() };
  await d.transaction("rw", d.cards, d.outbox, async () => {
    await d.cards.put({ slug, card: next, due: new Date(next.due).getTime() });
    await d.outbox.put(event);
  });
  return next;
}

/** "in 10m", "in 3d" */
export function humanInterval(due: Date, now = new Date()) {
  const mins = Math.max(1, Math.round((new Date(due).getTime() - now.getTime()) / 60000));
  if (mins < 60) return `${mins}m`;
  const hrs = Math.round(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.round(hrs / 24);
  return days < 30 ? `${days}d` : `${Math.round(days / 30)}mo`;
}
