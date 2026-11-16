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
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");

  useEffect(() => {
    const sb = supabaseBrowser();
    (async () => {
      const { data: u } = await sb.auth.getUser();
      if (!u.user) { router.replace("/login?next=/trips"); return; }
      const { data, error } = await sb.from("trips").select("id, title, start_date, end_date, destination").order("start_date");
      if (error) setErr(error.message);
      setTrips(data || []);
    })();
  }, [router]);

  // Quick create for now; the setup wizard replaces this in milestone 4.
  const create = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setBusy(true); setErr("");
    const { data, error } = await supabaseBrowser().rpc("create_trip", {
      p_title: String(f.get("title")).trim(),
      p_start: f.get("start"), p_end: f.get("end"),
      p_on_site: f.get("onsite") === "on",
    });
    setBusy(false);
    if (error) { setErr(error.message); return; }
    router.push(`/trips/${data}`);
  };

  return (
    <>
      <main className="wrap">
        <div className="topbar">
          <Link href="/trips" className="brand">Magicbound</Link>
          <Link href="/account" className="btn">Account</Link>
        </div>
        <section>
          <h2>Your trips</h2>
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
          <form className="panel" style={{ maxWidth: 520 }} onSubmit={create}>
            <h3>New trip</h3>
            <label className="fld">Trip name<input type="text" name="title" required placeholder="e.g. Our summer trip" /></label>
            <div className="frow">
              <label className="fld">First day<input type="date" name="start" required /></label>
              <label className="fld">Last day<input type="date" name="end" required /></label>
            </div>
            <label className="nb" style={{ fontSize: 14 }}><input type="checkbox" name="onsite" defaultChecked /> Staying at an on-site hotel</label>
            {err && <p className="status bad">{err}</p>}
            <div className="dact"><span style={{ flex: 1 }} /><button className="btn pri" disabled={busy}>{busy ? "Creating…" : "Create trip"}</button></div>
          </form>
        </section>
      </main>
      <Footer />
    </>
  );
}
