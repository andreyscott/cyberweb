"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const LINKS = [
  { href: "/", label: "Home", icon: "⌂" },
  { href: "/acronyms", label: "Dictionary", icon: "≡" },
  { href: "/quiz", label: "Quiz", icon: "?" },
  { href: "/flashcards", label: "Flashcards", icon: "⧉" },
];

const isActive = (path: string, href: string) => (href === "/" ? path === "/" : path.startsWith(href));

export function NavLinks() {
  const path = usePathname();
  return (
    <nav className="nav" aria-label="Main">
      {LINKS.slice(1).map((l) => (
        <Link key={l.href} href={l.href} aria-current={isActive(path, l.href) ? "page" : undefined}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}

export function MobileNav() {
  const path = usePathname();
  return (
    <nav className="mobile-nav" aria-label="Main (mobile)">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} aria-current={isActive(path, l.href) ? "page" : undefined}>
          <span className="ico" aria-hidden="true">{l.icon}</span>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
