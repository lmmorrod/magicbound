// A made-up sample trip for the demo dashboard and the free tier.
// No real people, bookings or confirmation numbers.
import type { Credit, Day, Food, Item, ParkKey, Ride, Rules, TripData } from "@/lib/types";
import { PARK, addDays, parseDate, toISODate } from "@/lib/plan";
import { HOTELS } from "./hotels";

export const SAMPLE_RULES: Rules = {
  dining_window_days: 60,
  dining_onsite_span_days: 10,
  ll_window_onsite: 7,
  ll_window_offsite: 3,
  dining_open_time: "6am Orlando time",
  ll_open_time: "7am Orlando time",
  last_checked: "2026-11-01",
};

const START = "2027-06-10";
const PLAN: [ParkKey, string, string][] = [
  ["TR", "Fly out", ""],
  ["MK", "", "Evening fireworks"],
  ["EP", "", ""],
  ["CH", "Pool and Disney Springs", ""],
  ["AK", "", ""],
  ["HS", "", "Evening show"],
  ["MK", "", "After-hours event"],
  ["TR", "Fly home", ""],
];

const days: Day[] = PLAN.map(([park, label, event], i) => ({
  id: `d${i + 1}`,
  order: i + 1,
  date: toISODate(addDays(parseDate(START), i)),
  park,
  label: label || PARK[park][0],
  event,
}));

let n = 0;
const it = (day: number | null, time: string | null, text: string, credit: Credit | null = null, extra: Partial<Item> = {}): Item => ({
  id: `i${++n}`, day_id: day === null ? null : `d${day}`, time, text, credit, n: 1, used: false, res: null, conf: null, ...extra,
});

const items: Item[] = [
  it(1, "11:00", "Flight out"),
  it(1, "15:20", "Land, collect bags, transfer to hotel"),
  it(1, "19:00", "Dinner at the hotel", "QS"),
  it(2, "08:00", "Early entry, head for the mountain coasters"),
  it(2, null, "Lightning Lane Multi Pass", null, { res: "todo" }),
  it(2, "12:30", "Lunch at Pecos Bill", "QS"),
  it(2, "15:00", "Dole Whip break", "SN"),
  it(2, "18:00", "Character dinner", "TS", { res: "booked", conf: "SAMPLE-0001" }),
  it(3, "09:00", "World Showcase stroll"),
  it(3, "12:00", "Lunch in Norway", "QS"),
  it(3, "19:30", "Signature dinner with a view", "TS", { n: 2 }),
  it(4, null, "Lazy morning at the pool"),
  it(4, "17:00", "Disney Springs wander and dinner", "TS"),
  it(5, "07:30", "Rope drop the safari"),
  it(5, null, "Lightning Lane Multi Pass", null, { res: "todo" }),
  it(5, "11:45", "Lunch at Satu'li Canteen", "QS"),
  it(5, "16:00", "Sunset river cruise", null, { res: "todo" }),
  it(6, "08:30", "Toy Story Land first"),
  it(6, "12:15", "Lunch at Woody's Lunch Box", "QS"),
  it(6, "18:30", "Sci-fi dine-in dinner", "TS"),
  it(7, "10:00", "Late start, park all day"),
  it(7, "14:30", "Ice cream stop", "SN"),
  it(8, "10:00", "Check out, last shop"),
  it(8, "17:30", "Flight home"),
  it(null, null, "Snack at the hotel", "SN"),
  it(null, null, "Breakfast somewhere special", "TS", { n: 2 }),
];

const R = (park: string, tier: string, names: string[], flags: Record<string, string> = {}): Omit<Ride, "id" | "order">[] =>
  names.map((name) => ({ park, tier, name, flag: flags[name] || "" }));
const rides: Ride[] = [
  ...R("MK", "Tier 1", ["Seven Dwarfs Mine Train", "Tiana's Bayou Adventure", "Space Mountain", "Peter Pan's Flight"]),
  ...R("MK", "Tier 2", ["Big Thunder Mountain Railroad", "Haunted Mansion", "Jungle Cruise", "Pirates of the Caribbean", "Buzz Lightyear's Space Ranger Spin", "The Many Adventures of Winnie the Pooh", "\"it's a small world\""]),
  ...R("MK", "Single Pass", ["TRON Lightcycle / Run"]),
  ...R("EP", "Tier 1", ["Frozen Ever After", "Remy's Ratatouille Adventure", "Test Track", "Soarin' Around the World"]),
  ...R("EP", "Tier 2", ["Mission: SPACE", "Spaceship Earth", "Living with the Land", "The Seas with Nemo & Friends", "Journey Into Imagination with Figment"]),
  ...R("EP", "Single Pass", ["Guardians of the Galaxy: Cosmic Rewind"]),
  ...R("HS", "Tier 1", ["Slinky Dog Dash", "Mickey & Minnie's Runaway Railway", "The Twilight Zone Tower of Terror", "Rock 'n' Roller Coaster"], { "Rock 'n' Roller Coaster": "Check it's reopened" }),
  ...R("HS", "Tier 2", ["Toy Story Mania!", "Millennium Falcon: Smugglers Run", "Star Tours", "Alien Swirling Saucers"]),
  ...R("HS", "Single Pass", ["Star Wars: Rise of the Resistance"]),
  ...R("AK", "", ["Na'vi River Journey", "Kilimanjaro Safaris", "Expedition Everest", "Kali River Rapids"]),
  ...R("AK", "Single Pass", ["Avatar Flight of Passage"]),
].map((r, i) => ({ ...r, id: `r${i + 1}`, order: i + 1 }));

