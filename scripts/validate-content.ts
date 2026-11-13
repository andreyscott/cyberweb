/**
 * Checks the dictionary and question bank before every build (npm run validate).
 * Fails the build on broken links, duplicate slugs, or invalid answers.
 */
import { ACRONYMS } from "../src/data/acronyms";
import { SCENARIO_QUESTIONS } from "../src/data/questions";
import { DOMAINS, MODELS } from "../src/data/taxonomy";
import { buildQuiz, questionPool, QUIZ_MODES } from "../src/lib/quiz";

const errors: string[] = [];
const slugs = new Set<string>();
const domainIds = new Set(DOMAINS.map((d) => d.id));
const modelIds = new Set(MODELS.map((m) => m.id));

for (const a of ACRONYMS) {
  if (slugs.has(a.slug)) errors.push(`duplicate slug: ${a.slug}`);
  slugs.add(a.slug);
  if (!/^[a-z0-9-]+$/.test(a.slug)) errors.push(`bad slug: ${a.slug}`);
  for (const f of ["acronym", "expansion", "origin", "scope"] as const)
    if (!a[f]?.trim()) errors.push(`${a.slug}: empty ${f}`);
  if (!a.domains.length) errors.push(`${a.slug}: no domain`);
  a.domains.forEach((d) => domainIds.has(d) || errors.push(`${a.slug}: unknown domain ${d}`));
  a.models?.forEach((m) => modelIds.has(m) || errors.push(`${a.slug}: unknown model ${m}`));
}
for (const a of ACRONYMS)
  a.related?.forEach((r) => slugs.has(r) || errors.push(`${a.slug}: related slug not found: ${r}`));

const qids = new Set<string>();
for (const q of SCENARIO_QUESTIONS) {
  if (qids.has(q.id)) errors.push(`duplicate question id: ${q.id}`);
  qids.add(q.id);
  if (q.answer < 0 || q.answer >= q.choices.length) errors.push(`${q.id}: answer index out of range`);
  if (new Set(q.choices).size !== q.choices.length) errors.push(`${q.id}: duplicate choices`);
  q.about?.forEach((s) => slugs.has(s) || errors.push(`${q.id}: about slug not found: ${s}`));
}

// Generated questions: four distinct choices, the right one present, stable IDs across seeds.
const a = questionPool(1), b = questionPool(999);
for (const q of a) {
  if (q.choices.length !== 4) errors.push(`${q.id}: ${q.choices.length} choices`);
  if (new Set(q.choices).size !== q.choices.length) errors.push(`${q.id}: duplicate choices`);
  if (q.answer < 0) errors.push(`${q.id}: correct answer missing`);
}
if (a.map((q) => q.id).join() !== b.map((q) => q.id).join()) errors.push("question IDs change with the seed");

for (const m of QUIZ_MODES) {
  const quiz = buildQuiz({ mode: m.id, seed: 7, domain: "crypto", missedIds: ["s-cia-1", "d-xss-exp"] });
  if (!quiz.length) errors.push(`mode ${m.id} produced no questions`);
}

const perDomain = DOMAINS.map((d) => `${d.short} ${ACRONYMS.filter((x) => x.domains.includes(d.id)).length}`).join(", ");
if (errors.length) {
  console.error(`✗ ${errors.length} content error(s):\n  ` + errors.join("\n  "));
  process.exit(1);
}
console.log(`✓ ${ACRONYMS.length} acronyms, ${SCENARIO_QUESTIONS.length} scenario + ${a.length - SCENARIO_QUESTIONS.length} generated questions`);
console.log(`  ${perDomain}`);
