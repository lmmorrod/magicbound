"use client";
// Change the basics after the trip exists: name, dates, who's going, which tabs show.
// Moving dates adds blank days or turns removed days' plans into loose items; nothing is deleted.
import { useEffect, useState } from "react";
import { addDays, dayName, parseDate, toISODate } from "@/lib/plan";
import { newId, useStore } from "../store";
import { Sheet } from "./BuildChecklist";

export const OPTIONAL_TABS: [string, string][] = [
  ["credits", "Dining credits"], ["ll", "Lightning Lanes"], ["food", "Food wishlist"], ["budget", "Budget"], ["pack", "Packing"],
];

export function TripDetailsSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, update, updateTrip, insert, remove, toast } = useStore();
  const { trip, days, items } = data;
  const [title, setTitle] = useState(trip.title);
  const [start, setStart] = useState(trip.start_date);
  const [end, setEnd] = useState(trip.end_date);
  const [adults, setAdults] = useState(trip.adults);
  const [ages, setAges] = useState(trip.child_ages);
  const [hidden, setHidden] = useState(trip.hidden_tabs);
  useEffect(() => {
    if (!open) return;
    setTitle(trip.title); setStart(trip.start_date); setEnd(trip.end_date);
    setAdults(trip.adults); setAges(trip.child_ages); setHidden(trip.hidden_tabs);
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const n = Math.round((+parseDate(end) - +parseDate(start)) / 864e5);
  const datesOk = !!start && !!end && n >= 0 && n <= 60;
  const dropped = days.filter((d) => d.date < start || d.date > end);
  const droppedItems = items.filter((i) => dropped.some((d) => d.id === i.day_id)).length;

  const save = () => {
    if (!datesOk) return;
    if (start !== trip.start_date || end !== trip.end_date) {
      // Removed days: keep their plans as loose items, then remove the day.
      dropped.forEach((d) => {
        items.filter((i) => i.day_id === d.id).forEach((i) => update("items", i.id, { day_id: null }));
        remove("days", d.id);
      });
      // New dates get a blank day; then renumber everything by date.
      const have = new Map(days.filter((d) => !dropped.includes(d)).map((d) => [d.date, d]));
      // Travel-day labels follow the new first and last days, unless someone renamed them.
      const DEFAULTS = ["Arrival day", "Going home", "To plan"];
      const edge = (i: number) => (i === 0 ? { park: "TR", label: "Arrival day" } : i === n ? { park: "TR", label: "Going home" } : { park: "CH", label: "To plan" });
      for (let i = 0; i <= n; i++) {
        const date = toISODate(addDays(parseDate(start), i));
        const d = have.get(date);
        if (!d) { insert("days", { id: newId(), order: i + 1, date, event: "", ...edge(i) }); continue; }
        const patch: Record<string, unknown> = {};
        if (d.order !== i + 1) patch.order = i + 1;
        const want = edge(i);
        if (DEFAULTS.includes(d.label) && (d.park === "TR" || d.park === "CH") && d.label !== want.label) Object.assign(patch, want);
        if (Object.keys(patch).length) update("days", d.id, patch);
      }
    }
    const checkin = trip.checkin_date < start || trip.checkin_date > end ? start : trip.checkin_date;
    updateTrip({ title: title.trim() || trip.title, start_date: start, end_date: end, checkin_date: checkin, adults, child_ages: ages, hidden_tabs: hidden });
    onClose();
    toast(droppedItems ? `Saved. ${droppedItems} plan${droppedItems > 1 ? "s" : ""} moved to loose` : "Saved");
  };

  return (
    <Sheet open={open} title="Trip details" sub="Change these any time. Everyone on the trip sees the update." onClose={onClose}
      footer={<><span style={{ flex: 1 }} /><button className="btn" onClick={onClose}>Cancel</button><button className="btn pri" disabled={!datesOk} onClick={save}>Save</button></>}>
      <label className="fld">Trip name<input type="text" value={title} onChange={(e) => setTitle(e.target.value)} /></label>
      <div className="frow">
        <label className="fld">Arrive<input type="date" value={start} onChange={(e) => setStart(e.target.value)} /></label>
        <label className="fld">Go home<input type="date" value={end} min={start} onChange={(e) => setEnd(e.target.value)} /></label>
      </div>
      {!datesOk && <p className="status bad">{n < 0 ? "Going home needs to be after you arrive." : "Trips can be up to 60 nights."}</p>}
      {datesOk && dropped.length > 0 && (
        <p className="banner">
          {dropped.length} day{dropped.length > 1 ? "s" : ""} will come off ({dropped.map((d) => dayName(d)).join(", ")}).
          {droppedItems ? ` Their ${droppedItems} plan${droppedItems > 1 ? "s" : ""} will move to loose, not be deleted.` : ""}
        </p>
      )}
      <div className="frow">
        <label className="fld">Adults<input type="number" min={1} max={20} value={adults} onChange={(e) => setAdults(Math.max(1, Math.min(20, +e.target.value || 1)))} /></label>
        <label className="fld">Children<input type="number" min={0} max={10} value={ages.length}
          onChange={(e) => { const v = Math.max(0, Math.min(10, +e.target.value || 0)); setAges(v > ages.length ? [...ages, ...Array(v - ages.length).fill(8)] : ages.slice(0, v)); }} /></label>
      </div>
      {ages.length > 0 && (
        <div className="ages" style={{ marginTop: 0, marginBottom: 10 }}>
          {ages.map((a, i) => (
            <label key={i} className="fld">Child {i + 1} age
              <select value={a} onChange={(e) => setAges(ages.map((x, j) => (j === i ? +e.target.value : x)))}>
                {Array.from({ length: 18 }, (_, k) => <option key={k} value={k}>{k === 0 ? "Under 1" : k}</option>)}
              </select>
            </label>
          ))}
        </div>
      )}
      <fieldset className="tabsfs">
        <legend>Tabs to show</legend>
        <ul className="checks">
          {OPTIONAL_TABS.map(([id, label]) => (
            <li key={id}><label>
              <input type="checkbox" checked={!hidden.includes(id)} onChange={(e) => setHidden((h) => (e.target.checked ? h.filter((x) => x !== id) : [...h, id]))} />
              <span className="plain">{label}</span>
            </label></li>
          ))}
        </ul>
        <p className="note" style={{ marginTop: 4 }}>Day by day, Calendar and Reservations always show.</p>
      </fieldset>
    </Sheet>
  );
}
