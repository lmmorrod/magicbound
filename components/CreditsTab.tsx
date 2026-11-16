"use client";
import { Info } from "./Info";
import { useState } from "react";
import { AREA_COLOUR, CREDITS, CT, areaOrder, creditOrder, creditStats, creditStatus, creditWeight, dayName, qsPlaced } from "@/lib/plan";
import type { Credit, Trip } from "@/lib/types";
import { newId, useStore } from "./store";
import { AddBtn, EditBtn } from "./RecButtons";

const ALLOW_FIELD: Record<Credit, keyof Trip> = { TS: "credits_ts", QS: "credits_qs", SN: "credits_sn" };

export function CreditsTab() {
  return (
    <section id="credits">
      <h2>Dining credits<Info id="dining-plan" /></h2>
      <p className="sub">
        Every credit on the dining plan, scheduled or loose. Loose credits are ones you&apos;ve earmarked but not pinned to a
        day. Tap any meal to change its name, day, time or credit type; the day plan and calendar update to match. Tick
        them off on the trip as you use them.
      </p>
      <div className="grid3">{CREDITS.map((k) => <CreditPanel key={k} k={k} />)}</div>
      <QsWishlist />
      <div className="grid2" style={{ marginTop: 18 }}>
        <ParkHoursPanel />
      </div>
    </section>
  );
}

function CreditPanel({ k }: { k: Credit }) {
  const { data, canWrite, edit, update, updateTrip, insert, openDialog } = useStore();
  const { days, items, trip } = data;
  const [name, colour] = CT[k];
  const allow = +(trip[ALLOW_FIELD[k]] as number) || 0;
  const s = creditStats(items, k, allow);
  const st = creditStatus(s);
  const ordered = creditOrder(items.filter((i) => i.credit === k), days);
  const [loose, setLoose] = useState("");
  const where = (id: string | null) => { const d = days.find((x) => x.id === id); return d ? `${dayName(d)}, ${d.label}` : "Loose, no day yet"; };

  return (
    <div className="panel cpanel" style={{ "--k": `var(${colour})` } as React.CSSProperties}>
      <h3>
        <span>{name}<Info id={k === "TS" ? "credit-ts" : k === "QS" ? "credit-qs" : "credit-sn"} /></span>
        {edit && (
          <span className="allow">
            <label htmlFor={`al-${k}`}>On plan</label>
            <input type="number" min={0} max={99} id={`al-${k}`} key={allow} defaultValue={allow}
              onBlur={(e) => {
                const n = Math.max(0, Math.min(99, parseInt(e.target.value) || 0));
                if (n !== allow) updateTrip({ [ALLOW_FIELD[k]]: n });
              }} />
          </span>
        )}
      </h3>
      <div className="big">{s.total} <small>of {allow} accounted for</small></div>
      <div className="meter" role="img" aria-label={`${s.scheduled} scheduled, ${s.loose} loose, ${s.used} used, of ${allow}`}>
        {s.cells.map((c, j) => <span key={j} className={c} />)}
      </div>
      <div className="key"><span>■ scheduled {s.scheduled}</span><span>▨ loose {s.loose}<Info id="loose-credit" /></span><span>used {s.used}</span></div>
      <p className={`status${st.bad ? " bad" : ""}`}>{st.text}</p>
      <ul className="clist">
        {ordered.length ? ordered.map((i) => (
          <li key={i.id}>
            <input type="checkbox" checked={i.used} disabled={!canWrite} aria-label={`Used ${i.text}`}
              onChange={(e) => update("items", i.id, { used: e.target.checked })} />
            <button type="button" className="cbtn" disabled={!canWrite} onClick={() => openDialog({ kind: "item", item: i })}>
              <span className={i.used ? "done" : ""}>{i.text || "Untitled"}</span>
              <span className="when">{where(i.day_id)}{i.day_id !== null && i.time ? ` at ${i.time}` : ""}</span>
            </button>
            <span className="n">
              {creditWeight(k, i)}
              {canWrite && <> <button type="button" className="eb" aria-label={`Change ${i.text}`} onClick={() => openDialog({ kind: "item", item: i })}>✎</button></>}
            </span>
          </li>
        )) : <li style={{ gridTemplateColumns: "1fr", color: "var(--muted)" }}>None yet.</li>}
      </ul>
      {canWrite && (
        <form className="loose" onSubmit={(e) => {
          e.preventDefault();
          const text = loose.trim();
          if (!text) return;
          setLoose("");
          insert("items", { id: newId(), day_id: null, time: null, text, credit: k, n: 1, used: false, res: null, conf: null });
        }}>
          <input type="text" value={loose} onChange={(e) => setLoose(e.target.value)}
            placeholder={`Add a loose ${name.toLowerCase()} credit`} aria-label={`Add a loose ${name.toLowerCase()} credit`} />
          <button type="submit">Add</button>
        </form>
      )}
    </div>
  );
}

