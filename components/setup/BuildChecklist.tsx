"use client";
// "Build your trip" panel. Every step reads from and saves to the trip itself, so
// what you add shows up on the days, calendar, reservations and budget straight away,
// and is shared with everyone on the trip.
import { useEffect, useRef, useState } from "react";
import { PARK, THEME_PARKS, addDays, dayName, nights, parkKey, parseDate, shortDate, toISODate } from "@/lib/plan";
import type { Day, Flight, Item, ParkKey, Stay, Trip } from "@/lib/types";
import { newId, useStore } from "../store";
import { PLANS, benefits, hotelById, type PlanKey } from "@/data/hotels";
import { TripDetailsSheet } from "./TripDetailsSheet";
import { Info } from "../Info";

type StepId = "basics" | "flights" | "stays" | "dining" | "parks" | "invite" | "extras";
const STEP_INFO: Partial<Record<StepId, string>> = { stays: "on-site", dining: "dining-plan", parks: "park-tickets", extras: "memory-maker" };
const HIDE_KEY = (id: string) => `mb-build-hidden:${id}`;

export function Sheet({ open, title, sub, onClose, children, footer, info }: { open: boolean; title: string; sub?: string; onClose: () => void; children: React.ReactNode; footer: React.ReactNode; info?: string }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const d = ref.current;
    if (!d) return;
    if (open && !d.open) d.showModal();
    if (!open && d.open) d.close();
  }, [open]);
  return (
    <dialog ref={ref} className="sheet" onClose={onClose} aria-label={title}>
      <h3>{title}{info && <Info id={info} />}</h3>
      {sub && <p className="dsub">{sub}</p>}
      <div className="sheet-body">{open && children}</div>
      <div className="dact">{footer}</div>
    </dialog>
  );
}

export const eligibleDiners = (t: Pick<Trip, "adults" | "child_ages">) => t.adults + t.child_ages.filter((a) => a >= 3).length;
export const peopleLine = (t: Pick<Trip, "adults" | "child_ages">) =>
  `${t.adults} adult${t.adults > 1 ? "s" : ""}${t.child_ages.length ? `, ${t.child_ages.length} child${t.child_ages.length > 1 ? "ren" : ""}` : ""}`;

