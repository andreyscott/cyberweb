export type DomainId =
  | "general"
  | "threats"
  | "architecture"
  | "operations"
  | "governance"
  | "iam"
  | "crypto"
  | "network"
  | "incident";

export type ModelId =
  | "cia"
  | "nist-csf"
  | "mitre-attack"
  | "osi"
  | "owasp-top10"
  | "cis-controls"
  | "iso-27001"
  | "zero-trust";

export interface Domain {
  id: DomainId;
  name: string;
  short: string;
  blurb: string;
  /** Single glyph shown on cards; kept to plain characters so no icon library is needed. */
  glyph: string;
}

export interface Model {
  id: ModelId;
  name: string;
  blurb: string;
}

export interface Acronym {
  /** URL slug, unique. Use a suffix for acronyms with several meanings, e.g. "mac-address". */
  slug: string;
  /** The acronym as written, e.g. "XSS". Several entries may share one when it has several meanings. */
  acronym: string;
  expansion: string;
  domains: DomainId[];
  models?: ModelId[];
  /** Other spellings people type, e.g. "XSRF" for CSRF. */
  aliases?: string[];
  /** Where the term or the thing it names came from. */
  origin: string;
  /** What it covers and where it applies. */
  scope: string;
  /** Slugs of related entries. */
  related?: string[];
}

export interface Question {
  id: string;
  domain: DomainId;
  prompt: string;
  choices: string[];
  answer: number;
  explanation: string;
  /** Acronym slugs this question tests, used for "quiz me on this". */
  about?: string[];
  difficulty?: "easy" | "medium" | "hard";
}
