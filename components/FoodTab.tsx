"use client";
import { useState } from "react";
import { AREA_COLOUR, areaOrder } from "@/lib/plan";
import { useStore } from "./store";
import { AddBtn, EditBtn } from "./RecButtons";

const safeUrl = (u: string) => /^https:\/\//i.test(u || "");

export function FoodTab() {
  const { food } = useStore().data;
  const [sel, setSel] = useState("All");
  const [hiOnly, setHiOnly] = useState(false);
  const rows = food.filter((f) => (sel === "All" || f.area === sel) && (!hiOnly || f.hi));
  return (
    <section id="food">
      <h2>Food wishlist</h2>
      <p className="sub">Everywhere you want to eat, grouped by where it is. High-priority picks are flagged. Tap <b>Edit</b> to add, change or remove spots.</p>
      <div className="filters">
        {["All", ...areaOrder(food)].map((p) => (
          <button key={p} className="chip" aria-pressed={p === sel} onClick={() => setSel(p)}>{p}</button>
        ))}
        <button className="chip" aria-pressed={hiOnly} onClick={() => setHiOnly(!hiOnly)}>High priority only</button>
      </div>
      <div><AddBtn table="food" label="Add a food spot" preset={sel !== "All" ? { area: sel } : undefined} /></div>
      <div className="food">
        {rows.length ? rows.map((f) => (
          <div key={f.id} className="fi" style={{ "--c": `var(${AREA_COLOUR[f.area] || "--muted"})` } as React.CSSProperties}>
            <div className="fih"><b>{f.name}{f.hi && <span className="hi">High</span>}</b><EditBtn table="food" rec={f} /></div>
            <div className="meta">{[f.type, f.area, f.spot].filter(Boolean).join(", ")}</div>
            {f.note && <div className="meta">{f.note}</div>}
            {safeUrl(f.url) && <a href={f.url} target="_blank" rel="noopener noreferrer">View menu<span className="sr-only"> (opens in a new tab)</span></a>}
          </div>
        )) : <p className="sub">Nothing matches that filter.</p>}
      </div>
    </section>
  );
}
