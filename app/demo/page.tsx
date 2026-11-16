import Link from "next/link";
import { Planner } from "@/components/Planner";
import { SAMPLE } from "@/data/sample";

export const metadata = { title: "Sample trip | Magicbound" };

// A sample trip anyone can play with. Changes stay in this browser tab.
export default function Demo() {
  return <Planner initial={SAMPLE} extra={<Link className="editbtn" href="/login">Sign in</Link>} />;
}
