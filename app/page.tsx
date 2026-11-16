import { Planner } from "@/components/Planner";
import { SAMPLE } from "@/data/sample";

// Milestone 1: the planner running on a local sample trip. Edits stay in this tab.
export default function Home() {
  return <Planner initial={SAMPLE} />;
}
