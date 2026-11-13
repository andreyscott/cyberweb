import { DOMAINS } from "@/data/taxonomy";
import type { DomainId } from "@/data/types";

export interface Attempt {
  questionId: string;
  domain: DomainId;
  correct: boolean;
  /** ms since epoch */
  at: number;
}

export interface DomainStat {
  domain: DomainId;
  answered: number;
  correct: number;
  /** 0–100, recency-weighted accuracy */
  mastery: number;
}

/**
 * Mastery per domain: accuracy over the latest answer to each question,
 * scaled down until there's enough evidence (8 distinct questions) to trust it.
 */
export function domainStats(attempts: Attempt[]): DomainStat[] {
  const latest = new Map<string, Attempt>();
  for (const a of [...attempts].sort((x, y) => x.at - y.at)) latest.set(a.questionId, a);
  return DOMAINS.map((d) => {
    const mine = [...latest.values()].filter((a) => a.domain === d.id);
    const correct = mine.filter((a) => a.correct).length;
    const accuracy = mine.length ? correct / mine.length : 0;
    const confidence = Math.min(1, mine.length / 8);
    return { domain: d.id, answered: mine.length, correct, mastery: Math.round(accuracy * confidence * 100) };
  });
}

/** Overall readiness is the mean of domain mastery, so a weak domain drags it down. */
export function readiness(attempts: Attempt[]) {
  const stats = domainStats(attempts);
  return Math.round(stats.reduce((s, d) => s + d.mastery, 0) / stats.length);
}

export function missedQuestionIds(attempts: Attempt[]) {
  const latest = new Map<string, Attempt>();
  for (const a of [...attempts].sort((x, y) => x.at - y.at)) latest.set(a.questionId, a);
  return [...latest.values()].filter((a) => !a.correct).map((a) => a.questionId);
}
