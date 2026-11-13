import { allAcronyms, getAcronym } from "./content";
import { SCENARIO_QUESTIONS } from "@/data/questions";
import type { Acronym, DomainId, Question } from "@/data/types";

/** Small seeded PRNG (mulberry32) so a quiz can be reproduced from its seed. */
export function rng(seed: number) {
  let t = seed >>> 0;
  return () => {
    t = (t + 0x6d2b79f5) >>> 0;
    let r = Math.imul(t ^ (t >>> 15), 1 | t);
    r = (r + Math.imul(r ^ (r >>> 7), 61 | r)) ^ r;
    return ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  };
}

export function shuffle<T>(arr: readonly T[], rand: () => number): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

/** Wrong answers: prefer the same domain so distractors are plausible, never another meaning of the same acronym. */
function distractors(target: Acronym, pick: (a: Acronym) => string, rand: () => number, n = 3) {
  const right = pick(target);
  const pool = allAcronyms.filter((a) => a.slug !== target.slug && pick(a) !== right && a.acronym !== target.acronym);
  const near = shuffle(pool.filter((a) => a.domains.some((d) => target.domains.includes(d))), rand);
  const far = shuffle(pool.filter((a) => !near.includes(a)), rand);
  const seen = new Set<string>([right]);
  const out: string[] = [];
  for (const a of [...near, ...far]) {
    const v = pick(a);
    if (seen.has(v)) continue;
    seen.add(v);
    out.push(v);
    if (out.length === n) break;
  }
  return out;
}

function withShuffledChoices(q: Omit<Question, "choices" | "answer"> & { right: string; wrong: string[] }, rand: () => number): Question {
  const choices = shuffle([q.right, ...q.wrong], rand);
  const { right, wrong: _wrong, ...rest } = q;
  return { ...rest, choices, answer: choices.indexOf(right) };
}

/** "What does XSS stand for?" and "Which acronym means …?" generated from one entry. */
export function definitionQuestions(a: Acronym, rand: () => number): Question[] {
  const domain = a.domains[0];
  return [
    withShuffledChoices({
      id: `d-${a.slug}-exp`, domain, difficulty: "easy", about: [a.slug],
      prompt: `What does ${a.acronym} stand for?`,
      right: a.expansion, wrong: distractors(a, (x) => x.expansion, rand),
      explanation: `${a.acronym} stands for ${a.expansion}. ${a.scope}`,
    }, rand),
    withShuffledChoices({
      id: `d-${a.slug}-abbr`, domain, difficulty: "medium", about: [a.slug],
      prompt: `Which acronym stands for "${a.expansion}"?`,
      right: a.acronym, wrong: distractors(a, (x) => x.acronym, rand),
      explanation: `${a.expansion} is abbreviated ${a.acronym}. ${a.origin}`,
    }, rand),
  ];
}

export type QuizMode = "quick" | "domain" | "timed" | "missed" | "hard" | "term";

export interface QuizOptions {
  mode: QuizMode;
  seed: number;
  count?: number;
  domain?: DomainId;
  /** For "term" mode: quiz on one acronym. */
  slug?: string;
  /** Question IDs answered wrongly before, for "missed" mode. */
  missedIds?: string[];
}

export const QUIZ_MODES: { id: QuizMode; name: string; blurb: string; glyph: string }[] = [
  { id: "quick", name: "Quick 10", blurb: "Ten mixed questions across every domain.", glyph: "⚡" },
  { id: "timed", name: "Timed sprint", blurb: "Answer as many as you can in 90 seconds.", glyph: "⏱" },
  { id: "domain", name: "By domain", blurb: "Focus on one domain until it sticks.", glyph: "▦" },
  { id: "hard", name: "Scenario mode", blurb: "Real-world scenarios, not just definitions.", glyph: "◈" },
  { id: "missed", name: "Missed questions", blurb: "Redo every question you got wrong.", glyph: "↺" },
];

export const TIMED_SECONDS = 90;

/** Every question that can be asked, rebuilt deterministically from the seed. */
export function questionPool(seed: number): Question[] {
  const rand = rng(seed);
  return [...SCENARIO_QUESTIONS, ...allAcronyms.flatMap((a) => definitionQuestions(a, rand))];
}

export function buildQuiz(opts: QuizOptions): Question[] {
  const rand = rng(opts.seed);
  const pool = questionPool(opts.seed);
  let picked: Question[];
  switch (opts.mode) {
    case "domain":
      picked = pool.filter((q) => q.domain === opts.domain);
      break;
    case "hard":
      picked = SCENARIO_QUESTIONS;
      break;
    case "missed": {
      const missed = new Set(opts.missedIds ?? []);
      picked = pool.filter((q) => missed.has(q.id));
      break;
    }
    case "term": {
      const a = opts.slug ? getAcronym(opts.slug) : undefined;
      picked = a ? pool.filter((q) => q.about?.includes(a.slug)) : [];
      break;
    }
    default:
      picked = pool;
  }
  const count = opts.count ?? (opts.mode === "timed" ? 60 : 10);
  // Mix scenario questions in so quick quizzes aren't all definitions.
  return shuffle(picked, rand).slice(0, count);
}

/** Look up a question by ID, e.g. when replaying missed questions. */
export const findQuestion = (id: string, seed = 1) => questionPool(seed).find((q) => q.id === id);
