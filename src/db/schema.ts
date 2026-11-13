import { boolean, index, pgTable, smallint, text, timestamp, uuid } from "drizzle-orm/pg-core";

/**
 * User progress only. Dictionary content lives in the repo (src/data) and is
 * built into static pages, so reading a definition never touches the database.
 *
 * Events are append-only and keyed by a client-generated UUID, so a client can
 * resend the same batch safely (inserts use ON CONFLICT DO NOTHING).
 */

export const reviewEvents = pgTable(
  "review_events",
  {
    id: uuid("id").primaryKey(),
    deviceId: uuid("device_id").notNull(),
    /** Set when an account claims this device's history (phase 2: auth). */
    userId: text("user_id"),
    cardSlug: text("card_slug").notNull(),
    /** FSRS rating: 1 Again, 2 Hard, 3 Good, 4 Easy */
    rating: smallint("rating").notNull(),
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }).notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("review_events_device_idx").on(t.deviceId, t.reviewedAt), index("review_events_user_idx").on(t.userId)],
);

export const quizAttempts = pgTable(
  "quiz_attempts",
  {
    id: uuid("id").primaryKey(),
    deviceId: uuid("device_id").notNull(),
    userId: text("user_id"),
    questionId: text("question_id").notNull(),
    domain: text("domain").notNull(),
    correct: boolean("correct").notNull(),
    answeredAt: timestamp("answered_at", { withTimezone: true }).notNull(),
    receivedAt: timestamp("received_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [
    index("quiz_attempts_device_idx").on(t.deviceId, t.answeredAt),
    index("quiz_attempts_question_idx").on(t.questionId),
  ],
);

export type QuizAttempt = typeof quizAttempts.$inferSelect;
export type ReviewEvent = typeof reviewEvents.$inferSelect;
