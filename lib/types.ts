// Row shapes mirror the planned Supabase tables. Field names follow the
// original dashboard (text, credit, n, used, res, conf) so logic ports across.

export type ParkKey = "MK" | "EP" | "AK" | "HS" | "UNI" | "CH" | "TR";
export type Credit = "TS" | "QS" | "SN";
export type ResStatus = "todo" | "booked";
export type Role = "owner" | "editor" | "viewer";

export interface Trip {
  id: string;
  title: string;
  destination: string;
  origin?: string;
  start_date: string; // YYYY-MM-DD
  end_date: string;
  checkin_date: string;
  on_site_hotel: boolean;
  arrival_time: string | null; // ISO date-time of landing, for the countdown
  currency: string;
  credits_ts: number;
  credits_qs: number;
  credits_sn: number;
  paid: boolean;
}

export interface Day {
  id: string;
  order: number;
  date: string; // YYYY-MM-DD
  park: ParkKey | string;
  label: string;
  event: string;
}

export interface Item {
  id: string;
  day_id: string | null; // null = loose
  time: string | null; // "HH:MM" or null/"" for any time
  text: string;
  credit: Credit | null;
  n: number;
  used: boolean;
  res: ResStatus | null;
  conf: string | null;
}

export interface Ride {
  id: string;
  park: string;
  tier: string;
  name: string;
  flag: string;
  order: number;
}

export interface Food {
  id: string;
  name: string;
  type: string;
  area: string;
  spot: string;
  note: string;
  url: string;
  hi: boolean;
  order: number;
}

export interface QsWish {
  id: string;
  name: string;
  area: string;
  key: string;
  order: number;
}

export interface BudgetLine {
  id: string;
  name: string;
  cost: number | null;
  paid: number;
  note: string;
  order: number;
}

export interface ParkHours {
  id: string;
  park: string;
  opens: string;
  closes: string;
  order: number;
}

export interface PackItem {
  id: string;
  text: string;
  list: string;
  group: string;
  done: boolean;
  order: number;
}

export interface LLPick {
  park: string;
  ride_name: string;
}

/** Rules from the reference pack (ref_rules), with a "last checked" date. */
export interface Rules {
  dining_window_days: number;
  dining_onsite_span_days: number; // on-site guests book the first N days of the stay at once
  ll_window_onsite: number;
  ll_window_offsite: number;
  dining_open_time: string; // shown as guidance, e.g. "6am Orlando time"
  ll_open_time: string;
  last_checked: string; // YYYY-MM-DD
}

export interface TripData {
  trip: Trip;
  days: Day[];
  items: Item[];
  rides: Ride[];
  ll_picks: LLPick[];
  food: Food[];
  qs_wish: QsWish[];
  budget: BudgetLine[];
  park_hours: ParkHours[];
  pack: PackItem[];
  rules: Rules;
}

/** Tables that hold one row per id and can be edited generically. */
export type Table =
  | "days"
  | "items"
  | "rides"
  | "food"
  | "qs_wish"
  | "budget"
  | "park_hours"
  | "pack";
