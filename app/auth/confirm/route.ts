import type { EmailOtpType } from "@supabase/supabase-js";
import { NextResponse, type NextRequest } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

// Sign-in emails link here with a one-time token hash. Verifying it on the
// server works whichever browser or device opens the link.
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const token_hash = url.searchParams.get("token_hash");
  const type = (url.searchParams.get("type") || "email") as EmailOtpType;
  const next = url.searchParams.get("next") || "/trips";
  const safeNext = next.startsWith("/") && !next.startsWith("//") ? next : "/trips";
  if (token_hash) {
    const { error } = await (await supabaseServer()).auth.verifyOtp({ type, token_hash });
    if (!error) return NextResponse.redirect(new URL(safeNext, url.origin));
    console.error("[auth/confirm]", error.message);
  }
  return NextResponse.redirect(new URL("/login?error=link", url.origin));
}
