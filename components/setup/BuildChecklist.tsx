"use client";
// "Build your trip" panel. Each step edits the real plan through the store, so
// what you add shows up on the days, calendar, reservations and budget at once.
import { useEffect, useRef, useState } from "react";
import { PARK, addDays, dayName, nights, parseDate, shortDate, toISODate } from "@/lib/plan";
import type { Item, ParkKey } from "@/lib/types";
import { newId, useStore } from "../store";
import { HOTELS, PLANS, benefits, hotelById, type PlanKey } from "@/data/hotels";
import type { Setup } from "./QuickStart";

type StepId = "flights" | "stays" | "dining" | "parks" | "invite" | "extras";

function Sheet({ open, title, sub, onClose, children, footer }: { open: boolean; title: string; sub?: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="sheet" onClose={onClose} aria-label={title}>
      <h3>{title}</h3>
      {sub && <p className="dsub">{sub}</p>}
      <div className="sheet-body">{children}</div>
      <div className="dact">{footer}</div>
    </dialog>
  );
}

export function BuildChecklist({ setup }: { setup: Setup }) {
  const { data, update, updateTrip, insert, remove, toast } = useStore();
  const { trip, days } = data;
  const [open, setOpen] = useState<StepId | null>(null);
  const [done, setDone] = useState<Partial<Record<StepId, string>>>({});
  const [hidden, setHidden] = useState(false);
  const auto = useRef<Partial<Record<StepId, string[]>>>({}); // items each step created, replaced on re-save
  const eligible = setup.adults + setup.childAges.filter((a) => a >= 3).length;
  const n = nights(trip);

  const finish = (id: StepId, summary: string, items: Item[] = []) => {
    (auto.current[id] || []).forEach((i) => remove("items", i));
    items.forEach((i) => insert("items", i));
    auto.current[id] = items.map((i) => i.id);
    setDone((d) => ({ ...d, [id]: summary }));
    setOpen(null);
    toast("Added to your plan");
  };
  const item = (p: Partial<Item>): Item => ({ id: newId(), day_id: null, time: null, text: "", credit: null, n: 1, used: false, res: null, conf: null, ...p });
  const dayOn = (iso: string) => days.find((d) => d.date === iso)?.id ?? null;
  const first = days[0], last = days[days.length - 1];

  const steps: [StepId | "basics", string, string][] = [
    ["basics", "Dates and who's going", `${n} nights · ${setup.adults} adult${setup.adults > 1 ? "s" : ""}${setup.childAges.length ? ` · ${setup.childAges.length} child${setup.childAges.length > 1 ? "ren" : ""}` : ""}`],
    ["flights", "Flights", "Times go on your travel days and set the countdown"],
    ["stays", "Where you're staying", "One hotel or a few. Unlocks on-site perks and booking dates"],
    ["dining", "Dining plan", "Works out your credits for every night"],
    ["parks", "Park days", "Pick a park for each day, or leave some free"],
    ["invite", "Invite someone", "Plan together; changes show up live"],
    ["extras", "Tickets and extras", "Adds them to the budget so nothing's forgotten"],
  ];
  const count = 1 + Object.keys(done).length;

  if (hidden)
    return <button className="add" style={{ margin: "0 0 16px" }} onClick={() => setHidden(false)}>Show &ldquo;Build your trip&rdquo; ({count}/{steps.length})</button>;

  return (
    <div className="panel build">
      <h3>Build your trip<span className="prog">{count}/{steps.length} done</span></h3>
      <div className="meter" style={{ "--k": "var(--accent)" } as React.CSSProperties} aria-hidden="true">
        {steps.map(([id], i) => <span key={i} className={id === "basics" || done[id as StepId] ? "s" : ""} />)}
      </div>
      <ol className="steps">
        {steps.map(([id, label, hint]) => {
          const isDone = id === "basics" || !!done[id as StepId];
          return (
            <li key={id} className={isDone ? "isdone" : ""}>
              <span className="tick" aria-hidden="true">{isDone ? "✓" : ""}</span>
              <div style={{ minWidth: 0 }}>
                <b>{label}</b>
                <span className="hint">{id === "basics" ? hint : done[id as StepId] || hint}</span>
              </div>
              {id !== "basics" && (
                <button className="btn" onClick={() => setOpen(id as StepId)}>{isDone ? "Change" : "Add"}</button>
              )}
            </li>
          );
        })}
      </ol>
      <button className="linkbtn" onClick={() => setHidden(true)}>Hide for now</button>

      <FlightsSheet open={open === "flights"} onClose={() => setOpen(null)}
        onSave={(f) => {
          if (f.mode === "later") {
            finish("flights", "Not booked yet · reminder on Reservations", [item({ day_id: first?.id, text: "Book flights", res: "todo" })]);
            return;
          }
          if (f.arrive && first) updateTrip({ arrival_time: `${first.date}T${f.arrive}:00`, origin: f.from || trip.origin });
          finish("flights", `${f.outNo || "Outbound"} ${f.depart}→${f.arrive} · ${f.retNo || "Return"} ${f.retDepart}`, [
            item({ day_id: first?.id, time: f.depart || null, text: `✈ ${f.outNo} ${f.from} → Orlando, lands ${f.arrive}`.replace(/\s+/g, " ") }),
            item({ day_id: last?.id, time: f.retDepart || null, text: `✈ ${f.retNo} Orlando → ${f.from}`.replace(/\s+/g, " ") }),
          ]);
        }} />

      <StaysSheet open={open === "stays"} onClose={() => setOpen(null)} start={trip.start_date} end={trip.end_date}
        onSave={(stays) => {
          const onsite = stays.filter((s) => hotelById(s.hotel)?.onSite);
          updateTrip({ on_site_hotel: onsite.length > 0, checkin_date: (onsite[0] || stays[0]).from });
          const its: Item[] = [];
          stays.forEach((s) => {
            const h = hotelById(s.hotel)!;
            its.push(item({ day_id: dayOn(s.from), time: "15:00", text: `Check in: ${h.name}` }));
            if (s.to !== trip.end_date) its.push(item({ day_id: dayOn(s.to), time: "11:00", text: `Check out: ${h.name}` }));
          });
          finish("stays", stays.map((s) => `${hotelById(s.hotel)!.name.split(" –")[0]} (${nightsOf(s)} nt)`).join(" then "), its);
        }} />

      <DiningSheet open={open === "dining"} onClose={() => setOpen(null)} nights={n} eligible={eligible} kids={setup.childAges}
        onSave={(k, c) => {
          updateTrip({ credits_ts: c.TS, credits_qs: c.QS, credits_sn: c.SN });
          finish("dining", k === "none" ? "No dining plan" : `${PLANS[k].label}: ${c.TS} TS · ${c.QS} QS · ${c.SN} snacks`);
        }} />

      <ParksSheet open={open === "parks"} onClose={() => setOpen(null)}
        onSave={(set) => {
          Object.entries(set).forEach(([id, park]) => update("days", id, { park, label: PARK[park][0] }));
          const c = Object.values(set).filter((p) => !["TR", "CH"].includes(p)).length;
          finish("parks", `${c} park day${c === 1 ? "" : "s"} planned`);
        }} />

      <Sheet open={open === "invite"} title="Invite someone" sub="They'll get an email link. Editors can change the plan; viewers can only look." onClose={() => setOpen(null)}
        footer={<><span style={{ flex: 1 }} /><button className="btn" onClick={() => setOpen(null)}>Cancel</button>
          <button className="btn pri" onClick={() => finish("invite", "Invite ready to send (sharing lands in milestone 3)")}>Send invite</button></>}>
        <label className="fld">Their email<input type="email" placeholder="name@example.com" /></label>
        <label className="fld">They can<select defaultValue="editor"><option value="editor">Edit the plan</option><option value="viewer">Only view it</option></select></label>
        <p className="note">Preview only: nothing is sent yet.</p>
      </Sheet>

      <ExtrasSheet open={open === "extras"} onClose={() => setOpen(null)} people={setup.adults + setup.childAges.length}
        onSave={(lines) => {
          lines.forEach((l, i) => insert("budget", { id: newId(), name: l, cost: null, paid: 0, note: "", order: 100 + i }));
          setDone((d) => ({ ...d, extras: `${lines.length} added to the budget, ready to price` }));
          setOpen(null);
          toast("Added to your budget");
        }} />
    </div>
  );
}

