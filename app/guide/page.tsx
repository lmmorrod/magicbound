"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { CATEGORIES, GUIDE, OFFICIAL_SITE } from "@/data/guide";
import { GuideBody } from "@/components/Info";
import { Footer } from "@/components/Footer";

export default function Guide() {
  const [q, setQ] = useState("");
  // Arriving via /guide#id: scroll to it once the page has rendered.
  useEffect(() => { const id = location.hash.slice(1); if (id) document.getElementById(id)?.scrollIntoView(); }, []);
  const needle = q.trim().toLowerCase();
  const hits = GUIDE.filter((g) => !needle || [g.title, g.short, ...g.body, g.tip || ""].join(" ").toLowerCase().includes(needle));
  return (
    <>
      <header className="hero">
        <div className="wrap">
          <div>
            <div className="eyebrow">Magicbound guide</div>
            <h1>New to all this?</h1>
            <p>Lightning Lanes, dining credits, booking windows and the rest, in plain English.</p>
          </div>
        </div>
      </header>
      <main className="wrap guide-page">
        <div className="topbar"><Link href="/trips" className="brand">Magicbound</Link><Link href="/trips" className="btn">Your trips</Link></div>
        <section>
          <input type="search" className="guide-search" placeholder="Search the guide, e.g. ‘multi pass’ or ‘snack’" aria-label="Search the guide"
            value={q} onChange={(e) => setQ(e.target.value)} />
          <div className="guide-cats">
            {CATEGORIES.map((c) => {
              const list = hits.filter((g) => g.category === c);
              if (!list.length) return null;
              return (
                <div key={c}>
                  <h2>{c}</h2>
                  <div className="guide-list">
                    {list.map((g) => (
                      <article key={g.id} id={g.id} className="panel gentry">
                        <h3>{g.title}</h3>
                        <p className="gshort">{g.short}</p>
                        <GuideBody body={g.body} />
                        {g.tip && <p className="banner gtip"><b>Tip:</b> {g.tip}</p>}
                      </article>
                    ))}
                  </div>
                </div>
              );
            })}
            {!hits.length && <p className="sub">Nothing matches that. Try a shorter word.</p>}
          </div>
          <p className="note" style={{ marginTop: 24 }}>
            Our own summaries of how things work, for guidance only. Rules, prices and tiers change, so always confirm on the{" "}
            <a href={OFFICIAL_SITE} target="_blank" rel="noopener noreferrer">official site</a> before you book or pay.
          </p>
        </section>
      </main>
      <Footer />
    </>
  );
}
