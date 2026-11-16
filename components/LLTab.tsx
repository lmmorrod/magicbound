"use client";
import { PARK, addDays, dayName, isLL, parseDate, parkKey, shortDate, toISODate } from "@/lib/plan";
import { useStore } from "./store";
import { AddBtn, EditBtn } from "./RecButtons";

const LLP = ["MK", "EP", "HS", "AK"];

export function LLTab() {
  const { data, canWrite, edit, setLLPick } = useStore();
  const { rides, ll_picks, items, days, trip, rules } = data;
  const picked = (park: string, name: string) => ll_picks.some((p) => p.park === park && p.ride_name === name);
  const parks = [...LLP, ...[...new Set(rides.map((r) => r.park))].filter((p) => p && !LLP.includes(p))];
  const open = addDays(parseDate(trip.checkin_date), -rules.ll_window_onsite);

  return (
    <section id="ll">
      <h2>Lightning Lanes</h2>
      <p className="sub">Every ride with Lightning Lane, by park and tier. Tick the ones you want so you know your picks on booking morning.</p>
      <div className="grid3" style={{ marginBottom: 18 }}>
        <div className="panel">
          <h3>Booking opens</h3>
          {trip.on_site_hotel ? (
            <>
              <div className="big">{shortDate(toISODate(open))}</div>
              <p className="note" style={{ marginTop: 6 }}>
                {rules.ll_window_onsite} days before check-in, at {rules.ll_open_time}. This is the on-site hotel window;
                staying off-site it&apos;s only {rules.ll_window_offsite} days before each park day.
              </p>
            </>
          ) : (
            <>
              <div className="big" style={{ fontSize: 26 }}>{rules.ll_window_offsite} days before</div>
              <p className="note" style={{ marginTop: 6 }}>
                Each park day, at {rules.ll_open_time}. On-site hotel guests get {rules.ll_window_onsite} days before
                check-in for the whole stay.
              </p>
            </>
          )}
        </div>
        <div className="panel">
          <h3>Multi Pass rules</h3>
          <p style={{ margin: 0, fontSize: 14 }}>
            Pick 3 rides to start, all in the same park. Only one of those 3 can be Tier 1. Once you use one (or its
            window passes) you can book another from any tier. Animal Kingdom has no tiers.
          </p>
        </div>
        <div className="panel">
          <h3>Rough prices</h3>
          <p style={{ margin: 0, fontSize: 14 }}>
            Multi Pass about $27–45 per person per day. Single Pass rides about $10–25 per person each, bought separately.
          </p>
        </div>
      </div>
      <div className="grid2">
        {parks.map((k) => {
          const rs = rides.filter((r) => r.park === k);
          if (!rs.length && !edit) return null;
          const name = k in PARK ? PARK[parkKey(k)][0] : k;
          const mp = items.filter(isLL).map((i) => days.find((d) => d.id === i.day_id)).filter((d) => d && d.park === k);
          const tiers = [...new Set(rs.map((r) => r.tier || ""))];
          const total = rs.filter((r) => picked(k, r.name)).length;
          return (
            <div key={k} className="panel llpanel" style={{ "--c": `var(${k in PARK ? PARK[parkKey(k)][1] : "--muted"})` } as React.CSSProperties}>
              <h3>{name}<span className="prog">{total} picked</span></h3>
              <p className="mpday">
                {mp.length ? <>Multi Pass on <b>{mp.map((d) => dayName(d!)).join(", ")}</b></> : "No Multi Pass day planned"}
              </p>
              {tiers.map((t) => {
                const tr = rs.filter((r) => (r.tier || "") === t);
                const c = tr.filter((r) => picked(k, r.name)).length;
                return (
                  <div key={t}>
                    <div className="tier"><span>{t || "Other"}</span><span>{c ? c + " picked" : ""}</span></div>
                    <ul className="checks">
                      {tr.map((r) => (
                        <li key={r.id} className="erow">
                          <label>
                            <input type="checkbox" checked={picked(k, r.name)} disabled={!canWrite}
                              onChange={(e) => setLLPick(k, r.name, e.target.checked)} />
                            <span>{r.name}{r.flag && <span className="closed">{r.flag}</span>}</span>
                          </label>
                          <EditBtn table="rides" rec={r} />
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
              <AddBtn table="rides" label="Add a ride" preset={{ park: k }} />
            </div>
          );
        })}
      </div>
      <p className="note">
        Guidance only: tiers, windows and prices change. Last checked {fmtChecked(rules.last_checked)}; recheck on the
        official site before booking morning and update the rides in edit mode.
      </p>
    </section>
  );
}

export const fmtChecked = (iso: string) => parseDate(iso).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });
