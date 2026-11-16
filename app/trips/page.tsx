"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { dateRange } from "@/lib/plan";
import { Footer } from "@/components/Footer";

interface TripRow { id: string; title: string; start_date: string; end_date: string; destination: string }

export default function Trips() {
  const router = useRouter();
  const [trips, setTrips] = useState<TripRow[] | null>(null);
  const [err, setErr] = useState("");

  useEffect(() => {
    const sb = supabaseBrowser();
    (async () => {
      const { data: u } = await sb.auth.getUser();
      if (!u.user) { router.replace("/login?next=/trips"); return; }
      const { data, error } = await sb.from("trips").select("id, title, start_date, end_date, destination").order("start_date");
      if (error) { setErr(error.message); console.error(error); }
      setTrips(data || []);
    })();
  }, [router]);

  return (
    <>
      <main className="wrap">
        <div className="topbar">
          <Link href="/trips" className="brand">Magicbound</Link>
          <Link href="/account" className="btn">Account</Link>
        </div>
        <section>
          <h2>Your trips</h2>
          {err && <p className="status bad">Couldn&apos;t load your trips. Refresh to try again.</p>}
          {trips === null ? <p className="loading">Loading your trips…</p> : trips.length ? (
            <div className="triplist">
              {trips.map((t) => (
                <Link key={t.id} href={`/trips/${t.id}`} className="panel tripcard">
                  <div className="day-date">{t.destination}</div>
                  <div className="day-park">{t.title}</div>
                  <p className="note" style={{ marginBottom: 0 }}>{dateRange(t.start_date, t.end_date)}</p>
                </Link>
              ))}
            </div>
          ) : <p className="sub">No trips yet. Start one below.</p>}
        </section>
        <section>
          <Link className="btn pri" href="/trips/new">+ Plan a new trip</Link>
        </section>
      </main>
      <Footer />
    </>
  );
}
