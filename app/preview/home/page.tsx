"use client";
// Clickable mockup of the redesign: trip home, grouped sections, phone bottom bar, artwork and map.
import { DreamPlanner } from "@/components/mock/DreamShell";
import { SAMPLE } from "@/data/sample";
import type { TripData } from "@/lib/types";

const TRIP: TripData = {
  ...SAMPLE,
  trip: { ...SAMPLE.trip, id: "preview-home", adults: 2, child_ages: [7] },
  stays: [{ id: "s1", hotel_key: "rr", name: "Riviera Resort", tier: "Deluxe Villa", on_site: true, check_in: "2027-06-10", check_out: "2027-06-17", order: 1 }],
};

export default function HomePreview() {
  return (
    <>
      <div className="previewbar">Preview of the redesign · sample trip · nothing is saved</div>
      <DreamPlanner initial={TRIP} />
    </>
  );
}
