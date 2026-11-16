"use client";
// The trip planner shell: a Home screen, five grouped sections (pills on desktop, a
// bottom bar on phones) and the soft-sunset header. Each section reuses the tab
// components ported from the original dashboard.
import { Fragment, useEffect, useState } from "react";
import { CREDITS, CT, DAYMS, PARK, THEME_PARKS, budgetTotals, countdown, creditStats, dateRange, dayItems, dayName, longDate, money, needsBooking, nights, opens, parkKey, parseDate } from "@/lib/plan";
import type { Credit, TripData } from "@/lib/types";
import { TripProvider, useStore, type Backend, type Connect } from "./store";
import { DaysTab, CrTag } from "./DaysTab";
import { CalendarTab } from "./CalendarTab";
import { CreditsTab } from "./CreditsTab";
import { LLTab } from "./LLTab";
import { ResTab } from "./ResTab";
import { FoodTab } from "./FoodTab";
import { BudgetTab } from "./BudgetTab";
import { PackTab } from "./PackTab";
import { PlannerDialog } from "./PlannerDialog";
import { ThemeToggle } from "./ThemeToggle";
import { Footer } from "./Footer";
import { Info } from "./Info";
import { Fireworks, Plate, SunsetScene, Suitcase } from "./art/Art";
import { ResortMap } from "./art/ResortMap";

// ---- icons: simple strokes that inherit colour ----
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
type View = [id: string, label: string];
const SECTIONS: [Section, string, (p: { on: boolean }) => React.ReactNode, View[]][] = [
  ["home", "Home", Icon.home, []],
  ["plan", "Plan", Icon.cal, [["days", "Day by day"], ["cal", "Calendar"]]],
  ["book", "Book", Icon.ticket, [["res", "Reservations"], ["ll", "Lightning Lanes"]]],
  ["eat", "Eat", Icon.fork, [["credits", "Dining credits"], ["food", "Food wishlist"]]],
  ["money", "Money", Icon.coin, [["budget", "Budget"]]],
  ["pack", "Pack", Icon.case, [["pack", "Packing"]]],
];
/** Old hash and tab names land in the right section. */
const LEGACY: Record<string, [Section, string]> = {
  days: ["plan", "days"], cal: ["plan", "cal"], res: ["book", "res"], ll: ["book", "ll"],
  credits: ["eat", "credits"], dining: ["eat", "credits"], food: ["eat", "food"], budget: ["money", "budget"], pack: ["pack", "pack"],
};

export function Planner({ extra, top, ...props }: { initial: TripData; canWrite?: boolean; backend?: Backend; connect?: Connect; extra?: React.ReactNode; top?: React.ReactNode }) {
  return (
    <TripProvider {...props}>
      <Shell extra={extra} top={top} />
    </TripProvider>
  );
}

