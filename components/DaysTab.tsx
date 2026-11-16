"use client";
import { useEffect, useState } from "react";
import { CT, PARK, crTag, dayItems, dayName, parkKey } from "@/lib/plan";
import type { Credit, Day, Item, ParkKey } from "@/lib/types";
import { newId, useStore } from "./store";

export function CrTag({ i }: { i: Pick<Item, "credit" | "n"> }) {
  const t = crTag(i);
  return t ? <span className={`cr ${i.credit}`}>{t}</span> : null;
}

/** Text input that saves on blur, like a native change event. */
export function BlurInput({
  value, onCommit, ...rest
}: { value: string; onCommit: (v: string) => void } & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "defaultValue">) {
  return (
    <input
      key={value}
      defaultValue={value}
      onBlur={(e) => { if (e.target.value !== value) onCommit(e.target.value); }}
      onKeyDown={(e) => { if (e.key === "Enter") (e.target as HTMLInputElement).blur(); }}
      {...rest}
    />
  );
}

export function DaysTab() {
  const { data, edit } = useStore();
  return (
    <section id="days">
      <h2>Day by day</h2>
      <p className="sub">
        Every booking and food stop, with the dining credit each one uses. Tap <b>Edit</b> to change parks, times and
        bookings; everyone on the trip sees changes straight away.
      </p>
      <div className="legend">
        {Object.values(PARK).map(([n, v]) => (
          <span key={n}><i style={{ background: `var(${v})` }} />{n}</span>
        ))}
      </div>
      <div className="days">
        {!data.days.length ? (
          <p className="loading">No days in the plan yet.</p>
        ) : (
          data.days.map((d, i) => (edit ? <DayEdit key={d.id} d={d} i={i} /> : <DayCard key={d.id} d={d} i={i} />))
        )}
      </div>
    </section>
  );
}

const Num = ({ i }: { i: number }) => <div className="day-num">{String(i + 1).padStart(2, "0")}</div>;

function DayCard({ d, i }: { d: Day; i: number }) {
  const items = dayItems(useStore().data.items, d.id);
  const k = parkKey(d.park);
  return (
    <article className="day" style={{ "--c": `var(${PARK[k][1]})` } as React.CSSProperties}>
      <div className="day-head">
        <div>
          <div className="day-date">{dayName(d)}</div>
          <div className="day-park">{d.label}</div>
          {d.event && <span className="tag">{d.event}</span>}
        </div>
        <Num i={i} />
      </div>
      {items.length ? (
        <ul className="tl">
          {items.map((it) => (
            <li key={it.id}>
              <time>{it.time || "All day"}</time>
              <span className={it.used ? "done" : ""}>{it.text || <i>Untitled</i>}<CrTag i={it} /></span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="empty">Nothing booked yet. Free to fill.</div>
      )}
    </article>
  );
}

function DayEdit({ d, i }: { d: Day; i: number }) {
  const { data, update, insert, remove, toast } = useStore();
  const items = dayItems(data.items, d.id);
  const k = parkKey(d.park);
  const [focus, setFocus] = useState<string | null>(null);
  useEffect(() => {
    if (focus) { document.getElementById("x-" + focus)?.focus(); setFocus(null); }
  }, [focus, items.length]);

  const setPark = (park: ParkKey) => {
    const patch: Partial<Day> = { park };
    if (d.label === PARK[k][0]) patch.label = PARK[park][0]; // label still default → follow the colour
    update("days", d.id, patch);
  };
  const setItem = (it: Item, patch: Partial<Item>) => update("items", it.id, patch);

  return (
    <article className="day" style={{ "--c": `var(${PARK[k][1]})` } as React.CSSProperties}>
      <div className="day-head">
        <div>
          <div className="day-date">{dayName(d)}</div>
          <div className="head-edit">
            <select aria-label="Colour" value={k} onChange={(e) => setPark(e.target.value as ParkKey)}>
              {Object.entries(PARK).map(([v, [n]]) => <option key={v} value={v}>{n}</option>)}
            </select>
            <BlurInput type="text" aria-label="Day title" placeholder="Day title" value={d.label}
              onCommit={(v) => update("days", d.id, { label: v })} />
            <BlurInput type="text" aria-label="Special event" placeholder="Special event (optional)" value={d.event}
              onCommit={(v) => update("days", d.id, { event: v })} />
          </div>
        </div>
        <Num i={i} />
      </div>
      <ul className="ed">
        {items.map((it) => (
          <li key={it.id}>
            <div className="row">
              <BlurInput type="time" aria-label="Time" value={it.time || ""} onCommit={(v) => setItem(it, { time: v })} />
              <select aria-label="Dining credit" value={it.credit || ""}
                onChange={(e) => {
                  const credit = (e.target.value || null) as Credit | null;
                  setItem(it, credit === "TS" ? { credit } : { credit, n: 1 });
                }}>
                <option value="">No credit</option>
                {Object.entries(CT).map(([v, [n]]) => <option key={v} value={v}>{n}</option>)}
              </select>
              {it.credit === "TS" ? (
                <select aria-label="Credits" value={it.n === 2 ? "2" : "1"} onChange={(e) => setItem(it, { n: +e.target.value })}>
                  <option value="1">1</option><option value="2">2</option>
                </select>
              ) : (
                <label className="nb">
                  <input type="checkbox" checked={!!it.res} onChange={(e) => setItem(it, { res: e.target.checked ? "todo" : null })} />
                  Needs booking
                </label>
              )}
              <button className="del" aria-label="Delete" onClick={() => { remove("items", it.id); toast("Removed"); }}>×</button>
            </div>
            <div className="row">
              <BlurInput id={"x-" + it.id} type="text" aria-label="Description" placeholder="What's happening?"
                value={it.text} onCommit={(v) => setItem(it, { text: v })} />
            </div>
          </li>
        ))}
      </ul>
      <button className="add" onClick={() => {
        const id = newId();
        insert("items", { id, day_id: d.id, time: "12:00", text: "", credit: null, n: 1, used: false, res: null, conf: null });
        setFocus(id);
      }}>+ Add to this day</button>
    </article>
  );
}