// ---------- flights ----------
interface Flights { mode: "lookup" | "manual" | "later"; outNo: string; retNo: string; from: string; depart: string; arrive: string; retDepart: string }
function FlightsSheet({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (f: Flights) => void }) {
  const [f, setF] = useState<Flights>({ mode: "lookup", outNo: "", retNo: "", from: "", depart: "", arrive: "", retDepart: "" });
  const [found, setFound] = useState(false);
  const set = (p: Partial<Flights>) => setF((x) => ({ ...x, ...p }));
  const lookup = () => {
    // Preview: a real lookup calls a flight-data service. These are made-up results.
    set({ from: "London Gatwick", depart: "10:55", arrive: "15:20", retDepart: "18:40", mode: "lookup" });
    setFound(true);
  };
  return (
    <Sheet open={open} title="Flights" sub="Your times go onto the first and last day, and the countdown counts down to landing." onClose={onClose}
      footer={<><span style={{ flex: 1 }} /><button className="btn" onClick={onClose}>Cancel</button>
        <button className="btn pri" disabled={f.mode !== "later" && !f.depart} onClick={() => onSave(f)}>Save</button></>}>
      <div className="viewtog" role="group" aria-label="How to add flights">
        {([["lookup", "Flight number"], ["manual", "Type them in"], ["later", "Not booked yet"]] as const).map(([k, l]) => (
          <button key={k} aria-pressed={f.mode === k} onClick={() => set({ mode: k })}>{l}</button>
        ))}
      </div>
      {f.mode === "later" ? (
        <p style={{ fontSize: 14 }}>No problem. We&apos;ll add <b>Book flights</b> to your Reservations so it doesn&apos;t get forgotten. Come back here when they&apos;re booked.</p>
      ) : (
        <>
          <div className="frow">
            <label className="fld">Outbound flight no.<input type="text" value={f.outNo} placeholder="e.g. BA2037" onChange={(e) => set({ outNo: e.target.value.toUpperCase() })} /></label>
            <label className="fld">Return flight no.<input type="text" value={f.retNo} placeholder="e.g. BA2036" onChange={(e) => set({ retNo: e.target.value.toUpperCase() })} /></label>
          </div>
          {f.mode === "lookup" && !found && (
            <>
              <button className="btn" disabled={!f.outNo} onClick={lookup}>Look them up</button>
              <p className="note">Preview: the lookup fills in made-up times. The real one needs a flight-data service.</p>
            </>
          )}
          {(f.mode === "manual" || found) && (
            <>
              {found && <p className="banner">Found it. Check the times look right.</p>}
              <label className="fld">Flying from<input type="text" value={f.from} placeholder="e.g. Manchester" onChange={(e) => set({ from: e.target.value })} /></label>
              <div className="frow">
                <label className="fld">Departs (outbound)<input type="time" value={f.depart} onChange={(e) => set({ depart: e.target.value })} /></label>
                <label className="fld">Lands in Orlando<input type="time" value={f.arrive} onChange={(e) => set({ arrive: e.target.value })} /></label>
              </div>
              <label className="fld">Departs Orlando (return)<input type="time" value={f.retDepart} onChange={(e) => set({ retDepart: e.target.value })} /></label>
            </>
          )}
        </>
      )}
    </Sheet>
  );
}

