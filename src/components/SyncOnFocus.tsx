"use client";

import { useEffect } from "react";
import { flushOutbox } from "@/lib/sync";

/** Sends queued progress when the app opens, regains focus, or comes back online. */
export function SyncOnFocus() {
  useEffect(() => {
    const run = () => { if (document.visibilityState === "visible") void flushOutbox(); };
    run();
    window.addEventListener("online", run);
    document.addEventListener("visibilitychange", run);
    return () => {
      window.removeEventListener("online", run);
      document.removeEventListener("visibilitychange", run);
    };
  }, []);
  return null;
}
