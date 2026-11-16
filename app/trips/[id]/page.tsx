"use client";
import { use, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Planner } from "@/components/Planner";
import { supabaseBrowser } from "@/lib/supabase/client";
import { loadTrip, supabaseBackend, supabaseConnect } from "@/lib/supabase/trip";
import type { Role, TripData } from "@/lib/types";

export default function TripPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const sb = supabaseBrowser();
  const [state, setState] = useState<{ data: TripData; role: Role } | "loading" | "missing" | "error">("loading");
  const backend = useMemo(() => supabaseBackend(sb, id), [sb, id]);
  const connect = useMemo(() => supabaseConnect(sb, id), [sb, id]);

  useEffect(() => {
    (async () => {
      const { data: u } = await sb.auth.getUser();
      if (!u.user) { router.replace(`/login?next=/trips/${id}`); return; }
      try { setState((await loadTrip(sb, id)) || "missing"); } catch { setState("error"); }
    })();
  }, [sb, id, router]);

  if (state === "loading") return <main className="wrap"><p className="loading">Loading your plan…</p></main>;
  if (state === "missing" || state === "error")
    return (
      <main className="wrap narrow"><section>
        <h2>{state === "missing" ? "Trip not found" : "Couldn't load this trip"}</h2>
        <p className="sub">{state === "missing" ? "It may have been deleted, or you haven't been added to it." : "Check your connection and try again."}</p>
        <Link className="btn" href="/trips">Back to your trips</Link>
      </section></main>
    );
  return (
    <Planner initial={state.data} canWrite={state.role !== "viewer"} backend={backend} connect={connect}
      extra={<Link className="editbtn" href="/trips" style={{ borderColor: "var(--line)" }}>Trips</Link>} />
  );
}
