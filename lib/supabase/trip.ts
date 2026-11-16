"use client";
// Loading a trip, writing to it and listening for live changes, via Supabase.
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Backend, Connect, RemoteChange } from "@/components/store";
import type { Hotel, Role, Rules, Table, TripData } from "@/lib/types";
import { SAMPLE_RULES } from "@/data/sample";

const TABLES: Table[] = ["days", "items", "rides", "food", "qs_wish", "budget", "park_hours", "pack", "flights", "stays"];
const ORDERED = new Set<Table>(["days", "rides", "food", "qs_wish", "budget", "park_hours", "pack", "flights", "stays"]);

/** ref_rules rows → Rules, falling back to defaults for anything missing. */
export function parseRules(rows: { key: string; value: string }[], lastChecked?: string | null): Rules {
  const r: Record<string, string | number> = { ...SAMPLE_RULES };
  for (const { key, value } of rows) {
    if (!(key in SAMPLE_RULES)) continue;
    r[key] = typeof SAMPLE_RULES[key as keyof Rules] === "number" ? Number(value) : value;
  }
  if (lastChecked) r.last_checked = lastChecked;
  return r as unknown as Rules;
}

export async function loadTrip(sb: SupabaseClient, tripId: string): Promise<{ data: TripData; role: Role } | null> {
  const { data: auth } = await sb.auth.getUser();
  if (!auth.user) return null;
  const { data: trip, error } = await sb.from("trips").select("*").eq("id", tripId).maybeSingle();
  if (error) throw error;
  if (!trip) return null;
  const [member, picks, ...rest] = await Promise.all([
    sb.from("trip_members").select("role").eq("trip_id", tripId).eq("user_id", auth.user.id).maybeSingle(),
    sb.from("ll_picks").select("park, ride_name").eq("trip_id", tripId),
    ...TABLES.map((t) => {
      const q = sb.from(t).select("*").eq("trip_id", tripId);
      return ORDERED.has(t) ? q.order("order") : q;
    }),
  ]);
  for (const r of [member, picks, ...rest]) if (r.error) throw r.error;
  let rules = SAMPLE_RULES;
  let hotels: Hotel[] = [];
  if (trip.pack_id) {
    const [pack, rr, hh] = await Promise.all([
      sb.from("ref_packs").select("last_checked").eq("id", trip.pack_id).maybeSingle(),
      sb.from("ref_rules").select("key, value").eq("pack_id", trip.pack_id),
      sb.from("ref_hotels").select("key, name, tier, on_site, times").eq("pack_id", trip.pack_id).order("order"),
    ]);
    rules = parseRules(rr.data || [], pack.data?.last_checked);
    hotels = (hh.data || []).map((h) => ({ id: h.key, name: h.name, tier: h.tier, onSite: h.on_site, times: h.times }));
  }
  const tables = Object.fromEntries(TABLES.map((t, i) => [t, rest[i].data || []]));
  return {
    role: (member.data?.role as Role) || "viewer",
    data: { trip, ll_picks: picks.data || [], rules, hotels, ...tables } as unknown as TripData,
  };
}

const check = ({ error }: { error: unknown }) => {
  if (error) throw error;
};

export function supabaseBackend(sb: SupabaseClient, tripId: string): Backend {
  return {
    async update(table, id, patch) {
      const q = sb.from(table).update(patch).eq("id", id);
      check(await (table === "trips" ? q : q.eq("trip_id", tripId)));
    },
    async insert(table, row) {
      check(await sb.from(table).insert({ ...row, trip_id: tripId }));
    },
    async remove(table, id) {
      check(await sb.from(table).delete().eq("id", id).eq("trip_id", tripId));
    },
    async setLLPick(park, ride_name, on) {
      if (on) check(await sb.from("ll_picks").upsert({ trip_id: tripId, park, ride_name }));
      else check(await sb.from("ll_picks").delete().match({ trip_id: tripId, park, ride_name }));
    },
  };
}

/** One realtime channel per trip, a listener per table filtered by trip_id. */
export function supabaseConnect(sb: SupabaseClient, tripId: string): Connect {
  return (apply) => {
    const ch = sb.channel(`trip:${tripId}`);
    for (const table of [...TABLES, "ll_picks", "trips"] as RemoteChange["table"][]) {
      const filter = table === "trips" ? `id=eq.${tripId}` : `trip_id=eq.${tripId}`;
      for (const event of ["INSERT", "UPDATE"] as const) {
        ch.on("postgres_changes", { event, schema: "public", table, filter }, (p) => {
          apply({ table, type: event, row: p.new as Record<string, unknown> });
        });
      }
      // Postgres can't filter deletes (with RLS the old row is only its primary
      // key), so take them all and drop ids we don't hold. Deleting an unknown id is a no-op.
      if (table !== "trips") {
        ch.on("postgres_changes", { event: "DELETE", schema: "public", table }, (p) => {
          const old = p.old as Record<string, unknown>;
          if (table === "ll_picks" && old.trip_id !== tripId) return;
          if (old && Object.keys(old).length) apply({ table, type: "DELETE", row: old });
        });
      }
    }
    ch.subscribe();
    return () => {
      sb.removeChannel(ch);
    };
  };
}