export function BuildChecklist() {
  const { data, canWrite, update, updateTrip, insert, remove, toast } = useStore();
  const { trip, days, items, flights, stays, hotels } = data;
  const [open, setOpen] = useState<StepId | null>(null);
  const [hidden, setHiddenState] = useState(false);
  useEffect(() => { try { setHiddenState(localStorage.getItem(HIDE_KEY(trip.id)) === "1"); } catch { /* storage blocked */ } }, [trip.id]);
  const setHidden = (v: boolean) => { setHiddenState(v); try { v ? localStorage.setItem(HIDE_KEY(trip.id), "1") : localStorage.removeItem(HIDE_KEY(trip.id)); } catch { /* storage blocked */ } };

  const n = nights(trip);
  const marked = (s: string) => trip.setup_done.includes(s);
  const mark = (s: string, on = true) => updateTrip({ setup_done: on ? [...new Set([...trip.setup_done, s])] : trip.setup_done.filter((x) => x !== s) });
  const dayOn = (iso: string) => days.find((d) => d.date === iso)?.id ?? null;
  const first = days[0], last = days[days.length - 1];
  const item = (p: Partial<Item>): Item => ({ id: newId(), day_id: null, time: null, text: "", credit: null, n: 1, used: false, res: null, conf: null, ...p });
  /** Swap the items a step made last time for a fresh set. */
  const replaceItems = (source: string, next: Item[]) => {
    items.filter((i) => i.source === source).forEach((i) => remove("items", i.id));
    next.forEach((i) => insert("items", { ...i, source }));
  };
  const parkDays = days.filter((d) => THEME_PARKS.includes(parkKey(d.park))).length;
  const out = flights.find((f) => f.direction === "out"), ret = flights.find((f) => f.direction === "return");

  const steps: [StepId, string, boolean, string][] = [
    ["basics", "Dates and who's going", true, `${n} night${n === 1 ? "" : "s"}, ${peopleLine(trip)}`],
    ["flights", "Flights", flights.length > 0 || marked("flights"),
      flights.length ? [out && `${out.flight_no || "Outbound"} ${out.depart} to ${out.arrive}`, ret && `${ret.flight_no || "Home"} ${ret.depart}`].filter(Boolean).join(", ")
        : marked("flights") ? "Not booked yet. There's a reminder on Reservations" : "Times go on your travel days and set the countdown"],
    ["stays", "Where you're staying", stays.length > 0,
      stays.length ? stays.map((s) => `${s.name.split(" (")[0]} (${nightsOf(s)} nt)`).join(" then ") : "One hotel or a few. Unlocks on-site perks and booking dates"],
    ["dining", "Dining plan", trip.dining_plan !== null,
      trip.dining_plan === "none" ? "No dining plan" : trip.dining_plan ? `${PLANS[trip.dining_plan].label}: ${trip.credits_ts} table service, ${trip.credits_qs} quick service, ${trip.credits_sn} snacks` : "Works out your credits for every night"],
    ["parks", "Park days", parkDays > 0 || marked("parks"), parkDays ? `${parkDays} park day${parkDays === 1 ? "" : "s"} planned` : "Pick a park for each day, or leave some free"],
    ["invite", "Invite someone", marked("invite"), marked("invite") ? "Invite ready (sending arrives with sharing)" : "Plan together; changes show up live"],
    ["extras", "Tickets and extras", marked("extras"), marked("extras") ? "Added to the budget, ready to price" : "Adds them to the budget so nothing's forgotten"],
  ];
  const count = steps.filter((s) => s[2]).length;
  const close = () => setOpen(null);
  const saved = (msg = "Added to your plan") => { close(); toast(msg); };

  if (!canWrite) return null;
  if (hidden || count === steps.length)
    return (
      <div className="buildbar">
        <button className="add" onClick={() => { setHidden(false); if (count === steps.length) setOpen("basics"); }}>
          {count === steps.length ? "Trip details" : `Build your trip (${count}/${steps.length})`}
        </button>
        <TripDetailsSheet open={open === "basics"} onClose={close} />
      </div>
    );

  return (
    <div className="panel build">
      <h3>Build your trip<span className="prog">{count}/{steps.length} done</span></h3>
      <div className="meter" style={{ "--k": "var(--accent)" } as React.CSSProperties} aria-hidden="true">
        {steps.map(([id, , d]) => <span key={id} className={d ? "s" : ""} />)}
      </div>
      <ol className="steps">
        {steps.map(([id, label, isDone, hint]) => (
          <li key={id} className={isDone ? "isdone" : ""}>
            <span className="tick" aria-hidden="true">{isDone ? "✓" : ""}</span>
            <div style={{ minWidth: 0 }}><b>{label}{STEP_INFO[id] && <Info id={STEP_INFO[id]!} />}</b><span className="hint">{hint}</span></div>
            <button className="btn" onClick={() => setOpen(id)}>{isDone ? "Change" : "Add"}</button>
          </li>
        ))}
      </ol>
      <button className="linkbtn" onClick={() => setHidden(true)}>Hide for now</button>

      <TripDetailsSheet open={open === "basics"} onClose={close} />

      <FlightsSheet open={open === "flights"} onClose={close} out={out} ret={ret} later={marked("flights") && !flights.length}
        onSave={(f) => {
          flights.forEach((x) => remove("flights", x.id));
          if (f.mode === "later") {
            replaceItems("flights", [item({ day_id: first?.id, text: "Book flights", res: "todo" })]);
            mark("flights");
            updateTrip({ arrival_time: null });
            return saved("Reminder added to Reservations");
          }
          const o: Flight = { id: newId(), direction: "out", flight_no: f.outNo, from_place: f.from, depart: f.depart, arrive: f.arrive, order: 1 };
          const r: Flight = { id: newId(), direction: "return", flight_no: f.retNo, from_place: f.from, depart: f.retDepart, arrive: "", order: 2 };
          insert("flights", o);
          if (f.retDepart || f.retNo) insert("flights", r);
          replaceItems("flights", [
            item({ day_id: first?.id, time: f.depart || null, text: `Flight ${[f.outNo, f.from && `from ${f.from}`].filter(Boolean).join(" ")}${f.arrive ? `, lands ${f.arrive}` : ""}` }),
            ...(f.retDepart || f.retNo ? [item({ day_id: last?.id, time: f.retDepart || null, text: `Flight home${f.retNo ? ` ${f.retNo}` : ""}${f.from ? ` to ${f.from}` : ""}` })] : []),
          ]);
          mark("flights", false);
          updateTrip({ arrival_time: f.arrive && first ? `${first.date}T${f.arrive}:00` : null, origin: f.from || trip.origin });
          saved();
        }} />

      <StaysSheet open={open === "stays"} onClose={close} start={trip.start_date} end={trip.end_date} existing={stays} hotels={hotels}
        onSave={(list) => {
          stays.forEach((x) => remove("stays", x.id));
          list.forEach((s, i) => insert("stays", { ...s, id: newId(), order: i + 1 }));
          const onsite = list.filter((s) => s.on_site);
          updateTrip({ on_site_hotel: onsite.length > 0, checkin_date: (onsite[0] || list[0]).check_in });
          replaceItems("stays", list.flatMap((s) => [
            item({ day_id: dayOn(s.check_in), time: "15:00", text: `Check in: ${s.name}` }),
            ...(s.check_out !== trip.end_date ? [item({ day_id: dayOn(s.check_out), time: "11:00", text: `Check out: ${s.name}` })] : []),
          ]));
          saved();
        }} />

      <DiningSheet open={open === "dining"} onClose={close} trip={trip}
        onSave={(k, c) => {
          const hidden = trip.hidden_tabs.filter((t) => t !== "credits");
          updateTrip({ dining_plan: k, credits_ts: c.TS, credits_qs: c.QS, credits_sn: c.SN, hidden_tabs: k === "none" ? [...hidden, "credits"] : hidden });
          saved(k === "none" ? "Dining credits tab hidden" : "Credits set");
        }} />

      <ParksSheet open={open === "parks"} onClose={close} days={days}
        onSave={(set) => {
          Object.entries(set).forEach(([id, park]) => {
            const d = days.find((x) => x.id === id);
            if (d && d.park !== park) update("days", id, { park, label: PARK[park][0] });
          });
          mark("parks");
          saved("Park days set");
        }} />

      <Sheet open={open === "invite"} title="Invite someone" sub="They'll get an email link. Editors can change the plan; viewers can only look." onClose={close}
        footer={<><span style={{ flex: 1 }} /><button className="btn" onClick={close}>Cancel</button>
          <button className="btn pri" onClick={() => { mark("invite"); saved("Noted. Invites send once sharing is built"); }}>Save</button></>}>
        <label className="fld">Their email<input type="email" placeholder="name@example.com" /></label>
        <label className="fld">They can<select defaultValue="editor"><option value="editor">Edit the plan</option><option value="viewer">Only view it</option></select></label>
        <p className="note">Sending invites arrives with the sharing milestone. Nothing is emailed yet.</p>
      </Sheet>

      <ExtrasSheet open={open === "extras"} onClose={close} people={trip.adults + trip.child_ages.length} existing={data.budget.map((b) => b.name)}
        onSave={(lines) => {
          const start = data.budget.reduce((m, b) => Math.max(m, b.order), 0);
          lines.forEach((l, i) => insert("budget", { id: newId(), name: l, cost: null, paid: 0, note: "", order: start + i + 1 }));
          mark("extras");
          saved("Added to your budget");
        }} />
    </div>
  );
}

