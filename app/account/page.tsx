"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Footer } from "@/components/Footer";

export default function Account() {
  const router = useRouter();
  const [email, setEmail] = useState<string | null>(null);
  const [confirm, setConfirm] = useState("");
  const [err, setErr] = useState("");
  useEffect(() => {
    supabaseBrowser().auth.getUser().then(({ data }) => {
      if (!data.user) router.replace("/login?next=/account");
      else setEmail(data.user.email || "");
    });
  }, [router]);

  const signOut = async () => { await supabaseBrowser().auth.signOut(); router.replace("/"); };
  const del = async () => {
    const sb = supabaseBrowser();
    const { error } = await sb.rpc("delete_my_account");
    if (error) { setErr(error.message); return; }
    await sb.auth.signOut();
    router.replace("/");
  };

  return (
    <>
      <main className="wrap narrow">
        <div className="topbar"><Link href="/trips" className="brand">Magicbound</Link><Link href="/trips" className="btn">Your trips</Link></div>
        <section>
          <h2>Account</h2>
          <div className="panel">
            <p style={{ marginTop: 0 }}>Signed in as <b>{email ?? "…"}</b></p>
            <button className="btn" onClick={signOut}>Sign out</button>
          </div>
          <div className="panel" style={{ marginTop: 18 }}>
            <h3>Delete your account</h3>
            <p style={{ marginTop: 0, fontSize: 14 }}>
              This deletes your account and every trip you own, including everything other people added to them. You&apos;ll be
              removed from trips other people own. It can&apos;t be undone.
            </p>
            <label className="fld">Type DELETE to confirm<input type="text" value={confirm} onChange={(e) => setConfirm(e.target.value)} /></label>
            {err && <p className="status bad">{err}</p>}
            <button className="btn danger" disabled={confirm !== "DELETE"} onClick={del}>Delete my account</button>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