function Shell({ extra, top }: { extra?: React.ReactNode; top?: React.ReactNode }) {
  const { canWrite, edit, setEdit, data } = useStore();
  const hidden = data.trip.hidden_tabs;
  // Sections show only the views this trip uses; a section with none left disappears.
  const sections = SECTIONS.map(([id, label, icon, views]) => [id, label, icon, views.filter(([v]) => !hidden.includes(v))] as const)
    .filter(([id, , , views]) => id === "home" || views.length > 0);
  const KEY = `mb-section:${data.trip.id}`;
  const [sec, setSec] = useState<Section>("home");
  const [sub, setSub] = useState<Record<string, string>>({});
  useEffect(() => {
    let start = location.hash.slice(1);
    if (!start) { try { start = localStorage.getItem(KEY) || ""; } catch { /* storage blocked */ } }
    const [s, v] = LEGACY[start] || (start.includes("/") ? (start.split("/") as [Section, string]) : [start as Section, ""]);
    if (SECTIONS.some(([id]) => id === s)) { setSec(s); if (v) setSub((x) => ({ ...x, [s]: v })); }
  }, [KEY]);
  const go = (s: Section, view?: string) => {
    setSec(s);
    if (view) setSub((x) => ({ ...x, [s]: view }));
    try { localStorage.setItem(KEY, view ? `${s}/${view}` : s); } catch { /* storage blocked */ }
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };
  const current = sections.find(([id]) => id === sec) || sections[0];
  const views = current[3];
  const view = views.find(([v]) => v === sub[current[0]])?.[0] || views[0]?.[0];

  return (
    <div className="dm">
      <Hero compact={current[0] !== "home"} />
      <nav className="dm-nav" aria-label="Sections">
        <div className="wrap">
          <div className="dm-tabs">
            {sections.map(([id, label]) => (
              <button key={id} aria-current={current[0] === id ? "page" : undefined} onClick={() => go(id)}>{label}</button>
            ))}
          </div>
          <div className="navacts">
            {/* Keyed: extra can be an element made by a server component, which React 19 dev flags otherwise. */}
            <Fragment key="extra">{extra}</Fragment>
            <a className="themebtn" href="/guide" target="_blank" rel="noopener" aria-label="Guide: what everything means" title="Guide: what everything means">?</a>
            <ThemeToggle />
            {canWrite && current[0] !== "home" && (
              <button className="editbtn" aria-pressed={edit} onClick={() => setEdit(!edit)}>{edit ? "Done" : "Edit"}</button>
            )}
          </div>
        </div>
      </nav>
      <main className="wrap dm-main">
        {edit && current[0] !== "home" && (
          <div id="editBanner" role="status">
            <div className="banner">
              Editing. Tap <b>✎</b> to change or delete something, or a <b>+</b> button to add. Changes save straight
              away and show up for everyone on the trip. Tap <b>Done</b> when you&apos;re finished.
            </div>
          </div>
        )}
        {views.length > 1 && (
          <div className="viewtog dm-sub" role="group" aria-label={`${current[1]} views`}>
            {views.map(([id, label]) => <button key={id} aria-pressed={view === id} onClick={() => go(current[0], id)}>{label}</button>)}
          </div>
        )}
        {current[0] === "home" && <Home go={go} top={top} />}
        {view === "days" && <DaysTab />}
        {view === "cal" && <CalendarTab />}
        {view === "res" && <ResTab />}
        {view === "ll" && <LLTab />}
        {view === "credits" && <CreditsTab />}
        {view === "food" && <FoodTab />}
        {view === "budget" && <BudgetTab />}
        {view === "pack" && <PackTab />}
      </main>
      <Footer />
      <nav className="dm-bottom" aria-label="Sections">
        {sections.map(([id, label, icon]) => (
          <button key={id} aria-current={current[0] === id ? "page" : undefined} onClick={() => go(id)}>
            {icon({ on: current[0] === id })}<span>{label}</span>
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
  // Client-only, so the server render never bakes in a stale count.
  useEffect(() => setCd(countdown(trip.arrival_time ? new Date(trip.arrival_time) : parseDate(trip.start_date), new Date())), [trip.arrival_time, trip.start_date]);
  const parkDays = days.filter((d) => THEME_PARKS.includes(parkKey(d.park))).length;
  const people = trip.adults + trip.child_ages.length;
  const n = nights(trip);
  return (
    <header className={`dm-hero${compact ? " compact" : ""}`}>
      <SunsetScene className="dm-scene" />
      <div className="wrap dm-hero-in">
        <div>
          <h1>{trip.title}</h1>
          <p className="dm-meta">
            <span>{trip.destination}</span><span>{dateRange(trip.start_date, trip.end_date)}</span>
            {!compact && <><span>{n} night{n === 1 ? "" : "s"}</span><span>{parkDays} park day{parkDays === 1 ? "" : "s"}</span><span>{people} {people === 1 ? "person" : "people"}</span></>}
          </p>
        </div>
        {cd !== "pending" && (
          <div className="dm-count">
            {cd ? <><b>{cd.days}</b><span>days to go</span></> : <span className="dm-now">Have the best time</span>}
          </div>
        )}
      </div>
    </header>
  );
}

function Home({ go, top }: { go: (s: Section, view?: string) => void; top?: React.ReactNode }) {
  const { data } = useStore();
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
  const showCredits = trip.dining_plan !== "none" && !trip.hidden_tabs.includes("credits");
  const showMoney = !trip.hidden_tabs.includes("budget");

  return (
    <section className="dm-home">
      {top}
      <h2 className="dm-hello">Where things stand</h2>
      <div className="dm-cards">
        <div className="panel dm-card hl">
          <Fireworks size={60} />
          <div>
            <div className="dm-k"><button className="dm-cardlink" onClick={() => go("book", "res")}>Next booking window</button><Info id="booking-windows" /></div>
            {next ? <>
              <div className="dm-v">{Math.ceil((+next.w!.date - +now!) / DAYMS)} days</div>
              <div className="dm-s">{longDate(next.w!.date)}. {nextCount === 1 ? `${next.r.text} opens then.` : `${nextCount} things open then, starting with ${next.r.text}.`}</div>
            </> : <div className="dm-v sm">{now ? "All open" : ""}</div>}
          </div>
        </div>
        <div className="panel dm-card">
          <Suitcase size={60} />
          <div>
            <div className="dm-k"><button className="dm-cardlink" onClick={() => go("book", "res")}>Still to book</button></div>
            <div className="dm-v">{toBook.length}<small> of {rows.length}</small></div>
            <div className="dm-s">{toBook.slice(0, 2).map((r) => r.text).join(", ") || (rows.length ? "Everything's booked" : "Nothing needs booking yet")}</div>
          </div>
        </div>
        {showMoney && (
          <div className="panel dm-card">
            <Plate size={60} />
            <div>
              <div className="dm-k"><button className="dm-cardlink" onClick={() => go("money", "budget")}>Left to pay</button></div>
              <div className="dm-v">{money(b.left, trip.currency)}</div>
              <div className="dm-s">{b.toPrice ? `${b.toPrice} thing${b.toPrice > 1 ? "s" : ""} still to price` : budget.length ? "Everything's priced" : "No costs added yet"}</div>
            </div>
          </div>
        )}
      </div>

      <div className="dm-grid">
        <div className="panel">
          <h3>Coming up<button className="linkbtn" onClick={() => go("plan", "days")}>See every day</button></h3>
          {coming.length ? (
            <ul className="dm-days">
              {coming.map((d) => {
                const k = parkKey(d.park), its = dayItems(items, d.id).slice(0, 4);
                return (
                  <li key={d.id} style={{ "--c": `var(${PARK[k][1]})` } as React.CSSProperties}>
                    <div className="dm-dayhead"><i aria-hidden="true" /><b>{d.label}</b><span>{dayName(d)}</span></div>
                    {its.length ? <ul>{its.map((i) => <li key={i.id}><time>{i.time || "Any time"}</time><span>{i.text}<CrTag i={i} /></span></li>)}</ul>
                      : <p className="empty" style={{ padding: 0 }}>Nothing planned yet.</p>}
                  </li>
                );
              })}
            </ul>
          ) : <p className="empty" style={{ padding: 0 }}>No park days picked yet. Choose them under Plan, or in the steps above.</p>}
        </div>

        <div className="panel">
          <h3>Getting around<Info id="journey-times" /></h3>
          <ResortMap hotels={hotels} stayKeys={stays.map((s) => s.hotel_key)} />
        </div>

        {showCredits && (
          <div className="panel dm-credits">
            <h3><span><button className="dm-cardlink" onClick={() => go("eat", "credits")}>Dining credits</button><Info id="dining-plan" /></span></h3>
            {CREDITS.map((k: Credit) => {
              const allow = k === "TS" ? trip.credits_ts : k === "QS" ? trip.credits_qs : trip.credits_sn;
              const s = creditStats(items, k, allow);
              return (
                <div key={k} className="dm-cr" style={{ "--k": `var(${CT[k][1]})` } as React.CSSProperties}>
                  <span>{CT[k][0]}</span>
                  <div className="dm-bar" aria-hidden="true"><i style={{ transform: `scaleX(${Math.min(1, s.total / Math.max(1, allow))})` }} /></div>
                  <b className={s.free < 0 ? "bad" : ""}>{s.free < 0 ? `${-s.free} over` : `${s.free} free`}</b>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
