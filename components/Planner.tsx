"use client";
import { useEffect, useState } from "react";
import { THEME_PARKS, countdown, dateRange, nights, parseDate, parkKey } from "@/lib/plan";
import type { TripData } from "@/lib/types";
import { TripProvider, useStore, type Backend, type Connect } from "./store";
import { DaysTab } from "./DaysTab";
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

const TABS = [
  ["days", "Day by day"],
  ["cal", "Calendar"],
  ["credits", "Dining credits"],
  ["ll", "Lightning Lanes"],
  ["res", "Reservations"],
  ["food", "Food wishlist"],
  ["budget", "Budget"],
  ["pack", "Packing"],
] as const;
type TabId = (typeof TABS)[number][0];
const TAB_KEY = "mb-tab";

export function Planner({ extra, ...props }: { initial: TripData; canWrite?: boolean; backend?: Backend; connect?: Connect; extra?: React.ReactNode }) {
  return (
    <TripProvider {...props}>
      <Shell extra={extra} />
    </TripProvider>
  );
}

function Hero() {
  const { trip, days } = useStore().data;
  const [cd, setCd] = useState<ReturnType<typeof countdown> | "pending">("pending");
  useEffect(() => {
    // Countdown is computed on the client only, so server and client HTML match.
    const target = trip.arrival_time ? new Date(trip.arrival_time) : parseDate(trip.start_date);
    setCd(countdown(target, new Date()));
  }, [trip.arrival_time, trip.start_date]);
  const parkDays = days.filter((d) => THEME_PARKS.includes(parkKey(d.park))).length;
  const n = nights(trip);
  const route = [trip.origin, trip.destination].filter(Boolean).join(" → ");
  return (
    <header className="hero">
      <div className="wrap">
        <div>
          <div className="eyebrow">{trip.destination} · {dateRange(trip.start_date, trip.end_date)}</div>
          <h1>{trip.title}</h1>
          <p>{route} · {n} night{n === 1 ? "" : "s"} · {parkDays} park day{parkDays === 1 ? "" : "s"}</p>
        </div>
        <div className="count" aria-live="polite">
          {cd === "pending" ? null : cd ? (
            <>
              <div><b>{cd.days}</b><span>days to go</span></div>
              <div><b>{cd.weeks}</b><span>weeks</span></div>
            </>
          ) : (
            <div><b>🎉</b><span>Have the best time</span></div>
          )}
        </div>
      </div>
    </header>
  );
}

function Shell({ extra }: { extra?: React.ReactNode }) {
  const { canWrite, edit, setEdit } = useStore();
  const [tab, setTab] = useState<TabId>("days");
  useEffect(() => {
    let start = location.hash.slice(1);
    if (!TABS.some(([id]) => id === start)) {
      try { start = localStorage.getItem(TAB_KEY) || ""; } catch { /* storage blocked */ }
    }
    if (start === "dining") start = "credits";
    if (TABS.some(([id]) => id === start)) setTab(start as TabId);
  }, []);
  const show = (id: TabId) => {
    setTab(id);
    try { localStorage.setItem(TAB_KEY, id); } catch { /* storage blocked */ }
  };

  return (
    <>
      <Hero />
      <nav className="tabs" aria-label="Sections">
        <div className="wrap">
          <div className="tablist" role="tablist">
            {TABS.map(([id, label]) => (
              <button key={id} role="tab" aria-selected={tab === id} aria-controls={id} onClick={() => show(id)}>{label}</button>
            ))}
          </div>
          <div className="navacts">
            {extra}
            <ThemeToggle />
            {canWrite && (
              <button className="editbtn" aria-pressed={edit} onClick={() => setEdit(!edit)}>{edit ? "Done" : "Edit"}</button>
            )}
          </div>
        </div>
      </nav>
      <main className="wrap">
        <div id="editBanner" role="status">
          {edit && (
            <div className="banner">
              Editing. Tap <b>✎</b> on anything to change or delete it, or a <b>+</b> button to add. Changes save
              straight away and show up for everyone on the trip. Tap <b>Done</b> when finished.
            </div>
          )}
        </div>
        {tab === "days" && <DaysTab />}
        {tab === "cal" && <CalendarTab />}
        {tab === "credits" && <CreditsTab />}
        {tab === "ll" && <LLTab />}
        {tab === "res" && <ResTab />}
        {tab === "food" && <FoodTab />}
        {tab === "budget" && <BudgetTab />}
        {tab === "pack" && <PackTab />}
      </main>
      <Footer />
      <PlannerDialog />
    </>
  );
}

