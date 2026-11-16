"use client";
import { useState } from "react";
import Link from "next/link";
import { supabaseBrowser } from "@/lib/supabase/client";
import { Footer } from "@/components/Footer";

export default function Login() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [msg, setMsg] = useState("");
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    const next = new URLSearchParams(location.search).get("next") || "/trips";
    const { error } = await supabaseBrowser().auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${location.origin}/auth/callback?next=${encodeURIComponent(next)}` },
    });
    if (error) { setState("error"); setMsg(error.message); } else setState("sent");
  };
  return (
    <>
      <main className="wrap narrow">
        <section>
          <Link href="/" className="brand">Magicbound</Link>
          <h2 style={{ marginTop: 16 }}>Sign in</h2>
          {state === "sent" ? (
            <div className="panel">
              <h3>Check your email</h3>
              <p style={{ margin: 0 }}>We&apos;ve sent a sign-in link to <b>{email}</b>. Open it on this device to carry on.</p>
            </div>
          ) : (
            <form className="panel" onSubmit={send}>
              <p className="note" style={{ marginTop: 0 }}>No password needed. We&apos;ll email you a link; new here and it makes your account.</p>
              <label className="fld">Email<input type="email" required autoComplete="email" value={email} onChange={(e) => setEmail(e.target.value)} /></label>
              {state === "error" && <p className="status bad">Couldn&apos;t send the link: {msg}</p>}
              <div className="dact"><span style={{ flex: 1 }} /><button className="btn pri" disabled={state === "sending"}>{state === "sending" ? "Sending…" : "Email me a link"}</button></div>
            </form>
          )}
        </section>
      </main>
      <Footer />
    </>
  );
}
