import { describe, expect, it } from "vitest";
import {
  byTime, creditStats, creditStatus, crTag, dateRange, dropItem, hourRange, isLL, opens, parseDate, qsPlaced,
  toISODate, budgetTotals, countdown,
} from "./plan";
import { createWriteQueue } from "./writeQueue";
import type { Day, Item, Rules } from "./types";

const item = (p: Partial<Item>): Item => ({
  id: Math.random().toString(36).slice(2), day_id: "d1", time: null, text: "", credit: null, n: 1, used: false,
  res: null, conf: null, ...p,
});
const RULES: Rules = {
  dining_window_days: 60, dining_onsite_span_days: 10, ll_window_onsite: 7, ll_window_offsite: 3,
  dining_open_time: "6am Orlando time", ll_open_time: "7am Orlando time", last_checked: "2026-11-01",
};

describe("byTime / isLL / crTag", () => {
  it("sorts by time with blanks first", () => {
    const l = [{ time: "13:00" }, { time: null }, { time: "08:30" }].sort(byTime);
    expect(l.map((x) => x.time)).toEqual([null, "08:30", "13:00"]);
  });
  it("spots Lightning Lane items by text", () => {
    expect(isLL({ text: "Lightning Lane Multi Pass" })).toBe(true);
    expect(isLL({ text: "lightning lane: Slinky" })).toBe(true);
    expect(isLL({ text: "Dinner" })).toBe(false);
  });
  it("labels credits", () => {
    expect(crTag({ credit: "TS", n: 2 })).toBe("2 TS");
    expect(crTag({ credit: "TS", n: 1 })).toBe("TS");
    expect(crTag({ credit: "QS", n: 2 })).toBe("QS");
    expect(crTag({ credit: "SN", n: 1 })).toBe("Snack");
    expect(crTag({ credit: null, n: 1 })).toBe("");
  });
});

// The original's maths, kept verbatim as an oracle.
function originalCredits(items: { day: string; credit: string; n: number; used: boolean }[], k: string, allow: number) {
  const its = items.filter((i) => i.credit === k);
  const sch = its.filter((i) => i.day !== "loose"), lo = its.filter((i) => i.day === "loose");
  const w = (i: { n: number }) => (k === "TS" ? +i.n || 1 : 1);
  const nS = sch.reduce((a, i) => a + w(i), 0), nL = lo.reduce((a, i) => a + w(i), 0),
    nU = its.filter((i) => i.used).reduce((a, i) => a + w(i), 0);
  const total = nS + nL, free = allow - total;
  const cells: string[] = [];
  for (let j = 0; j < Math.max(allow, total); j++) cells.push(j >= allow ? "over" : j < nU ? "u" : j < nS ? "s" : j < total ? "l" : "");
  return { nS, nL, nU, total, free, cells };
}

describe("credit meter", () => {
  const items = [
    item({ credit: "TS", n: 2, text: "Signature dinner" }),
    item({ credit: "TS", n: 1, used: true, text: "Breakfast" }),
    item({ credit: "TS", n: 2, day_id: null, text: "Loose signature" }),
    item({ credit: "QS", n: 2, text: "QS with n=2 still counts 1" }),
    item({ credit: "QS", used: true }),
    item({ credit: "QS", day_id: null }),
    item({ credit: "SN" }),
  ];
  const legacy = items.map((i) => ({ day: i.day_id ?? "loose", credit: i.credit ?? "", n: i.n, used: i.used }));

  for (const [k, allow] of [["TS", 4], ["TS", 8], ["QS", 3], ["QS", 2], ["SN", 0]] as const) {
    it(`matches the original for ${k} with ${allow} on plan`, () => {
      const s = creditStats(items, k, allow), o = originalCredits(legacy, k, allow);
      expect([s.scheduled, s.loose, s.used, s.total, s.free]).toEqual([o.nS, o.nL, o.nU, o.total, o.free]);
      expect(s.cells).toEqual(o.cells);
    });
  }
  it("weights TS by n and flags over-allowance", () => {
    const s = creditStats(items, "TS", 4);
    expect(s).toMatchObject({ scheduled: 3, loose: 2, used: 1, total: 5, free: -1 });
    expect(s.cells).toEqual(["u", "s", "s", "l", "over"]);
    expect(creditStatus(s)).toEqual({ text: "1 over the 4 on the plan.", bad: true });
  });
  it("status lines", () => {
    expect(creditStatus({ allow: 5, free: 3 }).text).toBe("3 still free.");
    expect(creditStatus({ allow: 5, free: 0 }).text).toBe("All 5 accounted for.");
  });
});

describe("quick-service placed?", () => {
  const days: Day[] = [{ id: "d1", order: 1, date: "2027-06-10", park: "MK", label: "Magic Kingdom", event: "" }];
  const items = [item({ text: "Lunch at Pecos Bill", time: "12:30" }), item({ text: "Dole Whip", day_id: null })];
  it("matches case-insensitive substrings", () => {
    expect(qsPlaced("pecos bill", items, days)).toBe("On Thu 10 Jun at 12:30");
    expect(qsPlaced("DOLE", items, days)).toBe("Loose credit, no day yet");
    expect(qsPlaced("Satu'li", items, days)).toBeNull();
    expect(qsPlaced("  ", items, days)).toBeNull();
  });
});

