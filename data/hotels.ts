// Mockup reference data: a slice of the hotel list a WDW pack would carry.
// Journey times are rough typical door-to-gate estimates, to be checked before launch.
export type HotelTier = "Value" | "Moderate" | "Deluxe" | "Deluxe Villa" | "Off-site";
export type Mode = "Bus" | "Skyliner" | "Monorail" | "Boat" | "Walk" | "Car";

import type { Hotel } from "@/lib/types";
export type { Hotel };

export const HOTELS: Hotel[] = [
  { id: "pop", name: "Pop Century Resort", tier: "Value", onSite: true, times: { MK: [30, "Bus"], EP: [20, "Skyliner"], HS: [20, "Skyliner"], AK: [25, "Bus"] } },
  { id: "aoa", name: "Art of Animation Resort", tier: "Value", onSite: true, times: { MK: [30, "Bus"], EP: [20, "Skyliner"], HS: [20, "Skyliner"], AK: [25, "Bus"] } },
  { id: "asm", name: "All-Star Movies Resort", tier: "Value", onSite: true, times: { MK: [30, "Bus"], EP: [20, "Bus"], HS: [15, "Bus"], AK: [15, "Bus"] } },
  { id: "cbr", name: "Caribbean Beach Resort", tier: "Moderate", onSite: true, times: { MK: [30, "Bus"], EP: [15, "Skyliner"], HS: [15, "Skyliner"], AK: [25, "Bus"] } },
  { id: "pofq", name: "Port Orleans – French Quarter", tier: "Moderate", onSite: true, times: { MK: [30, "Bus"], EP: [25, "Bus"], HS: [25, "Bus"], AK: [30, "Bus"] } },
  { id: "cs", name: "Coronado Springs Resort", tier: "Moderate", onSite: true, times: { MK: [30, "Bus"], EP: [20, "Bus"], HS: [15, "Bus"], AK: [15, "Bus"] } },
  { id: "rr", name: "Riviera Resort", tier: "Deluxe Villa", onSite: true, times: { MK: [30, "Bus"], EP: [10, "Skyliner"], HS: [15, "Skyliner"], AK: [25, "Bus"] } },
  { id: "bc", name: "Beach Club Resort", tier: "Deluxe", onSite: true, times: { MK: [30, "Bus"], EP: [10, "Walk"], HS: [20, "Boat"], AK: [25, "Bus"] } },
  { id: "ywc", name: "Yacht Club Resort", tier: "Deluxe", onSite: true, times: { MK: [30, "Bus"], EP: [10, "Walk"], HS: [20, "Boat"], AK: [25, "Bus"] } },
  { id: "poly", name: "Polynesian Village Resort", tier: "Deluxe", onSite: true, times: { MK: [10, "Monorail"], EP: [25, "Monorail"], HS: [25, "Bus"], AK: [25, "Bus"] } },
  { id: "gf", name: "Grand Floridian Resort", tier: "Deluxe", onSite: true, times: { MK: [10, "Monorail"], EP: [25, "Monorail"], HS: [25, "Bus"], AK: [25, "Bus"] } },
  { id: "ct", name: "Contemporary Resort", tier: "Deluxe", onSite: true, times: { MK: [10, "Walk"], EP: [25, "Monorail"], HS: [25, "Bus"], AK: [25, "Bus"] } },
  { id: "akl", name: "Animal Kingdom Lodge", tier: "Deluxe", onSite: true, times: { MK: [30, "Bus"], EP: [25, "Bus"], HS: [20, "Bus"], AK: [10, "Bus"] } },
  { id: "off", name: "Somewhere off-site (villa, hotel, Airbnb…)", tier: "Off-site", onSite: false, times: {} },
];

export const hotelById = (id: string, list: Hotel[] = HOTELS) => list.find((h) => h.id === id);

/** On-site perks, worked out from the hotel tier. Shown as guidance. */
export function benefits(h: Hotel): string[] {
  if (!h.onSite) return ["Lightning Lane: book 3 days before each park day", "Dining: book 60 days before each meal"];
  const b = ["Early Theme Park Entry: 30 minutes early, every park, every day", "Lightning Lane: book 7 days before check-in", "Dining: book 60 days out for the first 10 nights", "Free resort buses, plus Skyliner, monorail or boat where listed"];
  if (h.tier === "Deluxe" || h.tier === "Deluxe Villa") b.splice(1, 0, "Extended Evening Hours on selected nights");
  return b;
}

/** Disney's dining plans as credits per person (ages 3+) per night. */
export const PLANS = {
  none: { label: "No dining plan", per: { TS: 0, QS: 0, SN: 0 }, note: "Pay as you go. The Dining credits tab stays hidden." },
  quick: { label: "Quick-Service Dining Plan", per: { TS: 0, QS: 2, SN: 1 }, note: "2 quick-service meals and 1 snack per person, per night." },
  standard: { label: "Disney Dining Plan", per: { TS: 1, QS: 1, SN: 1 }, note: "1 table-service meal, 1 quick-service meal and 1 snack per person, per night." },
} as const;
export type PlanKey = keyof typeof PLANS;
