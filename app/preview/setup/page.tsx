"use client";
// Clickable mockup of the new-trip flow. Runs on local data; nothing is saved.
import { useState } from "react";
import Link from "next/link";
import { Planner } from "@/components/Planner";
import { QuickStart, type Setup } from "@/components/setup/QuickStart";
import { BuildChecklist } from "@/components/setup/BuildChecklist";
import { SAMPLE, SAMPLE_RULES } from "@/data/sample";
import { addDays, parseDate, toISODate } from "@/lib/plan";
import type { TripData } from "@/lib/types";

function tripFrom(s: Setup): TripData {
  const n = Math.round((+parseDate(s.end) - +parseDate(s.start)) / 864e5);
  const days = Array.from({ length: n + 1 }, (_, i) => {
    const edge = i === 0 || i === n;
    return { id: `d${i + 1}`, order: i + 1, date: toISODate(addDays(parseDate(s.start), i)), park: edge ? "TR" : "CH",
      label: i === 0 ? "Arrival day" : i === n ? "Going home" : "To plan", event: "" };
  });
  return {
    trip: { id: "preview", title: s.title, destination: s.destination, origin: "", start_date: s.start, end_date: s.end,
      checkin_date: s.start, on_site_hotel: false, arrival_time: null, currency: "GBP", credits_ts: 0, credits_qs: 0, credits_sn: 0, paid: false },
    days, items: [], rides: SAMPLE.rides, ll_picks: [], food: [], qs_wish: [], budget: [], park_hours: [], pack: [], rules: SAMPLE_RULES,
  };
}

export default function SetupPreview() {
  const [setup, setSetup] = useState<Setup | null>(null);
  return (
    <>
      <div className="previewbar">Preview of the new-trip flow · nothing is saved · <Link href="/preview/setup" onClick={() => setSetup(null)}>start again</Link></div>
      {setup ? <Planner initial={tripFrom(setup)} top={<BuildChecklist setup={setup} />} /> : <QuickStart onDone={setSetup} />}
    </>
  );
}
