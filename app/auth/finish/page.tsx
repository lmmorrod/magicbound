"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

// Sign-in links land here with the session in the URL fragment (#access_token=…).
// The fragment never reaches the server; we hand it to the app's client, which
// stores it in cookies, then clear it from the address bar.
export default function FinishSignIn() {
  const router = useRouter();
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    const hash = new URLSearchParams(location.hash.slice(1));
    const q = new URLSearchParams(location.search);
    const next = q.get("next") || "/trips";
    const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/trips";
    history.replaceState(null, "", location.pathname + location.search);
    const access_token = hash.get("access_token"), refresh_token = hash.get("refresh_token");
    if (!access_token || !refresh_token) { setFailed(true); return; }
    supabaseBrowser().auth.setSession({ access_token, refresh_token }).then(({ error }) => {
      if (error) setFailed(true);
      else router.replace(safeNext);
    });
  }, [router]);
  return (
    <main className="wrap narrow">
      <section>
        {failed ? (
          <>
            <h2>That link didn&apos;t work</h2>
            <p className="sub">Sign-in links last an hour and only work once. Ask for a fresh one and it should go straight through.</p>
            <Link className="btn pri" href="/login">Get a new link</Link>
          </>
        ) : <p className="loading">Signing you in…</p>}
      </section>
    </main>
  );
}
