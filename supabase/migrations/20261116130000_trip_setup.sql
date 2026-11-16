-- Trip setup: travellers, dining plan, flights, split stays, hotel reference data.

alter table public.trips
  add column adults int not null default 2 check (adults between 1 and 20),
  add column child_ages int[] not null default '{}',
  add column dining_plan text check (dining_plan in ('none', 'quick', 'standard')),
  add column setup_done text[] not null default '{}',   -- checklist steps marked done or skipped
  add column hidden_tabs text[] not null default '{}';

-- Items made by a setup step (flights, stays) carry its name so re-saving replaces them.
alter table public.items add column source text;

create table public.flights (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips on delete cascade,
  direction text not null check (direction in ('out', 'return')),
  flight_no text not null default '',
  from_place text not null default '',
  depart text not null default '',  -- HH:MM local
  arrive text not null default '',
  "order" int not null default 0
);

create table public.stays (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips on delete cascade,
  hotel_key text not null,
  name text not null,
  tier text not null default '',
  on_site boolean not null default false,
  check_in date not null,
  check_out date not null,
  "order" int not null default 0,
  check (check_out > check_in)
);

create table public.ref_hotels (
  pack_id uuid not null references public.ref_packs on delete cascade,
  key text not null,
  name text not null,
  tier text not null,
  on_site boolean not null,
  times jsonb not null default '{}',  -- {"MK": [30, "Bus"], ...} typical minutes and mode
  "order" int not null default 0,
  primary key (pack_id, key)
);
alter table public.ref_hotels enable row level security;
create policy "anyone reads ref hotels" on public.ref_hotels for select using (true);
grant select on public.ref_hotels to anon, authenticated;

do $$
declare t text;
begin
  foreach t in array array['flights', 'stays'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create index on public.%I (trip_id)', t);
    execute format('create policy "members read" on public.%I for select using (public.is_member(trip_id))', t);
    execute format('create policy "editors insert" on public.%I for insert with check (public.can_write(trip_id))', t);
    execute format('create policy "editors update" on public.%I for update using (public.can_write(trip_id)) with check (public.can_write(trip_id))', t);
    execute format('create policy "editors delete" on public.%I for delete using (public.can_write(trip_id))', t);
    execute format('alter table public.%I replica identity full', t);
    execute format('alter publication supabase_realtime add table public.%I', t);
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
  end loop;
end $$;

-- create_trip now takes who's going and labels the days.
drop function public.create_trip(text, date, date, date, boolean, timestamp, int, int, int, text, text);
create function public.create_trip(
  p_title text, p_start date, p_end date,
  p_adults int default 2, p_child_ages int[] default '{}',
  p_destination text default 'Walt Disney World'
) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  v_trip uuid; v_pack uuid; d date; i int := 0; n int := p_end - p_start;
begin
  if auth.uid() is null then raise exception 'sign in first'; end if;
  select id into v_pack from ref_packs where destination = p_destination order by valid_from desc limit 1;
  insert into trips (title, destination, start_date, end_date, checkin_date, on_site_hotel, adults, child_ages, pack_id)
  values (p_title, p_destination, p_start, p_end, p_start, false, p_adults, coalesce(p_child_ages, '{}'), v_pack)
  returning id into v_trip;
  for d in select generate_series(p_start, p_end, interval '1 day')::date loop
    insert into days (trip_id, "order", date, park, label)
    values (v_trip, i + 1, d,
            case when i = 0 or i = n then 'TR' else 'CH' end,
            case when i = 0 then 'Arrival day' when i = n then 'Going home' else 'To plan' end);
    i := i + 1;
  end loop;
  if v_pack is not null then
    insert into rides (trip_id, park, tier, name, flag, "order")
      select v_trip, park, tier, name, flag, "order" from ref_rides where pack_id = v_pack;
    insert into food (trip_id, name, type, area, spot, url, "order")
      select v_trip, name, type, area, spot, url, "order" from ref_food where pack_id = v_pack;
  end if;
  return v_trip;
end $$;
revoke execute on function public.create_trip(text, date, date, int, int[], text) from public, anon;
grant execute on function public.create_trip(text, date, date, int, int[], text) to authenticated;

-- Hotels for the WDW 2027 pack. Journey times are typical estimates, door to gate.
insert into public.ref_hotels (pack_id, key, name, tier, on_site, times, "order")
select p.id, h.key, h.name, h.tier, h.on_site, h.times::jsonb, h.ord
from public.ref_packs p, (values
  ('pop',  'Pop Century Resort',             'Value',        true,  '{"MK":[30,"Bus"],"EP":[20,"Skyliner"],"HS":[20,"Skyliner"],"AK":[25,"Bus"]}', 1),
  ('aoa',  'Art of Animation Resort',        'Value',        true,  '{"MK":[30,"Bus"],"EP":[20,"Skyliner"],"HS":[20,"Skyliner"],"AK":[25,"Bus"]}', 2),
  ('asm',  'All-Star Movies Resort',         'Value',        true,  '{"MK":[30,"Bus"],"EP":[20,"Bus"],"HS":[15,"Bus"],"AK":[15,"Bus"]}', 3),
  ('cbr',  'Caribbean Beach Resort',         'Moderate',     true,  '{"MK":[30,"Bus"],"EP":[15,"Skyliner"],"HS":[15,"Skyliner"],"AK":[25,"Bus"]}', 4),
  ('pofq', 'Port Orleans – French Quarter',  'Moderate',     true,  '{"MK":[30,"Bus"],"EP":[25,"Bus"],"HS":[25,"Bus"],"AK":[30,"Bus"]}', 5),
  ('cs',   'Coronado Springs Resort',        'Moderate',     true,  '{"MK":[30,"Bus"],"EP":[20,"Bus"],"HS":[15,"Bus"],"AK":[15,"Bus"]}', 6),
  ('rr',   'Riviera Resort',                 'Deluxe Villa', true,  '{"MK":[30,"Bus"],"EP":[10,"Skyliner"],"HS":[15,"Skyliner"],"AK":[25,"Bus"]}', 7),
  ('bc',   'Beach Club Resort',              'Deluxe',       true,  '{"MK":[30,"Bus"],"EP":[10,"Walk"],"HS":[20,"Boat"],"AK":[25,"Bus"]}', 8),
  ('ywc',  'Yacht Club Resort',              'Deluxe',       true,  '{"MK":[30,"Bus"],"EP":[10,"Walk"],"HS":[20,"Boat"],"AK":[25,"Bus"]}', 9),
  ('poly', 'Polynesian Village Resort',      'Deluxe',       true,  '{"MK":[10,"Monorail"],"EP":[25,"Monorail"],"HS":[25,"Bus"],"AK":[25,"Bus"]}', 10),
  ('gf',   'Grand Floridian Resort',         'Deluxe',       true,  '{"MK":[10,"Monorail"],"EP":[25,"Monorail"],"HS":[25,"Bus"],"AK":[25,"Bus"]}', 11),
  ('ct',   'Contemporary Resort',            'Deluxe',       true,  '{"MK":[10,"Walk"],"EP":[25,"Monorail"],"HS":[25,"Bus"],"AK":[25,"Bus"]}', 12),
  ('akl',  'Animal Kingdom Lodge',           'Deluxe',       true,  '{"MK":[30,"Bus"],"EP":[25,"Bus"],"HS":[20,"Bus"],"AK":[10,"Bus"]}', 13),
  ('off',  'Somewhere off-site (villa, hotel, Airbnb…)', 'Off-site', false, '{}', 99)
) as h(key, name, tier, on_site, times, ord)
where p.destination = 'Walt Disney World' and p.version = '2027.1';
