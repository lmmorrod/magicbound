"use client";
// Quick start: the four things we need before the planner opens. Everything else is built inside the plan.
import { useState } from "react";
import { DAYMS, parseDate } from "@/lib/plan";

export interface Setup {
  destination: string;
  start: string;
  end: string;
  adults: number;
  childAges: number[];
  title: string;
}

const DESTS = [
  { name: "Walt Disney World", where: "Florida", ready: true },
  { name: "Disneyland Paris", where: "France", ready: false },
  { name: "Disneyland Resort", where: "California", ready: false },
];

export const nightsBetween = (a: string, b: string) =>
  a && b ? Math.round((+parseDate(b) - +parseDate(a)) / DAYMS) : 0;

function Stepper({ label, value, min, max, onChange, help }: { label: string; value: number; min: number; max: number; onChange: (n: number) => void; help?: string }) {
  return (
    <div className="stepper">
      <div><b>{label}</b>{help && <span className="help">{help}</span>}</div>
      <div className="stepctl">
        <button type="button" aria-label={`Fewer ${label.toLowerCase()}`} disabled={value <= min} onClick={() => onChange(value - 1)}>−</button>
        <output aria-live="polite">{value}</output>
        <button type="button" aria-label={`More ${label.toLowerCase()}`} disabled={value >= max} onClick={() => onChange(value + 1)}>+</button>
      </div>
    </div>
  );
}

export function QuickStart({ onDone, busy = false }: { onDone: (s: Setup) => void; busy?: boolean }) {
  const [s, setS] = useState<Setup>({ destination: "Walt Disney World", start: "", end: "", adults: 2, childAges: [], title: "" });
  const set = (p: Partial<Setup>) => setS((x) => ({ ...x, ...p }));
  const n = nightsBetween(s.start, s.end);
  const datesOk = !!s.start && !!s.end && n > 0 && n <= 60;
  const people = s.adults + s.childAges.length;
  const title = s.title || `Our trip to ${s.destination}`;

  return (
    <main className="wrap narrow qs">
      <section>
        <div className="eyebrow-dark">New trip</div>
        <h2>Let&apos;s start with the basics</h2>
        <p className="sub">Four quick things and you&apos;re in. Flights, hotels and everything else you add as you go.</p>

        <div className="panel qs-step">
          <h3>Where are you going?</h3>
          <div className="choices">
            {DESTS.map((d) => (
              <button key={d.name} type="button" className="choice" aria-pressed={s.destination === d.name} disabled={!d.ready}
                onClick={() => set({ destination: d.name })}>
                <b>{d.name}</b><span>{d.ready ? d.where : "Coming soon"}</span>
              </button>
            ))}
          </div>
        </div>

        <div className="panel qs-step">
          <h3>When?<span className="prog">{datesOk ? `${n} night${n > 1 ? "s" : ""} · ${n + 1} days` : ""}</span></h3>
          <div className="frow">
            <label className="fld">Arrive<input type="date" value={s.start} onChange={(e) => set({ start: e.target.value })} /></label>
            <label className="fld">Go home<input type="date" value={s.end} min={s.start || undefined} onChange={(e) => set({ end: e.target.value })} /></label>
          </div>
          {s.start && s.end && !datesOk && <p className="status bad">{n <= 0 ? "Going home needs to be after you arrive." : "Trips can be up to 60 nights."}</p>}
          <p className="note" style={{ margin: 0 }}>Not sure yet? Pick rough dates. You can move them later and the plan stretches to fit.</p>
        </div>

        <div className="panel qs-step">
          <h3>Who&apos;s going?<span className="prog">{people} {people === 1 ? "person" : "people"}</span></h3>
          <Stepper label="Adults" value={s.adults} min={1} max={10} onChange={(v) => set({ adults: v })} help="18 and over" />
          <Stepper label="Children" value={s.childAges.length} min={0} max={10} help="Under 18"
            onChange={(v) => set({ childAges: v > s.childAges.length ? [...s.childAges, 8] : s.childAges.slice(0, v) })} />
          {s.childAges.length > 0 && (
            <div className="ages">
              {s.childAges.map((a, i) => (
                <label key={i} className="fld">Child {i + 1} age on arrival
                  <select value={a} onChange={(e) => set({ childAges: s.childAges.map((x, j) => (j === i ? +e.target.value : x)) })}>
                    {Array.from({ length: 18 }, (_, k) => <option key={k} value={k}>{k === 0 ? "Under 1" : k}</option>)}
                  </select>
                </label>
              ))}
              <p className="note" style={{ margin: 0, gridColumn: "1/-1" }}>Ages change ticket and dining prices. Under-3s go free and don&apos;t need dining credits.</p>
            </div>
          )}
        </div>

        <div className="panel qs-step">
          <h3>Call it something</h3>
          <label className="fld">Trip name<input type="text" value={s.title} placeholder={title} onChange={(e) => set({ title: e.target.value })} /></label>
        </div>

        <div className="dact" style={{ marginTop: 18 }}>
          <span className="note" style={{ margin: 0 }}>{datesOk ? "" : "Add your dates to carry on."}</span>
          <span style={{ flex: 1 }} />
          <button className="btn pri" disabled={!datesOk || busy} onClick={() => onDone({ ...s, title })}>{busy ? "Setting up…" : "Start planning →"}</button>
        </div>
      </section>
    </main>
  );
}
