"use client";

import MiniSearch from "minisearch";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useId, useRef, useState } from "react";
import { MINISEARCH_OPTIONS, rankResults, type SearchDoc } from "@/lib/search";

type Hit = { id: string; acronym: string; expansion: string; score: number };

let indexPromise: Promise<MiniSearch<SearchDoc>> | null = null;

/** Fetch and build the index once, on first use. The service worker/CDN caches the JSON. */
function loadIndex() {
  indexPromise ??= fetch("/search-index.json")
    .then((r) => {
      if (!r.ok) throw new Error(`search index ${r.status}`);
      return r.json() as Promise<SearchDoc[]>;
    })
    .then((docs) => {
      const ms = new MiniSearch<SearchDoc>(MINISEARCH_OPTIONS);
      ms.addAll(docs);
      return ms;
    })
    .catch((e) => {
      indexPromise = null; // allow a retry next time
      throw e;
    });
  return indexPromise;
}

/** Lets other components (like the hero search box) open the dialog. */
export const openSearch = () => window.dispatchEvent(new Event("cybersec:search"));

export function SearchDialog() {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [hits, setHits] = useState<Hit[]>([]);
  const [active, setActive] = useState(0);
  const [error, setError] = useState(false);
  const [ready, setReady] = useState(false);
  const index = useRef<MiniSearch<SearchDoc> | null>(null);
  const input = useRef<HTMLInputElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const router = useRouter();
  const listId = useId();

  const show = useCallback(() => {
    setOpen(true);
    loadIndex().then((ms) => { index.current = ms; setError(false); setReady(true); }, () => setError(true));
  }, []);

  const close = useCallback(() => {
    setOpen(false);
    setQuery("");
    setHits([]);
    trigger.current?.focus();
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); show(); }
      else if (e.key === "/" && !open && !(e.target as HTMLElement).closest("input, textarea, [contenteditable]")) { e.preventDefault(); show(); }
    };
    window.addEventListener("keydown", onKey);
    window.addEventListener("cybersec:search", show);
    return () => { window.removeEventListener("keydown", onKey); window.removeEventListener("cybersec:search", show); };
  }, [open, show]);

  useEffect(() => { if (open) input.current?.focus(); }, [open]);

  useEffect(() => {
    const ms = index.current;
    if (!ms || !query.trim()) { setHits([]); return; }
    const raw = ms.search(query) as unknown as Hit[];
    setHits(rankResults(query, raw).slice(0, 12));
    setActive(0);
  }, [query, ready]);

  const go = (h: Hit | undefined) => {
    if (!h) return;
    close();
    router.push(`/acronyms/${h.id}`);
  };

  const onInputKey = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setActive((i) => Math.min(i + 1, hits.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setActive((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); go(hits[active]); }
    else if (e.key === "Escape") { e.preventDefault(); close(); }
  };

  return (
    <>
      <button ref={trigger} type="button" className="search-trigger" onClick={show} aria-label="Search acronyms">
        <span aria-hidden="true">⌕</span>
        <span className="label">Search acronyms…</span>
        <span className="kbd" aria-hidden="true">Ctrl K</span>
      </button>

      {open && (
        <div className="search-backdrop" onMouseDown={(e) => e.target === e.currentTarget && close()}>
          <div className="card search-panel" role="dialog" aria-modal="true" aria-label="Search acronyms">
            <div className="search-input-row">
              <span aria-hidden="true" className="muted">⌕</span>
              <input
                ref={input}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyDown={onInputKey}
                placeholder="Try XSS, zero trust, or 2FA"
                role="combobox"
                aria-expanded={hits.length > 0}
                aria-controls={listId}
                aria-activedescendant={hits[active] ? `${listId}-${hits[active].id}` : undefined}
                aria-autocomplete="list"
                autoComplete="off"
                spellCheck={false}
              />
              <button type="button" className="kbd" onClick={close} aria-label="Close search">Esc</button>
            </div>
            <ul id={listId} role="listbox" className="search-results" aria-label="Results">
              {hits.map((h, i) => (
                <li
                  key={h.id}
                  id={`${listId}-${h.id}`}
                  role="option"
                  aria-selected={i === active}
                  onMouseEnter={() => setActive(i)}
                  onClick={() => go(h)}
                >
                  <span className="abbr">{h.acronym}</span>
                  <span className="exp">{h.expansion}</span>
                </li>
              ))}
            </ul>
            {query && !hits.length && (
              <p className="empty">{error ? "Search couldn't load. Check your connection and try again." : `No acronyms match "${query}".`}</p>
            )}
            <div className="search-foot" aria-live="polite">
              <span>{query ? `${hits.length} result${hits.length === 1 ? "" : "s"}` : "Type to search"}</span>
              <span>↑↓ to move · Enter to open</span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