// ---------- flights ----------
interface FlightForm { mode: "lookup" | "manual" | "later"; outNo: string; retNo: string; from: string; depart: string; arrive: string; retDepart: string }
function FlightsSheet({ open, onClose, onSave, out, ret, later }: { open: boolean; onClose: () => void; onSave: (f: FlightForm) => void; out?: Flight; ret?: Flight; later: boolean }) {
  const init = (): FlightForm => ({ mode: later ? "later" : out ? "manual" : "lookup", outNo: out?.flight_no || "", retNo: ret?.flight_no || "", from: out?.from_place || "", depart: out?.depart || "", arrive: out?.arrive || "", retDepart: ret?.depart || "" });
  const [f, setF] = useState<FlightForm>(init);
  const [found, setFound] = useState(false);
  useEffect(() => { if (open) { setF(init()); setFound(false); } }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const set = (p: Partial<FlightForm>) => setF((x) => ({ ...x, ...p }));
  const lookup = () => {
    // A real lookup needs a flight-data service (paid). Until then this shows sample times to check and edit.
    set({ from: f.from || "London Gatwick", depart: f.depart || "10:55", arrive: f.arrive || "15:20", retDepart: f.retDepart || "18:40" });
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
              <p className="note">Automatic lookup is coming. For now this fills in sample times for you to correct.</p>
            </>
          )}
          {(f.mode === "manual" || found) && (
            <>
              {found && <p className="banner">These are sample times. Change them to match your booking.</p>}
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
type StayForm = Omit<Stay, "id" | "order">;
const nightsOf = (s: { check_in: string; check_out: string }) => Math.round((+parseDate(s.check_out) - +parseDate(s.check_in)) / 864e5);
function StaysSheet({ open, onClose, onSave, start, end, existing, hotels }: { open: boolean; onClose: () => void; onSave: (s: StayForm[]) => void; start: string; end: string; existing: Stay[]; hotels: import("@/lib/types").Hotel[] }) {
  const blank = (from: string, to: string): StayForm => ({ hotel_key: "", name: "", tier: "", on_site: false, check_in: from, check_out: to });
  const init = () => (existing.length ? existing.map(({ id: _i, order: _o, ...s }) => s) : [blank(start, end)]);
  const [stays, setStays] = useState<StayForm[]>(init);
  useEffect(() => { if (open) setStays(init()); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const total = Math.max(0, Math.round((+parseDate(end) - +parseDate(start)) / 864e5));
  const nightList = Array.from({ length: total }, (_, i) => toISODate(addDays(parseDate(start), i)));
  const cover = nightList.map((d) => stays.filter((s) => s.hotel_key && s.check_in <= d && d < s.check_out).length);
  const gaps = cover.filter((c) => c === 0).length, clashes = cover.filter((c) => c > 1).length;
  const setStay = (i: number, p: Partial<StayForm>) => setStays((l) => l.map((s, j) => (j === i ? { ...s, ...p } : s)));
  const pickHotel = (i: number, key: string) => {
    const h = hotelById(key, hotels);
    setStay(i, h ? { hotel_key: h.id, name: h.name, tier: h.tier, on_site: h.onSite } : { hotel_key: "", name: "", tier: "", on_site: false });
  };
  const ok = stays.every((s) => s.hotel_key && s.check_in < s.check_out) && !clashes;
  const tiers = [...new Set(hotels.map((h) => h.tier))];
  const lastStay = stays[stays.length - 1];

  return (
    <Sheet open={open} title="Where you're staying" info="split-stay" sub="Add each hotel in order. Splitting a stay is fine." onClose={onClose}
      footer={<><span className="note" style={{ margin: 0 }}>{clashes ? "Two hotels overlap" : gaps ? `${gaps} night${gaps > 1 ? "s" : ""} not covered yet` : ""}</span><span style={{ flex: 1 }} />
        <button className="btn" onClick={onClose}>Cancel</button><button className="btn pri" disabled={!ok} onClick={() => onSave(stays)}>Save</button></>}>
      <div className="nights" aria-label="Nights covered">
        {nightList.map((d, i) => <span key={d} title={shortDate(d)} className={cover[i] === 0 ? "gap" : cover[i] > 1 ? "clash" : "ok"} />)}
      </div>
      {stays.map((s, i) => {
        const h = hotelById(s.hotel_key, hotels);
        return (
          <div key={i} className="stay">
            <div className="fih"><b>Stay {i + 1}{s.hotel_key && s.check_in < s.check_out ? `, ${nightsOf(s)} nights` : ""}</b>
              {stays.length > 1 && <button className="eb" aria-label={`Remove stay ${i + 1}`} onClick={() => setStays((l) => l.filter((_, j) => j !== i))}>×</button>}</div>
            <label className="fld">Hotel
              <select value={s.hotel_key} onChange={(e) => pickHotel(i, e.target.value)}>
                <option value="">Choose…</option>
                {tiers.map((t) => <optgroup key={t} label={t}>{hotels.filter((x) => x.tier === t).map((x) => <option key={x.id} value={x.id}>{x.name}</option>)}</optgroup>)}
              </select>
            </label>
            {s.hotel_key === "off" && (
              <label className="fld">Name (optional)<input type="text" placeholder="e.g. Villa in Kissimmee" onChange={(e) => setStay(i, { name: e.target.value.trim() || (h?.name ?? "") })} /></label>
            )}
            <div className="frow">
              <label className="fld">Check in<input type="date" value={s.check_in} min={start} max={end} onChange={(e) => setStay(i, { check_in: e.target.value })} /></label>
              <label className="fld">Check out<input type="date" value={s.check_out} min={start} max={end} onChange={(e) => setStay(i, { check_out: e.target.value })} /></label>
            </div>
            {h && (
              <div className="perks">
                <span className={`pill ${h.onSite ? "booked" : "todo"}`}>{h.onSite ? `On-site, ${h.tier}` : "Off-site"}</span>
                <ul>{benefits(h).map((b) => (
                  <li key={b}>{b}{b.startsWith("Early Theme Park Entry") && <Info id="early-entry" />}{b.startsWith("Extended Evening") && <Info id="extended-evening" />}{b.startsWith("Lightning Lane") && <Info id="multi-pass" />}{b.startsWith("Dining") && <Info id="dining-reservations" />}{b.includes("Skyliner") && <Info id="skyliner" />}</li>
                ))}</ul>
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
      <button className="add addin" disabled={!lastStay || nightsOf(lastStay) < 2} onClick={() => {
        // Split the last stay at its midpoint; the new hotel takes the second half.
        const mid = toISODate(addDays(parseDate(lastStay.check_in), Math.floor(nightsOf(lastStay) / 2)));
        setStays((l) => [...l.slice(0, -1), { ...lastStay, check_out: mid }, blank(mid, lastStay.check_out)]);
      }}>+ Add another hotel (split stay)</button>
      <p className="note">Journey times are typical door-to-gate estimates. Guidance only.<Info id="journey-times" /></p>
    </Sheet>
  );
}

// ---------- dining ----------
function DiningSheet({ open, onClose, onSave, trip }: { open: boolean; onClose: () => void; onSave: (k: PlanKey, c: { TS: number; QS: number; SN: number }) => void; trip: Trip }) {
  const n = nights(trip), eligible = eligibleDiners(trip);
  const calc = (p: PlanKey) => ({ TS: PLANS[p].per.TS * n * eligible, QS: PLANS[p].per.QS * n * eligible, SN: PLANS[p].per.SN * n * eligible });
  const [k, setK] = useState<PlanKey>(trip.dining_plan || "standard");
  const [c, setC] = useState(calc(k));
  useEffect(() => {
    if (!open) return;
    const p = trip.dining_plan || "standard";
    setK(p);
    setC(trip.dining_plan && trip.dining_plan !== "none" ? { TS: trip.credits_ts, QS: trip.credits_qs, SN: trip.credits_sn } : calc(p));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  const pick = (p: PlanKey) => { setK(p); setC(calc(p)); };
  const under3 = trip.child_ages.filter((a) => a < 3).length;
  return (
    <Sheet open={open} title="Dining plan" info="dining-plan" sub={`${n} nights × ${eligible} ${eligible === 1 ? "person" : "people"} aged 3+${under3 ? ` (${under3} under-3 eat from your plate)` : ""}.`} onClose={onClose}
      footer={<><span style={{ flex: 1 }} /><button className="btn" onClick={onClose}>Cancel</button><button className="btn pri" onClick={() => onSave(k, k === "none" ? { TS: 0, QS: 0, SN: 0 } : c)}>Save</button></>}>
      <div className="choices col">
        {(Object.keys(PLANS) as PlanKey[]).map((p) => (
          <button key={p} type="button" className="choice" aria-pressed={k === p} onClick={() => pick(p)}>
            <b>{PLANS[p].label}</b><span>{PLANS[p].note}</span>
          </button>
        ))}
      </div>
      {k !== "none" && (
        <>
          <div className="frow" style={{ marginTop: 12 }}>
            {(["TS", "QS", "SN"] as const).map((x) => (
              <label key={x} className="fld">{x === "TS" ? "Table service" : x === "QS" ? "Quick service" : "Snacks"}
                <input type="number" min={0} max={99} value={c[x]} onChange={(e) => setC({ ...c, [x]: Math.max(0, Math.min(99, +e.target.value || 0)) })} />
              </label>
            ))}
          </div>
          <p className="note">Worked out for you. Change any number if your package is different.</p>
        </>
      )}
    </Sheet>
  );
}

// ---------- park days ----------
const CHIPS: ParkKey[] = ["MK", "EP", "HS", "AK", "UNI", "CH"];
function ParksSheet({ open, onClose, onSave, days }: { open: boolean; onClose: () => void; onSave: (s: Record<string, ParkKey>) => void; days: Day[] }) {
  const [pick, setPick] = useState<ParkKey>("MK");
  const init = () => Object.fromEntries(days.map((d) => [d.id, parkKey(d.park)])) as Record<string, ParkKey>;
  const [set, setSet] = useState<Record<string, ParkKey>>(init);
  useEffect(() => { if (open) setSet(init()); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Sheet open={open} title="Park days" info="park-tickets" sub="Pick a park, then tap the days for it. Tap again to make it a free day." onClose={onClose}
      footer={<><span style={{ flex: 1 }} /><button className="btn" onClick={onClose}>Decide later</button><button className="btn pri" onClick={() => onSave(set)}>Save</button></>}>
      <div className="filters">
        {CHIPS.map((p) => (
          <button key={p} className="chip parkchip" aria-pressed={pick === p} style={{ "--c": `var(${PARK[p][1]})` } as React.CSSProperties} onClick={() => setPick(p)}>{PARK[p][0]}</button>
        ))}
      </div>
      <div className="daystrip">
        {days.map((d) => {
          const p = set[d.id] ?? parkKey(d.park); // days added since the sheet opened
          return (
            <button key={d.id} className="dchip" style={{ "--c": `var(${PARK[p][1]})` } as React.CSSProperties} aria-pressed={THEME_PARKS.includes(p)}
              aria-label={`${dayName(d)}: ${PARK[p][0]}`}
              onClick={() => setSet((s) => ({ ...s, [d.id]: (s[d.id] ?? parkKey(d.park)) === pick ? "CH" : pick }))}>
              <small>{dayName(d)}</small><b>{PARK[p][0]}</b>
            </button>
          );
        })}
      </div>
    </Sheet>
  );
}

// ---------- extras ----------
const EXTRAS = ["Park tickets", "Travel insurance", "ESTA (visa waiver)", "Car hire", "Airport transfers", "Memory Maker (photos)", "Universal tickets", "Spending money"];
function ExtrasSheet({ open, onClose, onSave, people, existing }: { open: boolean; onClose: () => void; onSave: (l: string[]) => void; people: number; existing: string[] }) {
  const options = EXTRAS.filter((x) => !existing.includes(x));
  const [sel, setSel] = useState<string[]>([]);
  useEffect(() => { if (open) setSel(options.filter((x) => ["Park tickets", "Travel insurance", "ESTA (visa waiver)"].includes(x))); }, [open]); // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <Sheet open={open} title="Tickets and extras" info="esta" sub={`Tick what you'll need for ${people} ${people === 1 ? "person" : "people"}. Each one becomes a budget line to price up.`} onClose={onClose}
      footer={<><span style={{ flex: 1 }} /><button className="btn" onClick={onClose}>Cancel</button><button className="btn pri" disabled={!sel.length} onClick={() => onSave(sel)}>Add {sel.length || ""}</button></>}>
      {options.length ? (
        <ul className="checks">
          {options.map((x) => (
            <li key={x}><label><input type="checkbox" checked={sel.includes(x)} onChange={(e) => setSel((s) => (e.target.checked ? [...s, x] : s.filter((y) => y !== x)))} /><span className="plain">{x}</span></label></li>
          ))}
        </ul>
      ) : <p className="note">They&apos;re all in your budget already. Add anything else from the Budget tab.</p>}
    </Sheet>
  );
}
