import type { Metadata } from "next";
import { Suspense } from "react";
import { Flashcards, type FlashcardData } from "@/components/Flashcards";
import { allAcronyms } from "@/lib/content";
import { summary } from "@/lib/text";

export const metadata: Metadata = {
  title: "Flashcards",
  description: "Learn cybersecurity acronyms with spaced-repetition flashcards that adapt to how well you remember each one.",
  alternates: { canonical: "/flashcards" },
};

export default function FlashcardsPage() {
  // Send only what a card needs, not the whole dictionary.
  const cards: FlashcardData[] = allAcronyms.map((a) => ({
    slug: a.slug, acronym: a.acronym, expansion: a.expansion, summary: summary(a, 180), domains: a.domains,
  }));
  return (
    <div className="container">
      <header style={{ paddingTop: 40, maxWidth: 760, margin: "0 auto" }}>
        <p className="eyebrow">Flashcards</p>
        <h1 style={{ fontSize: "clamp(30px, 4vw, 42px)" }}>Remember it for good</h1>
        <p className="hero-lede" style={{ marginTop: 10 }}>
          Flip a card, rate how well you knew it, and the scheduler (FSRS) decides when you see it again. Progress is saved on this device.
        </p>
      </header>
      <Suspense fallback={<p className="empty">Loading deck…</p>}>
        <Flashcards cards={cards} />
      </Suspense>
    </div>
  );
}