describe("dropItem", () => {
  it("keeps the minutes when moving hour", () => {
    expect(dropItem({ day_id: "a", time: "12:45" }, "b|15:00")).toEqual({ day_id: "b", time: "15:45" });
  });
  it("uses :00 when there was no time", () => {
    expect(dropItem({ day_id: "a", time: null }, "a|09:00")).toEqual({ day_id: "a", time: "09:00" });
  });
  it("clears the time for LL and Any-time rows", () => {
    expect(dropItem({ day_id: "a", time: "10:15" }, "a|LL")).toEqual({ day_id: "a", time: "" });
    expect(dropItem({ day_id: "a", time: "10:15" }, "b|")).toEqual({ day_id: "b", time: "" });
  });
  it("returns null when nothing changes", () => {
    expect(dropItem({ day_id: "a", time: "10:15" }, "a|10:00")).toBeNull();
    expect(dropItem({ day_id: "a", time: null }, "a|")).toBeNull();
  });
});

describe("hourRange", () => {
  it("defaults to 7–23 and stretches", () => {
    expect(hourRange([])).toEqual([7, 23]);
    expect(hourRange([item({ time: "05:30" })])).toEqual([5, 23]);
    expect(hourRange([item({ time: "05:30", day_id: null }), item({ time: "06:00", text: "Lightning Lane" })])).toEqual([7, 23]);
  });
});

// Original: CHECKIN fixed; LL = checkin-7; dining base=min(day, checkin+9) - 60.
function originalOpens(text: string, credit: string, dayISO: string | null, checkinISO: string) {
  const CHECKIN = parseDate(checkinISO), DAYMS = 864e5;
  if (/lightning lane/i.test(text)) return new Date(+CHECKIN - 7 * DAYMS);
  if (credit === "TS" || /dining|breakfast|dinner|lunch/i.test(text)) {
    if (!dayISO) return null;
    return new Date(Math.min(+parseDate(dayISO), +CHECKIN + 9 * DAYMS) - 60 * DAYMS);
  }
  return null;
}

describe("booking windows: 14-night on-site stay", () => {
  const trip = { checkin_date: "2027-06-10", on_site_hotel: true };
  const dayDates = Array.from({ length: 15 }, (_, i) => toISODate(new Date(2027, 5, 10 + i)));
  it("matches the original for every day of the stay", () => {
    for (const date of dayDates) {
      for (const [text, credit] of [["Dinner somewhere", "TS"], ["Character breakfast", null], ["Lightning Lane Multi Pass", null]] as const) {
        const got = opens({ text, credit }, { date }, trip, RULES);
        const want = originalOpens(text, credit ?? "", date, trip.checkin_date);
        expect(got && toISODate(got.date)).toBe(want && toISODate(want));
      }
    }
  });
  it("gives the expected dates", () => {
    const o = (date: string, text = "Dinner", credit: "TS" | null = "TS") => toISODate(opens({ text, credit }, { date }, trip, RULES)!.date);
    expect(o("2027-06-10")).toBe("2027-04-11");
    expect(o("2027-06-19")).toBe("2027-04-20"); // day 10: last of the first-10-days span
    expect(o("2027-06-24")).toBe("2027-04-20"); // later meals open with day 10
    expect(o("2027-06-15", "Lightning Lane Multi Pass", null)).toBe("2027-06-03");
  });
  it("returns null for things with no window or no day", () => {
    expect(opens({ text: "Fireworks cruise", credit: null }, { date: "2027-06-12" }, trip, RULES)).toBeNull();
    expect(opens({ text: "Dinner", credit: "TS" }, null, trip, RULES)).toBeNull();
  });
  it("uses the rules, not constants", () => {
    const r = { ...RULES, dining_window_days: 30, ll_window_onsite: 5 };
    expect(toISODate(opens({ text: "x", credit: "TS" }, { date: "2027-06-10" }, trip, r)!.date)).toBe("2027-05-11");
    expect(toISODate(opens({ text: "Lightning Lane", credit: null }, null, trip, r)!.date)).toBe("2027-06-05");
  });
  it("off-site: LL per park day, dining per meal", () => {
    const off = { ...trip, on_site_hotel: false };
    expect(toISODate(opens({ text: "Lightning Lane", credit: null }, { date: "2027-06-15" }, off, RULES)!.date)).toBe("2027-06-12");
    expect(toISODate(opens({ text: "x", credit: "TS" }, { date: "2027-06-24" }, off, RULES)!.date)).toBe("2027-04-25");
  });
});

describe("misc", () => {
  it("date ranges", () => {
    expect(dateRange("2027-06-10", "2027-06-24")).toBe("10 to 24 Jun 2027");
    expect(dateRange("2027-06-28", "2027-07-03")).toBe("28 Jun to 3 Jul 2027");
  });
  it("budget totals", () => {
    expect(budgetTotals([{ cost: 100, paid: 40 }, { cost: null, paid: 0 }, { cost: 50, paid: 50 }])).toEqual({ total: 150, paid: 90, left: 60, toPrice: 1 });
  });
  it("countdown", () => {
    expect(countdown(new Date(2027, 0, 15), new Date(2027, 0, 1))).toEqual({ days: 14, weeks: 2 });
    expect(countdown(new Date(2027, 0, 1), new Date(2027, 0, 2))).toBeNull();
  });
});

describe("write queue", () => {
  it("runs writes to one doc in order, others in parallel", async () => {
    const log: string[] = [];
    const write = createWriteQueue(() => log.push("err"));
    const wait = (ms: number, s: string) => () => new Promise((r) => setTimeout(() => { log.push(s); r(null); }, ms));
    write("items/a", wait(20, "a1"));
    write("items/a", wait(1, "a2"));
    await write("items/b", wait(5, "b1"));
    await write("items/a", async () => log.push("a3"));
    expect(log).toEqual(["b1", "a1", "a2", "a3"]);
  });
  it("keeps going after an error", async () => {
    const errs: unknown[] = [];
    const write = createWriteQueue((e) => errs.push(e));
    write("x", async () => { throw new Error("nope"); });
    let ran = false;
    await write("x", async () => { ran = true; });
    expect(errs).toHaveLength(1);
    expect(ran).toBe(true);
  });
});
