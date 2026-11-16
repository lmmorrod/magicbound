// Pure planning logic ported from the original dashboard. No React, no I/O.
import type { Credit, Day, Item, ParkKey, Rules, Trip } from "./types";

export const PARK: Record<ParkKey, [name: string, colourVar: string]> = {
  AK: ["Animal Kingdom", "--ak"],
  MK: ["Magic Kingdom", "--mk"],
  HS: ["Hollywood Studios", "--hs"],
  EP: ["EPCOT", "--ep"],
  UNI: ["Universal", "--uni"],
  CH: ["Chill day", "--chill"],
  TR: ["Travel", "--travel"],
};
export const PARK_BG: Record<ParkKey, string> = {
  AK: "--ak-bg", MK: "--mk-bg", HS: "--hs-bg", EP: "--ep-bg", UNI: "--uni-bg", CH: "--chill-bg", TR: "--travel-bg",
};
export const THEME_PARKS: ParkKey[] = ["MK", "EP", "AK", "HS", "UNI"];
export const parkKey = (p: string): ParkKey => (p in PARK ? (p as ParkKey) : "TR");

export const CT: Record<Credit, [name: string, colourVar: string]> = {
  TS: ["Table service", "--accent"],
  QS: ["Quick service", "--qs"],
  SN: ["Snack", "--sn"],
};
export const CREDITS = Object.keys(CT) as Credit[];

export const AREAS = ["Magic Kingdom", "Animal Kingdom", "EPCOT", "Hollywood Studios", "Disney Springs", "Resorts"];
export const AREA_COLOUR: Record<string, string> = {
  "Magic Kingdom": "--mk", "Animal Kingdom": "--ak", EPCOT: "--ep", "Hollywood Studios": "--hs",
  "Disney Springs": "--accent", Resorts: "--uni",
};
/** Known areas first, then any others in the order they appear. */
export const areaOrder = (list: { area: string }[]) => [
  ...AREAS,
  ...[...new Set(list.map((x) => x.area))].filter((a) => a && !AREAS.includes(a)),
];

// ---- sorting & tags ----
export const byTime = (a: { time?: string | null }, b: { time?: string | null }) =>
  (a.time || "00").localeCompare(b.time || "00");

export const isLL = (i: { text?: string | null }) => /lightning lane/i.test(i.text || "");

/** Text of the little credit tag ("TS", "2 TS", "QS", "SNACK"), or "" for none. */
export function crTag(i: Pick<Item, "credit" | "n">): string {
  if (!i.credit) return "";
  const n = i.credit === "TS" && i.n > 1 ? i.n + " " : "";
  return n + (i.credit === "SN" ? "SNACK" : i.credit);
}

export const dayItems = (items: Item[], dayId: string) => items.filter((i) => i.day_id === dayId).sort(byTime);

// ---- dates ----
export const DAYMS = 864e5;
/** Parse YYYY-MM-DD as a local-midnight date (no timezone drift). */
export function parseDate(iso: string): Date {
  const [y, m, d] = iso.split("-").map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}
