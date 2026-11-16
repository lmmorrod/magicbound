"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@supabase/supabase-js";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "@/lib/supabase/env";
import { Footer } from "@/components/Footer";

export default function Login() {
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "sending" | "sent" | "error">("idle");
  const [msg, setMsg] = useState("");
  const [linkFailed, setLinkFailed] = useState(false);
  useEffect(() => setLinkFailed(new URLSearchParams(location.search).get("error") === "link"), []);
  const send = async (e: React.FormEvent) => {
    e.preventDefault();
    setState("sending");
    const next = new URLSearchParams(location.search).get("next") || "/trips";
    // Implicit flow for the email only: the link carries the session itself, so it
    // works in whichever browser opens it (the code flow only works in this one).
    // The default Supabase emails can't be edited without custom SMTP, which rules
    // out the token-hash link for now. /auth/finish hands the session to the app.
    const mailer = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      auth: { flowType: "implicit", persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
    });
    const { error } = await mailer.auth.signInWithOtp({
      email: email.trim(),
      options: { emailRedirectTo: `${location.origin}/auth/finish?next=${encodeURIComponent(next)}` },
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
              {linkFailed && (
                <p className="banner" style={{ marginTop: 0 }}>
                  That sign-in link didn&apos;t work. Links last an hour and only work once, so ask for a fresh one below.
                </p>
              )}
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
