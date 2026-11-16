"use client";
// Mockup of the redesigned trip: a home screen, five grouped sections, a bottom bar on
// phones, and the soft-sunset look. Reuses the real planner tabs inside each section.
import { useEffect, useState } from "react";
import { CREDITS, CT, DAYMS, PARK, budgetTotals, countdown, creditStats, dateRange, dayItems, dayName, longDate, money, needsBooking, nights, opens, parkKey, parseDate, THEME_PARKS } from "@/lib/plan";
import type { Credit, TripData } from "@/lib/types";
import { TripProvider, useStore } from "../store";
import { DaysTab, CrTag } from "../DaysTab";
import { CalendarTab } from "../CalendarTab";
import { CreditsTab } from "../CreditsTab";
import { LLTab } from "../LLTab";
import { ResTab } from "../ResTab";
import { FoodTab } from "../FoodTab";
import { BudgetTab } from "../BudgetTab";
import { PackTab } from "../PackTab";
import { PlannerDialog } from "../PlannerDialog";
import { ThemeToggle } from "../ThemeToggle";
import { Footer } from "../Footer";
import { Info } from "../Info";
import { Fireworks, Plate, SunsetScene, Suitcase } from "./Art";
import { ResortMap } from "./ResortMap";

// ---- icons (simple strokes, inherit colour) ----
function I({ d, on }: { d: string; on: boolean }) {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={on ? 2.2 : 1.7} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"><path d={d} /></svg>;
}
const Icon = {
  home: ({ on }: { on: boolean }) => <I on={on} d="M4 11l8-7 8 7v8a1 1 0 0 1-1 1h-4v-6H9v6H5a1 1 0 0 1-1-1z" />,
  cal: ({ on }: { on: boolean }) => <I on={on} d="M5 6h14v14H5zM5 10h14M9 4v4M15 4v4" />,
  ticket: ({ on }: { on: boolean }) => <I on={on} d="M4 8h16v3a2 2 0 0 0 0 4v3H4v-3a2 2 0 0 0 0-4zM10 8v10" />,
  fork: ({ on }: { on: boolean }) => <I on={on} d="M7 4v7M5 4v4a2 2 0 0 0 4 0V4M7 11v9M16 4c-2 2-2 7 0 8v8" />,
  coin: ({ on }: { on: boolean }) => <I on={on} d="M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18zM14.5 9a2.5 2.5 0 0 0-5 0c0 3-1 4-2 6h7M8 12.5h5" />,
  case: ({ on }: { on: boolean }) => <I on={on} d="M5 8h14v11H5zM9 8V5h6v3M5 13h14" />,
};

type Section = "home" | "plan" | "book" | "eat" | "money" | "pack";
const SECTIONS: [Section, string, (p: { on: boolean }) => React.ReactNode, [string, string][]][] = [
  ["home", "Home", Icon.home, []],
  ["plan", "Plan", Icon.cal, [["days", "Day by day"], ["cal", "Calendar"]]],
  ["book", "Book", Icon.ticket, [["res", "Reservations"], ["ll", "Lightning Lanes"]]],
  ["eat", "Eat", Icon.fork, [["credits", "Dining credits"], ["food", "Food wishlist"]]],
  ["money", "Money", Icon.coin, []],
  ["pack", "Pack", Icon.case, []],
];

export function DreamPlanner({ initial }: { initial: TripData }) {
  return <TripProvider initial={initial}><Shell /></TripProvider>;
}