function QsWishlist() {
  const { data, canWrite, edit, insert, toast } = useStore();
  const { qs_wish, items, days } = data;
  let placed = 0;
  const groups = areaOrder(qs_wish).map((area) => {
    const rows = qs_wish.filter((q) => q.area === area);
    if (!rows.length) return null;
    return (
      <div key={area}>
        <div className="grp">{area}</div>
        <div className="ideas">
          {rows.map((q) => {
            const st = qsPlaced(q.key || q.name, items, days);
            if (st) placed++;
            return (
              <div key={q.id} className="idea" style={{ "--c": `var(${AREA_COLOUR[area] || "--muted"})` } as React.CSSProperties}>
                <div style={{ minWidth: 0 }}>
                  <b>{q.name}</b>
                  <span className={`st${st ? " on" : ""}`}>{st ? "✓ " + st : "Not placed yet"}</span>
                </div>
                <span className="acts">
                  {!st && canWrite && !edit && (
                    <button onClick={() => {
                      insert("items", { id: newId(), day_id: null, time: null, text: q.name, credit: "QS", n: 1, used: false, res: null, conf: null });
                      toast("Added as a loose quick-service credit");
                    }}>+ Add</button>
                  )}
                  <EditBtn table="qs_wish" rec={q} />
                </span>
              </div>
            );
          })}
        </div>
      </div>
    );
  });
  return (
    <div className="panel" style={{ marginTop: 18 }}>
      <h3><span>Quick-service wishlist<Info id="mobile-order" label="mobile order" /></span><span className="prog">{placed}/{qs_wish.length} in the plan</span></h3>
      <p className="note" style={{ margin: "0 0 14px" }}>
        The quick-service spots you want to try, grouped by where they are. Each shows whether it&apos;s in the plan yet.
        Ones still to place can go in as a loose credit now and be pinned to a day later.
      </p>
      {qs_wish.length ? groups : <p className="note">No spots on the wishlist yet.</p>}
      <AddBtn table="qs_wish" label="Add a spot to the wishlist" />
    </div>
  );
}

function ParkHoursPanel() {
  const { data, edit } = useStore();
  return (
    <div className="panel">
      <h3><span>Park hours<Info id="park-hours" /></span></h3>
      <div className="scroll">
        <table>
          <thead><tr><th>Park</th><th>Opens</th><th>Closes</th>{edit && <th />}</tr></thead>
          <tbody>
            {data.park_hours.map((h) => (
              <tr key={h.id}>
                <td>{h.park}</td><td className="n">{h.opens}</td><td className="n">{h.closes}</td>
                {edit && <td style={{ width: "1%" }}><EditBtn table="park_hours" rec={h} /></td>}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <AddBtn table="park_hours" label="Add a row" />
      <p className="note">* Early entry. Parks publish hours a few months ahead, so update these when they&apos;re out.</p>
    </div>
  );
}
