CREATE TABLE "quiz_attempts" (
	"id" uuid PRIMARY KEY NOT NULL,
	"device_id" uuid NOT NULL,
	"user_id" text,
	"question_id" text NOT NULL,
	"domain" text NOT NULL,
	"correct" boolean NOT NULL,
	"answered_at" timestamp with time zone NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "review_events" (
	"id" uuid PRIMARY KEY NOT NULL,
	"device_id" uuid NOT NULL,
	"user_id" text,
	"card_slug" text NOT NULL,
	"rating" smallint NOT NULL,
	"reviewed_at" timestamp with time zone NOT NULL,
	"received_at" timestamp with time zone DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE INDEX "quiz_attempts_device_idx" ON "quiz_attempts" USING btree ("device_id","answered_at");--> statement-breakpoint
CREATE INDEX "quiz_attempts_question_idx" ON "quiz_attempts" USING btree ("question_id");--> statement-breakpoint
CREATE INDEX "review_events_device_idx" ON "review_events" USING btree ("device_id","reviewed_at");--> statement-breakpoint
CREATE INDEX "review_events_user_idx" ON "review_events" USING btree ("user_id");