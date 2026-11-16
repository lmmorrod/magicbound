-- The project doesn't expose new tables to the API automatically, so grant
-- exactly what the app needs. RLS policies still decide which rows.
grant usage on schema public to anon, authenticated;

grant select on public.ref_packs, public.ref_rides, public.ref_food, public.ref_rules to anon, authenticated;

grant select, update on public.profiles to authenticated;
grant select, insert, update, delete on
  public.trips, public.trip_members, public.trip_invites,
  public.days, public.items, public.ll_picks, public.rides, public.food,
  public.qs_wish, public.budget, public.park_hours, public.pack
to authenticated;

-- Functions: signed-in users only.
revoke execute on function public.create_trip(text, date, date, date, boolean, timestamp, int, int, int, text, text) from public, anon;
grant execute on function public.create_trip(text, date, date, date, boolean, timestamp, int, int, int, text, text) to authenticated;
grant execute on function public.is_member(uuid), public.can_write(uuid), public.is_owner(uuid) to authenticated;
revoke execute on function public.is_member(uuid), public.can_write(uuid), public.is_owner(uuid) from anon;