export function toISODate(dt: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${dt.getFullYear()}-${p(dt.getMonth() + 1)}-${p(dt.getDate())}`;
}
export const addDays = (dt: Date, n: number) => new Date(dt.getFullYear(), dt.getMonth(), dt.getDate() + n);
/** "Thu" */
export const weekday = (iso: string) => parseDate(iso).toLocaleDateString("en-GB", { weekday: "short" });
/** "10 Jun" */
export const shortDate = (iso: string) => parseDate(iso).toLocaleDateString("en-GB", { day: "numeric", month: "short" });
/** "Thu 10 Jun" */
export const dayName = (d: Pick<Day, "date">) => `${weekday(d.date)} ${shortDate(d.date)}`;
/** "Thu, 10 Jun 2027" */
export const longDate = (dt: Date) =>
  dt.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });

export function nights(trip: Pick<Trip, "start_date" | "end_date">): number {
  return Math.round((+parseDate(trip.end_date) - +parseDate(trip.start_date)) / DAYMS);
}

/** "10–24 Jun 2027", "28 Jun – 3 Jul 2027", "30 Dec 2027 – 4 Jan 2028" */
export function dateRange(start: string, end: string): string {
  const a = parseDate(start), b = parseDate(end);
  const mon = (d: Date) => d.toLocaleDateString("en-GB", { month: "short" });
  if (a.getFullYear() !== b.getFullYear())
    return `${a.getDate()} ${mon(a)} ${a.getFullYear()} – ${b.getDate()} ${mon(b)} ${b.getFullYear()}`;
  if (a.getMonth() !== b.getMonth()) return `${a.getDate()} ${mon(a)} – ${b.getDate()} ${mon(b)} ${b.getFullYear()}`;
  return `${a.getDate()}–${b.getDate()} ${mon(b)} ${b.getFullYear()}`;
}

/** Whole days until `target` (floored), or null if it has passed. */
export function countdown(target: Date, now: Date): { days: number; weeks: number } | null {
  const ms = +target - +now;
  if (ms <= 0) return null;
  const days = Math.floor(ms / DAYMS);
  return { days, weeks: Math.floor(days / 7) };
}

// ---- dining credits ----
export type MeterCell = "u" | "s" | "l" | "over" | "";
export interface CreditStats {
  allow: number;
  scheduled: number;
  loose: number;
  used: number;
  total: number;
  free: number;
  cells: MeterCell[];
}

/** TS items count n credits (a signature meal is 2); QS and snacks always count 1. */
export const creditWeight = (k: Credit, i: Pick<Item, "n">) => (k === "TS" ? +i.n || 1 : 1);

export function creditStats(items: Item[], k: Credit, allow: number): CreditStats {
  const its = items.filter((i) => i.credit === k);
  const w = (i: Item) => creditWeight(k, i);
  const sum = (l: Item[]) => l.reduce((a, i) => a + w(i), 0);
  const scheduled = sum(its.filter((i) => i.day_id !== null));
  const loose = sum(its.filter((i) => i.day_id === null));
  const used = sum(its.filter((i) => i.used));
  const total = scheduled + loose;
  const cells: MeterCell[] = [];
  for (let j = 0; j < Math.max(allow, total); j++)
    cells.push(j >= allow ? "over" : j < used ? "u" : j < scheduled ? "s" : j < total ? "l" : "");
  return { allow, scheduled, loose, used, total, free: allow - total, cells };
}

export function creditStatus(s: Pick<CreditStats, "allow" | "free">): { text: string; bad: boolean } {
  if (s.free < 0) return { text: `${-s.free} over the ${s.allow} on the plan.`, bad: true };
  if (s.free === 0) return { text: `All ${s.allow} accounted for.`, bad: false };
  return { text: `${s.free} still free.`, bad: false };
}

/** Items of one credit type, scheduled first in day order, then loose, each by time. */
export function creditOrder(items: Item[], days: Day[]): Item[] {
  const idx = (id: string | null) => days.findIndex((d) => d.id === id);
  return [...items].sort(
    (a, b) => +(a.day_id === null) - +(b.day_id === null) || idx(a.day_id) - idx(b.day_id) || byTime(a, b),
  );
}

/** Per-night credits for each dining plan, used to pre-fill the wizard. */
export const DINING_PLANS = {
  none: { TS: 0, QS: 0, SN: 0 },
  quick: { TS: 0, QS: 2, SN: 1 },
  standard: { TS: 1, QS: 1, SN: 1 },
} as const;

// ---- quick-service wishlist ----
/** Where a wishlist spot is in the plan, or null if it isn't yet. Case-insensitive substring of key || name. */
export function qsPlaced(key: string, items: Item[], days: Day[]): string | null {
  const k = (key || "").toLowerCase().trim();
  if (!k) return null;
  const it = items.find((i) => (i.text || "").toLowerCase().includes(k));
  if (!it) return null;
  if (it.day_id === null) return "Loose credit, no day yet";
  const d = days.find((x) => x.id === it.day_id);
  return d ? `On ${dayName(d)}${it.time ? " · " + it.time : ""}` : "In the plan";
}

// ---- calendar ----
export const hh = (h: number) => String(h).padStart(2, "0") + ":00";

/** Hour rows: 07:00–23:00, stretched to fit anything earlier or later. */
export function hourRange(items: Item[]): [number, number] {
  const hrs = items
    .filter((i) => i.day_id !== null && i.time && !isLL(i))
    .map((i) => parseInt(i.time as string, 10))
    .filter((n) => !isNaN(n));
  return [Math.min(7, ...hrs), Math.max(23, ...hrs)];
}

/**
 * Where an item lands when dropped on a calendar cell. `target` is "dayId|slot"
 * where slot is "HH:00", "LL" or "" (any time). Keeps the minutes when moving
 * between hours; clears the time for the LL and Any-time rows. Null = no change.
 */
export function dropItem(it: Pick<Item, "day_id" | "time">, target: string): { day_id: string; time: string } | null {
  const [day, slot] = target.split("|");
  let time: string;
  if (slot === "LL" || slot === "") time = "";
  else {
    const mm = it.time && /^\d\d:\d\d$/.test(it.time) ? it.time.slice(3) : "00";
    time = slot.slice(0, 2) + ":" + mm;
  }
  if (it.day_id === day && (it.time || "") === time) return null;
  return { day_id: day, time };
}

// ---- reservations & booking windows ----
export const needsDiningWindow = (it: Pick<Item, "credit" | "text">) =>
  it.credit === "TS" || /dining|breakfast|dinner|lunch/i.test(it.text || "");

/**
 * The date a booking window opens for an item, with a note on what time.
 * Lightning Lane: on-site guests book everything N days before check-in;
 * off-site guests M days before each park day. Dining: X days before the meal,
 * except on-site guests can book the first Y days of the stay in one go, so a
 * meal later in the stay opens X days before day Y of the stay.
 * All the numbers come from the reference pack's rules.
 */
export function opens(
  it: Pick<Item, "credit" | "text">,
  day: Pick<Day, "date"> | undefined | null,
  trip: Pick<Trip, "checkin_date" | "on_site_hotel">,
  rules: Rules,
): { date: Date; when: string } | null {
  const checkin = parseDate(trip.checkin_date);
  if (isLL(it)) {
    if (trip.on_site_hotel) return { date: addDays(checkin, -rules.ll_window_onsite), when: rules.ll_open_time };
    if (!day) return null;
    return { date: addDays(parseDate(day.date), -rules.ll_window_offsite), when: rules.ll_open_time };
  }
  if (needsDiningWindow(it)) {
    if (!day) return null;
    let base = parseDate(day.date);
    if (trip.on_site_hotel) {
      const spanEnd = addDays(checkin, rules.dining_onsite_span_days - 1);
      if (+spanEnd < +base) base = spanEnd;
    }
    return { date: addDays(base, -rules.dining_window_days), when: rules.dining_open_time };
  }
  return null;
}

export const RES_GROUPS: [string, (i: Item) => boolean][] = [
  ["Dining", (r) => r.credit === "TS"],
  ["Lightning Lane", (r) => isLL(r)],
  ["Experiences & extras", (r) => r.credit !== "TS" && !isLL(r)],
];
export const needsBooking = (i: Item) => i.credit === "TS" || !!i.res;

// ---- money ----
export const isNum = (v: unknown): v is number => typeof v === "number" && isFinite(v);
export function money(n: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency, maximumFractionDigits: 0 }).format(Math.round(n));
}
export function budgetTotals(lines: { cost: number | null; paid: number }[]) {
  const total = lines.reduce((a, b) => a + (isNum(b.cost) ? b.cost : 0), 0);
  const paid = lines.reduce((a, b) => a + (+b.paid || 0), 0);
  return { total, paid, left: Math.max(0, total - paid), toPrice: lines.filter((b) => !isNum(b.cost)).length };
}
