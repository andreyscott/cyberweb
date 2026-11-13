import Link from "next/link";

export default function NotFound() {
  return (
    <div className="container" style={{ paddingTop: 80, textAlign: "center" }}>
      <p className="mono" style={{ fontSize: 64, color: "var(--accent)", fontWeight: 700 }}>404</p>
      <h1 style={{ fontSize: 26, marginTop: 8 }}>That page isn&apos;t in the dictionary</h1>
      <p className="muted" style={{ marginTop: 10 }}>Try searching for the acronym instead.</p>
      <div className="hero-actions" style={{ justifyContent: "center" }}>
        <Link className="btn btn-primary" href="/acronyms">Browse A–Z</Link>
        <Link className="btn" href="/">Home</Link>
      </div>
    </div>
  );
}