const OFFICIAL_DINING = "https://disneyworld.disney.go.com/dining/";
const F = (name: string, type: string, area: string, spot: string, hi = false, note = ""): Omit<Food, "id" | "order"> =>
  ({ name, type, area, spot, note, url: OFFICIAL_DINING, hi });
const food: Food[] = [
  F("Pecos Bill Tall Tale Inn and Cafe", "QS", "Magic Kingdom", "Frontierland"),
  F("Dole Whip", "Snack", "Magic Kingdom", "Adventureland", true),
  F("Character dinner", "TS", "Magic Kingdom", "", true, "Book at 60 days"),
  F("Kringla Bakeri og Kafe", "Snack", "EPCOT", "Norway"),
  F("Satu'li Canteen", "QS", "Animal Kingdom", "Pandora", true),
  F("Woody's Lunch Box", "QS", "Hollywood Studios", "Toy Story Land"),
  F("Sci-Fi Dine-In Theater", "TS", "Hollywood Studios", "Commissary Lane"),
  F("Disney Springs dinner", "TS", "Disney Springs", "", false, "Pick somewhere nearer the time"),
].map((f, i) => ({ ...f, id: `f${i + 1}`, order: i + 1 }));

export const SAMPLE: TripData = {
  trip: {
    id: "sample",
    title: "Our Big Orlando Trip ✨",
    destination: "Walt Disney World",
    origin: "London",
    start_date: START,
    end_date: "2027-06-17",
    checkin_date: START,
    on_site_hotel: true,
    arrival_time: "2027-06-10T15:20:00",
    currency: "GBP",
    credits_ts: 7,
    credits_qs: 7,
    credits_sn: 7,
    paid: false,
    adults: 2,
    child_ages: [],
    dining_plan: "standard",
    setup_done: [],
    hidden_tabs: [],
  },
  days,
  items,
  rides,
  ll_picks: [
    { park: "MK", ride_name: "Seven Dwarfs Mine Train" },
    { park: "MK", ride_name: "Haunted Mansion" },
    { park: "AK", ride_name: "Kilimanjaro Safaris" },
  ],
  food,
  qs_wish: [
    { id: "q1", name: "Pecos Bill", area: "Magic Kingdom", key: "", order: 1 },
    { id: "q2", name: "Columbia Harbour House", area: "Magic Kingdom", key: "columbia", order: 2 },
    { id: "q3", name: "Satu'li Canteen", area: "Animal Kingdom", key: "satu", order: 3 },
    { id: "q4", name: "Regal Eagle Smokehouse", area: "EPCOT", key: "regal eagle", order: 4 },
    { id: "q5", name: "Woody's Lunch Box", area: "Hollywood Studios", key: "woody", order: 5 },
  ],
  budget: [
    { id: "b1", name: "Flights", cost: 1400, paid: 1400, note: "Two return tickets", order: 1 },
    { id: "b2", name: "Hotel and park tickets", cost: 3800, paid: 1000, note: "Balance due 60 days out", order: 2 },
    { id: "b3", name: "Dining plan", cost: 900, paid: 0, note: "", order: 3 },
    { id: "b4", name: "Lightning Lane Multi Pass", cost: null, paid: 0, note: "Price shows when you book", order: 4 },
    { id: "b5", name: "Travel insurance", cost: 80, paid: 80, note: "", order: 5 },
    { id: "b6", name: "Spending money", cost: null, paid: 0, note: "", order: 6 },
  ],
  park_hours: [
    { id: "h1", park: "Magic Kingdom", opens: "08:30*", closes: "23:00", order: 1 },
    { id: "h2", park: "EPCOT", opens: "08:30*", closes: "21:00", order: 2 },
    { id: "h3", park: "Hollywood Studios", opens: "08:30*", closes: "21:00", order: 3 },
    { id: "h4", park: "Animal Kingdom", opens: "07:30*", closes: "19:00", order: 4 },
  ],
  pack: [
    { id: "p1", text: "Check passports are in date", list: "To do", group: "Before you go", done: true, order: 1 },
    { id: "p2", text: "Apply for ESTA", list: "To do", group: "Before you go", done: false, order: 2 },
    { id: "p3", text: "Download the park app", list: "To do", group: "Before you go", done: false, order: 3 },
    { id: "p4", text: "Suncream", list: "Shared essentials", group: "Parks", done: false, order: 4 },
    { id: "p5", text: "Portable charger", list: "Shared essentials", group: "Parks", done: false, order: 5 },
    { id: "p6", text: "Ponchos", list: "Shared essentials", group: "Parks", done: false, order: 6 },
    { id: "p7", text: "US plug adaptors", list: "Shared essentials", group: "Travel", done: false, order: 7 },
  ],
  flights: [],
  stays: [],
  hotels: HOTELS,
  rules: SAMPLE_RULES,
};
