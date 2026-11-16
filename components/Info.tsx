"use client";
// Small ⓘ button that explains a term in place, from the guide.
import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import { OFFICIAL_SITE, guideById } from "@/data/guide";
import { parseDate } from "@/lib/plan";
import { useMaybeStore } from "./store";

export function GuideBody({ body }: { body: string[] }) {
  // Group "• " lines into lists, everything else into paragraphs.
  const out: React.ReactNode[] = [];
  let list: string[] = [];
  const flush = () => { if (list.length) { out.push(<ul key={out.length}>{list.map((l) => <li key={l}>{l}</li>)}</ul>); list = []; } };
  body.forEach((line) => {
    if (line.startsWith("• ")) list.push(line.slice(2));
    else { flush(); out.push(<p key={out.length}>{line}</p>); }
  });
  flush();
  return <div className="gbody">{out}</div>;
}

export const fmtChecked = (iso?: string) =>
  iso ? parseDate(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" }) : "";

export function Info({ id, label }: { id: string; label?: string }) {
  const g = guideById(id);
  const store = useMaybeStore();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    // Rendered into <body> (a dialog can't sit inside a heading or paragraph); open it once mounted.
    if (open && ref.current && !ref.current.open) ref.current.showModal();
  }, [open]);
  if (!g) return null;
  const portalTarget = typeof document !== "undefined" ? document.body : null;
  const checked = fmtChecked(store?.data.rules.last_checked);
  return (
    <>
      <button type="button" className="info" aria-label={`About ${label || g.title}`} title={g.short}
        onClick={(e) => { e.stopPropagation(); setOpen(true); }}>i</button>
      {open && portalTarget && createPortal(<dialog ref={ref} className="sheet guide" onClose={() => setOpen(false)} aria-labelledby={`g-${id}`}
        onClick={(e) => { e.stopPropagation(); if (e.target === e.currentTarget) setOpen(false); }}>
        {
          <>
            <div className="eyebrow-dark">{g.category}</div>
            <h3 id={`g-${id}`}>{g.title}</h3>
            <p className="gshort">{g.short}</p>
            <div className="sheet-body">
              <GuideBody body={g.body} />
              {g.tip && <p className="banner gtip"><b>Tip:</b> {g.tip}</p>}
              <p className="note">Guidance{checked ? `, last checked ${checked}` : ""}. Rules and prices change, so confirm on the <a href={OFFICIAL_SITE} target="_blank" rel="noopener noreferrer">official site</a> before booking.</p>
            </div>
            <div className="dact">
              <Link href={`/guide#${id}`} className="linkbtn" target="_blank">Open the full guide</Link>
              <span style={{ flex: 1 }} />
              <button className="btn pri" onClick={() => setOpen(false)}>Got it</button>
            </div>
          </>
        }
      </dialog>, portalTarget)}
    </>
  );
}
