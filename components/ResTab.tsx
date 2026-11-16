"use client";
import { Info } from "./Info";
import { useEffect, useState } from "react";
import { DAYMS, PARK, RES_GROUPS, byTime, dayName, longDate, needsBooking, opens, parkKey } from "@/lib/plan";
import type { ResStatus } from "@/lib/types";
import { useStore } from "./store";
import { BlurInput } from "./DaysTab";
import { fmtChecked } from "./LLTab";

export function ResTab() {
  const { data, canWrite, update } = useStore();
  const { items, days, trip, rules } = data;
  // "now" only on the client, so the server render doesn't bake in a stale date.
  const [now, setNow] = useState<Date | null>(null);
  useEffect(() => setNow(new Date()), []);

  const order = (id: string | null) => days.findIndex((d) => d.id === id);
  const rows = items.filter(needsBooking).sort((a, b) => order(a.day_id) - order(b.day_id) || byTime(a, b));
  const booked = rows.filter((r) => r.res === "booked").length;
  const dayOf = (id: string | null) => days.find((d) => d.id === id);
  const next = now
    ? rows.map((r) => opens(r, dayOf(r.day_id), trip, rules)?.date).filter((d): d is Date => !!d && +d > +now).sort((a, b) => +a - +b)[0]
    : undefined;

  return (
    <section id="res">
      <h2>Reservations<Info id="booking-windows" /></h2>
      <p className="sub">
        Everything that needs booking, pulled from the day plan. Mark each one booked and add its confirmation number.
        Every table-service meal shows here automatically; tick <b>Needs booking</b><Info id="needs-booking" /> on anything else in edit mode.
      </p>
      <div className="grid3" style={{ marginBottom: 18 }}>
        <div className="panel"><h3>Booked</h3><div className="big">{booked} <small>of {rows.length}</small></div></div>
        <div className="panel">
          <h3>Next window opens</h3>
          <div className="big" style={{ fontSize: 26 }}>{now ? (next ? longDate(next) : "All open") : "…"}</div>
          <p className="note" style={{ marginTop: 6 }}>{now && next ? Math.ceil((+next - +now) / DAYMS) + " days away" : ""}</p>
        </div>
        <div className="panel">
          <h3><span>Dining window<Info id="dining-reservations" /></span></h3>
          <p style={{ margin: 0, fontSize: 14 }}>
            {trip.on_site_hotel
              ? <>On-site hotel guests book {rules.dining_window_days} days before check-in, for the first {rules.dining_onsite_span_days} days of the stay. Meals after that open on a rolling {rules.dining_window_days} days before each date.</>
              : <>Book {rules.dining_window_days} days before each meal, at {rules.dining_open_time}.</>}
          </p>
          <p className="guide">Guidance only. Last checked {fmtChecked(rules.last_checked)}.</p>
        </div>
      </div>
      <div>
        {rows.length ? RES_GROUPS.map(([g, fn]) => {
          const rs = rows.filter(fn);
          if (!rs.length) return null;
          return (
            <div key={g}>
              <div className="rgrp">{g}</div>
              {rs.map((r) => {
                const d = dayOf(r.day_id);
                const k = d ? parkKey(d.park) : "TR";
                const st: ResStatus = r.res === "booked" ? "booked" : "todo";
                const w = opens(r, d, trip, rules);
                return (
                  <div key={r.id} className="rrow" style={{ "--c": `var(${PARK[k][1]})` } as React.CSSProperties}>
                    <div style={{ minWidth: 0 }}>
                      <b>{r.text || "Untitled"}</b> <span className={`pill ${st}`}>{st === "booked" ? "Booked" : "To book"}</span>
                      <div className="meta metalist">
                        <span>{d ? dayName(d) + (r.time ? ` at ${r.time}` : "") : "No day yet"}</span>
                        <span>{w ? `Booking opens ${longDate(w.date)}, ${w.when}` : "Check the booking window"}</span>
                        {r.conf && !canWrite && <span>Confirmation {r.conf}</span>}
                      </div>
                    </div>
                    {canWrite && (
                      <div className="ctl">
                        <select aria-label="Status" value={st} onChange={(e) => update("items", r.id, { res: e.target.value as ResStatus })}>
                          <option value="todo">To book</option>
                          <option value="booked">Booked</option>
                        </select>
                        <BlurInput type="text" value={r.conf || ""} placeholder="Confirmation no." aria-label="Confirmation number"
                          onCommit={(v) => update("items", r.id, { conf: v.trim() })} />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          );
        }) : <p className="sub">Nothing needs booking yet.</p>}
      </div>
    </section>
  );
}
