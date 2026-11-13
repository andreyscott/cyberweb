import type { Domain, DomainId, Model, ModelId } from "./types";

export const DOMAINS: Domain[] = [
  { id: "general", name: "General Security Concepts", short: "Concepts", glyph: "◆", blurb: "Core principles every other domain builds on: the CIA triad, AAA, and security controls." },
  { id: "threats", name: "Threats, Vulnerabilities & Attacks", short: "Threats", glyph: "⚠", blurb: "How attackers get in: malware, web attacks, social engineering, and the catalogues that track them." },
  { id: "architecture", name: "Security Architecture", short: "Architecture", glyph: "▦", blurb: "Designing systems that stay secure: segmentation, cloud models, zero trust, and secure edges." },
  { id: "operations", name: "Security Operations", short: "Operations", glyph: "◉", blurb: "Day-to-day defence: monitoring, detection, response tooling, and secure development testing." },
  { id: "governance", name: "Governance, Risk & Compliance", short: "GRC", glyph: "§", blurb: "Laws, standards, and planning: privacy regulation, continuity targets, and risk management." },
  { id: "iam", name: "Identity & Access Management", short: "Identity", glyph: "⚿", blurb: "Proving who someone is and deciding what they may do: authentication, federation, and access models." },
  { id: "crypto", name: "Cryptography & PKI", short: "Crypto", glyph: "∑", blurb: "Ciphers, hashes, certificates, and the hardware that protects keys." },
  { id: "network", name: "Network Security", short: "Network", glyph: "⇄", blurb: "Protecting traffic and the networks it crosses: firewalls, tunnels, segmentation, and protocols." },
  { id: "incident", name: "Incident Response & Forensics", short: "Incident", glyph: "✚", blurb: "Detecting, containing, and learning from incidents, plus the metrics that measure response." },
];

export const MODELS: Model[] = [
  { id: "cia", name: "CIA Triad", blurb: "Confidentiality, integrity, and availability: the three goals most security controls serve." },
  { id: "nist-csf", name: "NIST Cybersecurity Framework", blurb: "Govern, Identify, Protect, Detect, Respond, Recover: a common language for managing cyber risk." },
  { id: "mitre-attack", name: "MITRE ATT&CK", blurb: "A knowledge base of real-world adversary tactics and techniques." },
  { id: "osi", name: "OSI Model", blurb: "Seven layers describing how data moves across a network, from physical to application." },
  { id: "owasp-top10", name: "OWASP Top 10", blurb: "The most critical web application security risks, updated every few years." },
  { id: "cis-controls", name: "CIS Controls", blurb: "A prioritised set of safeguards against the most common attacks." },
  { id: "iso-27001", name: "ISO/IEC 27001", blurb: "The international standard for an information security management system (ISMS)." },
  { id: "zero-trust", name: "Zero Trust", blurb: "Never trust by network location; verify every request explicitly." },
];

export const domainById = Object.fromEntries(DOMAINS.map((d) => [d.id, d])) as Record<DomainId, Domain>;
export const modelById = Object.fromEntries(MODELS.map((m) => [m.id, m])) as Record<ModelId, Model>;
