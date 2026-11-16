"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { QuickStart, type Setup } from "@/components/setup/QuickStart";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Footer } from "@/components/Footer";

export default function NewTrip() {
  const router = useRouter();
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  useEffect(() => {
    supabaseBrowser().auth.getUser().then(({ data }) => { if (!data.user) router.replace("/login?next=/trips/new"); });
  }, [router]);

  const create = async (s: Setup) => {
    setBusy(true); setErr("");
    const { data, error } = await supabaseBrowser().rpc("create_trip", {
      p_title: s.title, p_start: s.start, p_end: s.end, p_adults: s.adults, p_child_ages: s.childAges, p_destination: s.destination,
    });
    if (error) { setBusy(false); setErr("Couldn't create the trip. Check your connection and try again."); console.error(error); return; }
    router.push(`/trips/${data}`);
  };

  return (
    <>
      <div className="wrap"><div className="topbar"><Link href="/trips" className="brand">Magicbound</Link><Link href="/trips" className="btn">Cancel</Link></div></div>
      {err && <div className="wrap narrow"><p className="status bad">{err}</p></div>}
      <QuickStart onDone={create} busy={busy} />
      <Footer />
    </>
  );
}