function Shell() {
  const { canWrite, edit, setEdit } = useStore();
  const [sec, setSec] = useState<Section>("home");
  const [sub, setSub] = useState<Record<string, string>>({ plan: "days", book: "res", eat: "credits" });
  const go = (s: Section, tab?: string) => { setSec(s); if (tab) setSub((x) => ({ ...x, [s]: tab })); window.scrollTo({ top: 0, behavior: "smooth" }); };
  const current = SECTIONS.find((s) => s[0] === sec)!;

  return (
    <div className="dm">
      <Hero compact={sec !== "home"} />
      <nav className="dm-nav" aria-label="Sections">
        <div className="wrap">
          <div className="dm-tabs" role="tablist">
            {SECTIONS.map(([id, label]) => (
              <button key={id} role="tab" aria-selected={sec === id} onClick={() => go(id)}>{label}</button>
            ))}
          </div>
          <div className="navacts">
            <a className="themebtn" href="/guide" target="_blank" rel="noopener" aria-label="Guide" title="Guide: what everything means">?</a>
            <ThemeToggle />
            {canWrite && sec !== "home" && <button className="editbtn" aria-pressed={edit} onClick={() => setEdit(!edit)}>{edit ? "Done" : "Edit"}</button>}
          </div>
        </div>
      </nav>
      <main className="wrap dm-main">
        {current[3].length > 0 && (
          <div className="viewtog dm-sub" role="group" aria-label={`${current[1]} views`}>
            {current[3].map(([id, label]) => <button key={id} aria-pressed={sub[sec] === id} onClick={() => setSub((x) => ({ ...x, [sec]: id }))}>{label}</button>)}
          </div>
        )}
        {sec === "home" && <Home go={go} />}
        {sec === "plan" && (sub.plan === "cal" ? <CalendarTab /> : <DaysTab />)}
        {sec === "book" && (sub.book === "ll" ? <LLTab /> : <ResTab />)}
        {sec === "eat" && (sub.eat === "food" ? <FoodTab /> : <CreditsTab />)}
        {sec === "money" && <BudgetTab />}
        {sec === "pack" && <PackTab />}
      </main>
      <Footer />
      <nav className="dm-bottom" aria-label="Sections">
        {SECTIONS.map(([id, label, I]) => (
          <button key={id} aria-current={sec === id ? "page" : undefined} onClick={() => go(id)}>
            {I({ on: sec === id })}<span>{label}</span>
          </button>
        ))}
      </nav>
      <PlannerDialog />
    </div>
  );
}

function Hero({ compact }: { compact: boolean }) {
  const { trip, days } = useStore().data;
  const [cd, setCd] = useState<ReturnType<typeof countdown> | "pending">("pending");
  useEffect(() => setCd(countdown(trip.arrival_time ? new Date(trip.arrival_time) : parseDate(trip.start_date), new Date())), [trip.arrival_time, trip.start_date]);
  const parkDays = days.filter((d) => THEME_PARKS.includes(parkKey(d.park))).length;
  return (
    <header className={`dm-hero${compact ? " compact" : ""}`}>
      <SunsetScene className="dm-scene" />
      <div className="wrap dm-hero-in">
        <div>
          <div className="eyebrow">{trip.destination} · {dateRange(trip.start_date, trip.end_date)}</div>
          <h1>{trip.title}</h1>
          {!compact && <p>{nights(trip)} nights · {parkDays} park days · {trip.adults + trip.child_ages.length} people</p>}
        </div>
        {cd !== "pending" && cd && (
          <div className="dm-count"><b>{cd.days}</b><span>days to go</span></div>
        )}
      </div>
    </header>
  );
}

