import type { Metadata } from "next";
import { Suspense } from "react";
import { QuizPlayer } from "@/components/QuizPlayer";

export const metadata: Metadata = { title: "Quiz", robots: { index: false } };

/** The shell is static; the quiz itself is built in the browser from the URL. */
export default function PlayPage() {
  return (
    <div className="container">
      <Suspense fallback={<p className="empty">Loading quiz…</p>}>
        <QuizPlayer />
      </Suspense>
    </div>
  );
}
