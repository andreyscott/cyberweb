"use client";

import { openSearch } from "./SearchDialog";

export function HeroSearch() {
  return (
    <button type="button" className="hero-search" onClick={openSearch}>
      <span aria-hidden="true">⌕</span>
      <span style={{ flex: 1 }}>Search acronyms: XSS, SIEM, OAuth…</span>
      <span className="kbd" aria-hidden="true">/</span>
    </button>
  );
}
