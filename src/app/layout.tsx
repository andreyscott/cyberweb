import type { Metadata, Viewport } from "next";
import { IBM_Plex_Mono, IBM_Plex_Sans } from "next/font/google";
import Link from "next/link";
import { NavLinks, MobileNav } from "@/components/NavLinks";
import { SearchDialog } from "@/components/SearchDialog";
import { SyncOnFocus } from "@/components/SyncOnFocus";
import { SITE_URL } from "@/lib/site";
import "./globals.css";

const sans = IBM_Plex_Sans({ subsets: ["latin"], weight: ["400", "500", "600", "700"], variable: "--font-plex-sans", display: "swap" });
const mono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "600", "700"], variable: "--font-plex-mono", display: "swap" });

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: { default: "CyberSec: Cybersecurity Acronyms Decoded", template: "%s · CyberSec" },
  description: "Look up any cybersecurity acronym, learn where it came from and what it covers, then test yourself with quizzes and spaced-repetition flashcards.",
  applicationName: "CyberSec",
  openGraph: { type: "website", siteName: "CyberSec" },
  twitter: { card: "summary_large_image" },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: dark)", color: "#0a0e13" },
    { media: "(prefers-color-scheme: light)", color: "#f4f6f8" },
  ],
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <header className="site-header">
          <div className="container">
            <Link href="/" className="brand" aria-label="CyberSec home">
              cyber<b>Sec</b><span className="cursor" aria-hidden="true" />
            </Link>
            <NavLinks />
            <div className="header-spacer" />
            <SearchDialog />
          </div>
        </header>
        <main>{children}</main>
        <footer className="site-footer">
          <div className="container">
            <span>© {new Date().getFullYear()} CyberSec. Built for learners.</span>
            <nav aria-label="Footer">
              <Link href="/acronyms">Dictionary</Link>
              <Link href="/quiz">Quiz</Link>
              <Link href="/flashcards">Flashcards</Link>
            </nav>
          </div>
        </footer>
        <MobileNav />
        <SyncOnFocus />
      </body>
    </html>
  );
}
