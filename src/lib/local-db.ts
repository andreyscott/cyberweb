"use client";

import Dexie, { type EntityTable } from "dexie";
import type { Card } from "ts-fsrs";
import type { DomainId } from "@/data/types";

/** One answered quiz question. */
export interface AttemptRow {
  id?: number;
  questionId: string;
  domain: DomainId;
  correct: boolean;
  at: number;
}

/** Spaced-repetition state for one flashcard (one acronym). */
export interface CardRow {
  slug: string;
  /** ms since epoch, copied out of `card.due` so it can be indexed */
  due: number;
  card: Card;
}

/** Events waiting to be sent to the server. The server ignores duplicate IDs, so resending is safe. */
export type OutboxEvent =
  | { id: string; kind: "review"; slug: string; rating: number; at: number }
  | { id: string; kind: "attempt"; questionId: string; domain: DomainId; correct: boolean; at: number };

type DB = Dexie & {
  attempts: EntityTable<AttemptRow, "id">;
  cards: EntityTable<CardRow, "slug">;
  outbox: EntityTable<OutboxEvent, "id">;
};

let db: DB | null = null;

/** Opened lazily so nothing touches IndexedDB during server rendering. */
export function getDb(): DB {
  if (!db) {
    db = new Dexie("cybersec") as DB;
    db.version(1).stores({
      attempts: "++id, questionId, domain, at",
      cards: "slug, due",
      outbox: "id, at",
    });
  }
  return db;
}

export const newId = () => crypto.randomUUID();

export async function recordAttempt(a: Omit<AttemptRow, "id">) {
  const d = getDb();
  await d.transaction("rw", d.attempts, d.outbox, async () => {
    await d.attempts.add(a);
    await d.outbox.put({ id: newId(), kind: "attempt", ...a });
  });
  window.dispatchEvent(new Event("cybersec:progress"));
}

/** Ask the browser not to evict our data under storage pressure (best effort). */
export async function requestPersistence() {
  try {
    if (navigator.storage?.persist && !(await navigator.storage.persisted())) await navigator.storage.persist();
  } catch {
    /* not supported; fine */
  }
}