// ---------- stays ----------
interface Stay { hotel: string; from: string; to: string }
const nightsOf = (s: Stay) => Math.round((+parseDate(s.to) - +parseDate(s.from)) / 864e5);
function StaysSheet({ open, onClose, onSave, start, end }: { open: boolean; onClose: () => void; onSave: (s: Stay[]) => void; start: string; end: string }) {
  const [stays, setStays] = useState<Stay[]>([{ hotel: "", from: start, to: end }]);
  const total = Math.round((+parseDate(end) - +parseDate(start)) / 864e5);
  const nightList = Array.from({ length: total }, (_, i) => toISODate(addDays(parseDate(start), i)));
  const cover = nightList.map((d) => stays.filter((s) => s.hotel && s.from <= d && d < s.to).length);
  const gaps = cover.filter((c) => c === 0).length, clashes = cover.filter((c) => c > 1).length;
  const setStay = (i: number, p: Partial<Stay>) => setStays((l) => l.map((s, j) => (j === i ? { ...s, ...p } : s)));
  const ok = stays.every((s) => s.hotel && s.from < s.to) && !clashes;
  const tiers = [...new Set(HOTELS.map((h) => h.tier))];

  return (
    <Sheet open={open} title="Where you're staying" sub="Add each hotel in order. Splitting a stay is fine." onClose={onClose}
      footer={<><span className="note" style={{ margin: 0 }}>{gaps ? `${gaps} night${gaps > 1 ? "s" : ""} not covered yet` : ""}</span><span style={{ flex: 1 }} />
        <button className="btn" onClick={onClose}>Cancel</button><button className="btn pri" disabled={!ok} onClick={() => onSave(stays)}>Save</button></>}>
      <div className="nights" aria-label="Nights covered">
        {nightList.map((d, i) => <span key={d} title={shortDate(d)} className={cover[i] === 0 ? "gap" : cover[i] > 1 ? "clash" : "ok"} />)}
      </div>
      {stays.map((s, i) => {
        const h = hotelById(s.hotel);
        return (
          <div key={i} className="stay">
            <div className="fih"><b>Stay {i + 1}{s.hotel && s.from < s.to ? ` · ${nightsOf(s)} nights` : ""}</b>
              {stays.length > 1 && <button className="eb" aria-label="Remove this stay" onClick={() => setStays((l) => l.filter((_, j) => j !== i))}>×</button>}</div>
            <label className="fld">Hotel
              <select value={s.hotel} onChange={(e) => setStay(i, { hotel: e.target.value })}>
                <option value="">Choose…</option>
                {tiers.map((t) => <optgroup key={t} label={t}>{HOTELS.filter((x) => x.tier === t).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</optgroup>)}
              </select>
            </label>
            <div className="frow">
              <label className="fld">Check in<input type="date" value={s.from} min={start} max={end} onChange={(e) => setStay(i, { from: e.target.value })} /></label>
              <label className="fld">Check out<input type="date" value={s.to} min={start} max={end} onChange={(e) => setStay(i, { to: e.target.value })} /></label>
            </div>
            {h && (
              <div className="perks">
                <span className={`pill ${h.onSite ? "booked" : "todo"}`}>{h.onSite ? `On-site · ${h.tier}` : "Off-site"}</span>
                <ul>{benefits(h).map((b) => <li key={b}>{b}</li>)}</ul>
                {h.onSite && (
                  <table className="times"><tbody>
                    {(["MK", "EP", "HS", "AK"] as const).map((p) => h.times[p] && (
                      <tr key={p}><td>{PARK[p][0]}</td><td className="n">~{h.times[p]![0]} min</td><td>{h.times[p]![1]}</td></tr>
                    ))}
                  </tbody></table>
                )}
              </div>
            )}
          </div>
        );
      })}
      <button className="add addin" disabled={nightsOf(stays[stays.length - 1]) < 2} onClick={() => {
        // Split the last stay at its midpoint; the new hotel takes the second half.
        const lastStay = stays[stays.length - 1];
        const mid = toISODate(addDays(parseDate(lastStay.from), Math.floor(nightsOf(lastStay) / 2)));
        setStays((l) => [...l.slice(0, -1), { ...lastStay, to: mid }, { hotel: "", from: mid, to: lastStay.to }]);
      }}>+ Add another hotel (split stay)</button>
      <p className="note">Journey times are typical door-to-gate estimates. Guidance only.</p>
    </Sheet>
  );
}

// ---------- dining ----------
function DiningSheet({ open, onClose, onSave, nights: n, eligible, kids }: { open: boolean; onClose: () => void; onSave: (k: PlanKey, c: { TS: number; QS: number; SN: number }) => void; nights: number; eligible: number; kids: number[] }) {
  const [k, setK] = useState<PlanKey>("standard");
  const calc = (p: PlanKey) => ({ TS: PLANS[p].per.TS * n * eligible, QS: PLANS[p].per.QS * n * eligible, SN: PLANS[p].per.SN * n * eligible });
  const [c, setC] = useState(calc("standard"));
  useEffect(() => setC(calc(k)), [k, n, eligible]); // eslint-disable-line react-hooks/exhaustive-deps
  const under3 = kids.filter((a) => a < 3).length;
  return (
    <Sheet open={open} title="Dining plan" sub={`${n} nights × ${eligible} ${eligible === 1 ? "person" : "people"} aged 3+${under3 ? ` (${under3} under-3 eat from your plate)` : ""}.`} onClose={onClose}
      footer={<><span style={{ flex: 1 }} /><button className="btn" onClick={onClose}>Cancel</button><button className="btn pri" onClick={() => onSave(k, c)}>Save</button></>}>
      <div className="choices col">
        {(Object.keys(PLANS) as PlanKey[]).map((p) => (
          <button key={p} type="button" className="choice" aria-pressed={k === p} onClick={() => setK(p)}>
            <b>{PLANS[p].label}</b><span>{PLANS[p].note}</span>
          </button>
        ))}
      </div>
      {k !== "none" && (
        <div className="frow" style={{ marginTop: 12 }}>
          {(["TS", "QS", "SN"] as const).map((x) => (
            <label key={x} className="fld">{x === "TS" ? "Table service" : x === "QS" ? "Quick service" : "Snacks"}
              <input type="number" min={0} max={99} value={c[x]} onChange={(e) => setC({ ...c, [x]: Math.max(0, Math.min(99, +e.target.value || 0)) })} />
            </label>
          ))}
        </div>
      )}
      {k !== "none" && <p className="note">Worked out for you. Change any number if your package is different.</p>}
    </Sheet>
  );
}

// ---------- park days ----------
const CHIPS: ParkKey[] = ["MK", "EP", "HS", "AK", "UNI", "CH"];
function ParksSheet({ open, onClose, onSave }: { open: boolean; onClose: () => void; onSave: (s: Record<string, ParkKey>) => void }) {
  const { days } = useStore().data;
  const [pick, setPick] = useState<ParkKey>("MK");
  const [set, setSet] = useState<Record<string, ParkKey>>({});
  const mid = days.slice(1, -1);
  return (
    <Sheet open={open} title="Park days" sub="Pick a park, then tap the days for it. Tap again to clear. Your first and last days stay as travel days." onClose={onClose}
      footer={<><span style={{ flex: 1 }} /><button className="btn" onClick={onClose}>Decide later</button><button className="btn pri" onClick={() => onSave(set)}>Save</button></>}>
      <div className="filters">
        {CHIPS.map((p) => (
          <button key={p} className="chip parkchip" aria-pressed={pick === p} style={{ "--c": `var(${PARK[p][1]})` } as React.CSSProperties} onClick={() => setPick(p)}>{PARK[p][0]}</button>
        ))}
      </div>
      <div className="daystrip">
        {mid.map((d) => {
          const p = set[d.id];
          return (
            <button key={d.id} className="dchip" style={p ? ({ "--c": `var(${PARK[p][1]})` } as React.CSSProperties) : undefined} aria-pressed={!!p}
              onClick={() => setSet((s) => { const n = { ...s }; if (n[d.id] === pick) delete n[d.id]; else n[d.id] = pick; return n; })}>
              <small>{dayName(d)}</small><b>{p ? PARK[p][0] : "—"}</b>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}

// ---------- extras ----------
const EXTRAS = ["Park tickets", "Travel insurance", "ESTA (visa waiver)", "Car hire", "Airport transfers", "Memory Maker (photos)", "Universal tickets", "Spending money"];
function ExtrasSheet({ open, onClose, onSave, people }: { open: boolean; onClose: () => void; onSave: (l: string[]) => void; people: number }) {
  const [sel, setSel] = useState<string[]>(["Park tickets", "Travel insurance", "ESTA (visa waiver)"]);
  return (
    <Sheet open={open} title="Tickets and extras" sub={`Tick what you'll need for ${people} ${people === 1 ? "person" : "people"}. Each one becomes a budget line to price up.`} onClose={onClose}
      footer={<><span style={{ flex: 1 }} /><button className="btn" onClick={onClose}>Cancel</button><button className="btn pri" disabled={!sel.length} onClick={() => onSave(sel)}>Add {sel.length}</button></>}>
      <ul className="checks">
        {EXTRAS.map((x) => (
          <li key={x}><label><input type="checkbox" checked={sel.includes(x)} onChange={(e) => setSel((s) => (e.target.checked ? [...s, x] : s.filter((y) => y !== x)))} /><span style={{ textDecoration: "none", color: "var(--ink)" }}>{x}</span></label></li>
        ))}
      </ul>
    </Sheet>
  );
}