function Home({ go }: { go: (s: Section, tab?: string) => void }) {
  const { data, toast } = useStore();
  const { trip, days, items, budget, stays, hotels } = data;
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const rows = items.filter(needsBooking);
  const toBook = rows.filter((r) => r.res !== "booked");
  const windows = now ? rows.map((r) => ({ r, w: opens(r, days.find((d) => d.id === r.day_id), trip, data.rules) }))
    .filter((x) => x.w && +x.w.date > +now).sort((a, b) => +a.w!.date - +b.w!.date) : [];
  const next = windows[0];
  const nextCount = next ? windows.filter((x) => +x.w!.date === +next.w!.date).length : 0;
  const coming = days.filter((d) => THEME_PARKS.includes(parkKey(d.park))).slice(0, 3);
  const b = budgetTotals(budget);

  return (
    <section className="dm-home">
      <h2 className="dm-hello">Here&apos;s where things stand</h2>
      <div className="dm-cards">
        <div className="panel dm-card hl">
          <Fireworks size={64} />
          <div>
            <div className="dm-k"><button className="dm-cardlink" onClick={() => go("book", "res")}>Next booking window</button><Info id="booking-windows" /></div>
            {next ? <>
              <div className="dm-v">{Math.ceil((+next.w!.date - +now!) / DAYMS)} days</div>
              <div className="dm-s">{longDate(next.w!.date)} · {nextCount} thing{nextCount > 1 ? "s" : ""} to book, starting with {next.r.text}</div>
            </> : <div className="dm-v sm">All open</div>}
          </div>
        </div>
        <div className="panel dm-card">
          <Suitcase size={64} />
          <div>
            <div className="dm-k"><button className="dm-cardlink" onClick={() => go("book", "res")}>Still to book</button></div>
            <div className="dm-v">{toBook.length}<small> of {rows.length}</small></div>
            <div className="dm-s">{toBook.slice(0, 2).map((r) => r.text).join(", ") || "Everything's booked"}</div>
          </div>
        </div>
        <div className="panel dm-card">
          <Plate size={64} />
          <div>
            <div className="dm-k"><button className="dm-cardlink" onClick={() => go("money")}>Left to pay</button></div>
            <div className="dm-v">{money(b.left, trip.currency)}</div>
            <div className="dm-s">{b.toPrice ? `${b.toPrice} thing${b.toPrice > 1 ? "s" : ""} still to price` : "Everything's priced"}</div>
          </div>
        </div>
      </div>

      <div className="dm-grid">
        <div className="panel">
          <h3>Coming up<button className="linkbtn" onClick={() => go("plan", "days")}>See every day</button></h3>
          <div className="dm-days">
            {coming.map((d) => {
              const k = parkKey(d.park), its = dayItems(items, d.id).slice(0, 4);
              return (
                <button key={d.id} className="dm-day" style={{ "--c": `var(${PARK[k][1]})` } as React.CSSProperties} onClick={() => go("plan", "days")}>
                  <div className="day-date">{dayName(d)}</div>
                  <div className="day-park">{d.label}</div>
                  <ul>{its.map((i) => <li key={i.id}><time>{i.time || "·"}</time><span>{i.text}<CrTag i={i} /></span></li>)}</ul>
                  {!its.length && <p className="empty" style={{ padding: 0 }}>Nothing planned yet.</p>}
                </button>
              );
            })}
          </div>
        </div>

        <div className="panel">
          <h3>Getting around<Info id="journey-times" /></h3>
          <ResortMap hotels={hotels} stayKeys={stays.map((s) => s.hotel_key)} />
        </div>

        {trip.dining_plan !== "none" && (
          <div className="panel dm-credits">
            <h3><span><button className="dm-cardlink" onClick={() => go("eat", "credits")}>Dining credits</button><Info id="dining-plan" /></span></h3>
            {CREDITS.map((k: Credit) => {
              const allow = k === "TS" ? trip.credits_ts : k === "QS" ? trip.credits_qs : trip.credits_sn;
              const s = creditStats(items, k, allow);
              return (
                <div key={k} className="dm-cr" style={{ "--k": `var(${CT[k][1]})` } as React.CSSProperties}>
                  <span>{CT[k][0]}</span>
                  <div className="dm-bar"><i style={{ width: `${Math.min(100, (s.total / Math.max(1, allow)) * 100)}%` }} /></div>
                  <b className={s.free < 0 ? "bad" : ""}>{s.free < 0 ? `${-s.free} over` : `${s.free} free`}</b>
                </div>
              );
            })}
          </div>
        )}

        <div className="panel">
          <h3>Who&apos;s on this trip</h3>
          <p style={{ margin: "0 0 10px", fontSize: 14 }}>Just you so far. Invite someone and you&apos;ll both see changes as they happen.</p>
          <button className="btn pri" onClick={() => toast("Mockup: invites arrive with sharing")}>Invite someone</button>
        </div>
      </div>
      <p className="note dm-mocknote">Mockup: the Home screen and new navigation run on the sample trip; nothing is saved.</p>
    </section>
  );
}

