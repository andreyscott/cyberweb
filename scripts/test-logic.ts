import { buildQuiz } from "../src/lib/quiz";
import { readiness, domainStats, missedQuestionIds } from "../src/lib/readiness";
import { rankResults, toSearchDoc, compact } from "../src/lib/search";
import { getAcronym, otherMeanings, summary } from "../src/lib/content";
const assert = (c: unknown, m: string) => { if (!c) { console.error("FAIL", m); process.exit(1); } else console.log("ok ", m); };

const q1 = buildQuiz({ mode: "quick", seed: 42 }), q2 = buildQuiz({ mode: "quick", seed: 42 });
assert(q1.length === 10 && JSON.stringify(q1) === JSON.stringify(q2), "quick quiz: 10 questions, reproducible from seed");
assert(buildQuiz({ mode: "domain", seed: 1, domain: "crypto" }).every(q => q.domain === "crypto"), "domain quiz stays in domain");
assert(buildQuiz({ mode: "term", seed: 1, slug: "xss" }).every(q => q.about?.includes("xss")), "term quiz only asks about XSS");
const mq = buildQuiz({ mode: "missed", seed: 3, missedIds: ["s-cia-1", "d-aes-exp"] });
assert(mq.length === 2, "missed mode replays exactly the missed IDs");
const macQ = buildQuiz({ mode: "term", seed: 5, slug: "mac-address", count: 5 }).find(q => q.id.endsWith("-exp"))!;
assert(!macQ.choices.includes("Mandatory Access Control") && !macQ.choices.includes("Message Authentication Code"), "distractors never include another meaning of the same acronym");

const now = Date.now();
const attempts = Array.from({ length: 8 }, (_, i) => ({ questionId: `q${i}`, domain: "crypto" as const, correct: i < 6, at: now + i }));
const crypto = domainStats(attempts).find(d => d.domain === "crypto")!;
assert(crypto.mastery === 75, `8 answers, 6 right -> 75% mastery (got ${crypto.mastery})`);
assert(readiness(attempts) === Math.round(75 / 9), "readiness averages across all 9 domains");
const fixed = [...attempts, { questionId: "q7", domain: "crypto" as const, correct: true, at: now + 100 }];
assert(missedQuestionIds(fixed).length === 1, "re-answering correctly clears a missed question");

const hits = [{ acronym: "CIS", score: 9 }, { acronym: "CIA", score: 3 }];
assert(rankResults("cia", hits)[0].acronym === "CIA", "exact acronym match ranks first");
assert(compact("PCI DSS") === "PCIDSS" && toSearchDoc(getAcronym("attck")!).compact === "ATTCK", "punctuation normalised for search");
assert(otherMeanings(getAcronym("mac-address")!).length === 2, "MAC has 3 meanings linked");
assert(summary(getAcronym("xss")!).endsWith("."), "summary is the first sentence");
