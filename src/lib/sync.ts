"use client";

import { getDb } from "./local-db";

const DEVICE_KEY = "cybersec:device";
const BATCH = 200;

/** A random ID for this browser. Accounts can claim it later to merge progress. */
export function deviceId() {
  let id: string | null = null;
  try { id = localStorage.getItem(DEVICE_KEY); } catch { /* storage blocked */ }
  if (!id) {
    id = crypto.randomUUID();
    try { localStorage.setItem(DEVICE_KEY, id); } catch { /* keep in memory only */ }
  }
  return id;
}

let flushing = false;

/**
 * Send pending events to the server. Safe to call often: it does nothing when
 * offline, when already running, or when the server has no database configured.
 */
export async function flushOutbox(): Promise<"sent" | "empty" | "offline" | "local-only" | "error"> {
  if (flushing) return "empty";
  if (!navigator.onLine) return "offline";
  flushing = true;
  try {
    const db = getDb();
    let sentAny = false;
    for (;;) {
      const events = await db.outbox.orderBy("at").limit(BATCH).toArray();
      if (!events.length) return sentAny ? "sent" : "empty";
      const res = await fetch("/api/sync", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ deviceId: deviceId(), events }),
        keepalive: true,
      });
      if (res.status === 503) return "local-only"; // no database yet: progress stays on the device
      if (!res.ok) return "error";
      const { accepted } = (await res.json()) as { accepted: string[] };
      await db.outbox.bulkDelete(accepted);
      sentAny = true;
      if (events.length < BATCH) return "sent";
    }
  } catch {
    return "error";
  } finally {
    flushing = false;
  }
}
