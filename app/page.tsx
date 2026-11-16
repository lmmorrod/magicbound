import Link from "next/link";
import { redirect } from "next/navigation";
import { Footer } from "@/components/Footer";
import { supabaseConfigured } from "@/lib/supabase/env";
import { supabaseServer } from "@/lib/supabase/server";

// Placeholder landing page; the real one comes in the Polish milestone.
export default async function Home() {
  if (supabaseConfigured()) {
    const { data } = await (await supabaseServer()).auth.getUser();
    if (data.user) redirect("/trips");
  }
  return (
    <>
      <header className="hero">
        <div className="wrap">
          <div>
            <div className="eyebrow">Magicbound</div>
            <h1>Plan the whole trip, together.</h1>
            <p>Day by day plans, dining credits, ride picks, bookings and budget, all in one place you both can edit.</p>
          </div>
        </div>
      </header>
      <main className="wrap">
        <section>
          <div className="row-actions">
            <Link className="btn pri" href="/login">Sign in or sign up</Link>
            <Link className="btn" href="/demo">Try the sample trip</Link>
          </div>
        </section>
      </main>
      <Footer />
    </>
  );
}
