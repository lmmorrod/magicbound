-- Magicbound schema: trips, membership, plan tables, reference packs.
-- Every plan table carries trip_id. Members can read; owners and editors can write.

create extension if not exists pgcrypto;

-- ---------- people ----------
create table public.profiles (
  id uuid primary key references auth.users on delete cascade,
  email text not null,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, email, display_name)
  values (new.id, new.email, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)));
  return new;
end $$;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- ---------- reference packs (maintained by us, read-only to users) ----------
create table public.ref_packs (
  id uuid primary key default gen_random_uuid(),
  destination text not null,
  version text not null,
  valid_from date not null,
  last_checked date not null,
  notes text not null default '',
  unique (destination, version)
);
create table public.ref_rides (
  pack_id uuid not null references public.ref_packs on delete cascade,
  park text not null, tier text not null default '', name text not null, flag text not null default '',
  "order" int not null default 0
);
create table public.ref_food (
  pack_id uuid not null references public.ref_packs on delete cascade,
  name text not null, type text not null default '', area text not null default '', spot text not null default '',
  url text not null default '', "order" int not null default 0
);
create table public.ref_rules (
  pack_id uuid not null references public.ref_packs on delete cascade,
  key text not null, value text not null,
  primary key (pack_id, key)
);

-- ---------- trips ----------
create table public.trips (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users on delete cascade,
  pack_id uuid references public.ref_packs on delete set null,
  title text not null,
  destination text not null default 'Walt Disney World',
  origin text not null default '',
  start_date date not null,
  end_date date not null,
  checkin_date date not null,
  on_site_hotel boolean not null default true,
  arrival_time timestamp,
  currency text not null default 'GBP',
  credits_ts int not null default 0 check (credits_ts between 0 and 99),
  credits_qs int not null default 0 check (credits_qs between 0 and 99),
  credits_sn int not null default 0 check (credits_sn between 0 and 99),
  paid boolean not null default false,
  created_at timestamptz not null default now(),
  check (end_date >= start_date),
  check (end_date - start_date <= 60)
);

create table public.trip_members (
  trip_id uuid not null references public.trips on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role text not null check (role in ('owner', 'editor', 'viewer')),
  primary key (trip_id, user_id)
);
create index on public.trip_members (user_id);

create table public.trip_invites (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips on delete cascade,
  email text not null,
  role text not null check (role in ('editor', 'viewer')),
  token text not null unique default encode(gen_random_bytes(24), 'hex'),
  created_at timestamptz not null default now(),
  accepted_at timestamptz
);

-- Membership checks. SECURITY DEFINER so policies on trip_members don't recurse.
create function public.is_member(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from trip_members where trip_id = t and user_id = auth.uid())
$$;
create function public.can_write(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from trip_members where trip_id = t and user_id = auth.uid() and role in ('owner', 'editor'))
$$;
create function public.is_owner(t uuid) returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from trip_members where trip_id = t and user_id = auth.uid() and role = 'owner')
$$;

-- The creator becomes the owner member.
create function public.add_owner_member() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into trip_members (trip_id, user_id, role) values (new.id, new.owner_id, 'owner');
  return new;
end $$;
create trigger trips_add_owner after insert on public.trips
  for each row execute function public.add_owner_member();

-- Only the payment webhook (service role) can set paid or move ownership.
create function public.guard_trip_columns() returns trigger
language plpgsql as $$
begin
  if coalesce(auth.role(), '') <> 'service_role' then
    if tg_op = 'INSERT' then
      new.paid := false;
      new.owner_id := auth.uid();
    else
      if new.paid is distinct from old.paid then raise exception 'paid can only be set by the payment webhook'; end if;
      if new.owner_id is distinct from old.owner_id then raise exception 'owner can''t be changed here'; end if;
    end if;
  end if;
  return new;
end $$;
create trigger trips_guard before insert or update on public.trips
  for each row execute function public.guard_trip_columns();

-- ---------- plan tables ----------
create table public.days (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips on delete cascade,
  "order" int not null default 0,
  date date not null,
  park text not null default 'TR',
  label text not null default '',
  event text not null default ''
);
create table public.items (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips on delete cascade,
  day_id uuid references public.days on delete set null, -- null = loose
  time text,
  text text not null default '',
  credit text check (credit in ('TS', 'QS', 'SN')),
  n int not null default 1 check (n between 1 and 2),
  used boolean not null default false,
  res text check (res in ('todo', 'booked')),
  conf text
);
create table public.ll_picks (
  trip_id uuid not null references public.trips on delete cascade,
  park text not null,
  ride_name text not null,
  primary key (trip_id, park, ride_name)
);
create table public.rides (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips on delete cascade,
  park text not null, tier text not null default '', name text not null, flag text not null default '',
  "order" int not null default 0
);
create table public.food (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips on delete cascade,
  name text not null, type text not null default '', area text not null default '', spot text not null default '',
  note text not null default '', url text not null default '', hi boolean not null default false,
  "order" int not null default 0
);
create table public.qs_wish (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips on delete cascade,
  name text not null, area text not null default '', key text not null default '',
  "order" int not null default 0
);
create table public.budget (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips on delete cascade,
  name text not null, cost numeric, paid numeric not null default 0, note text not null default '',
  "order" int not null default 0
);
create table public.park_hours (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips on delete cascade,
  park text not null, opens text not null default '', closes text not null default '',
  "order" int not null default 0
);
create table public.pack (
  id uuid primary key default gen_random_uuid(),
  trip_id uuid not null references public.trips on delete cascade,
  text text not null, list text not null default '', "group" text not null default '', done boolean not null default false,
  "order" int not null default 0
);

-- ---------- row level security ----------
alter table public.profiles enable row level security;
alter table public.trips enable row level security;
alter table public.trip_members enable row level security;
alter table public.trip_invites enable row level security;
alter table public.ref_packs enable row level security;
alter table public.ref_rides enable row level security;
alter table public.ref_food enable row level security;
alter table public.ref_rules enable row level security;

create policy "own profile" on public.profiles for select using (id = auth.uid());
create policy "co-member profiles" on public.profiles for select using (
  exists (select 1 from trip_members a join trip_members b on a.trip_id = b.trip_id
          where a.user_id = auth.uid() and b.user_id = profiles.id));
create policy "update own profile" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "members read trips" on public.trips for select using (public.is_member(id) or owner_id = auth.uid());
create policy "signed-in users create trips" on public.trips for insert to authenticated with check (owner_id = auth.uid());
create policy "editors update trips" on public.trips for update using (public.can_write(id)) with check (public.can_write(id));
create policy "owners delete trips" on public.trips for delete using (public.is_owner(id));

create policy "members read members" on public.trip_members for select using (public.is_member(trip_id));
create policy "owners manage members" on public.trip_members for all using (public.is_owner(trip_id)) with check (public.is_owner(trip_id));

create policy "owners manage invites" on public.trip_invites for all using (public.is_owner(trip_id)) with check (public.is_owner(trip_id));

create policy "anyone reads packs" on public.ref_packs for select using (true);
create policy "anyone reads ref rides" on public.ref_rides for select using (true);
create policy "anyone reads ref food" on public.ref_food for select using (true);
create policy "anyone reads ref rules" on public.ref_rules for select using (true);

do $$
declare t text;
begin
  foreach t in array array['days', 'items', 'll_picks', 'rides', 'food', 'qs_wish', 'budget', 'park_hours', 'pack'] loop
    execute format('alter table public.%I enable row level security', t);
    execute format('create index on public.%I (trip_id)', t);
    execute format('create policy "members read" on public.%I for select using (public.is_member(trip_id))', t);
    execute format('create policy "editors insert" on public.%I for insert with check (public.can_write(trip_id))', t);
    execute format('create policy "editors update" on public.%I for update using (public.can_write(trip_id)) with check (public.can_write(trip_id))', t);
    execute format('create policy "editors delete" on public.%I for delete using (public.can_write(trip_id))', t);
    -- Full old rows on update/delete so realtime can tell clients which row went.
    execute format('alter table public.%I replica identity full', t);
    execute format('alter publication supabase_realtime add table public.%I', t);
  end loop;
end $$;
alter table public.trips replica identity full;
alter publication supabase_realtime add table public.trips;

-- An item's day must belong to the same trip.
create function public.check_item_day() returns trigger
language plpgsql as $$
begin
  if new.day_id is not null and not exists (select 1 from days where id = new.day_id and trip_id = new.trip_id) then
    raise exception 'day belongs to a different trip';
  end if;
  return new;
end $$;
create trigger items_day_check before insert or update on public.items
  for each row execute function public.check_item_day();

-- ---------- creating a trip ----------
-- Makes the trip, one blank day per date, and copies the latest reference pack
-- for the destination so the user can edit their own copy.
create function public.create_trip(
  p_title text, p_start date, p_end date, p_checkin date default null,
  p_on_site boolean default true, p_arrival timestamp default null,
  p_credits_ts int default 0, p_credits_qs int default 0, p_credits_sn int default 0,
  p_destination text default 'Walt Disney World', p_origin text default ''
) returns uuid
language plpgsql security invoker set search_path = public as $$
declare
  v_trip uuid; v_pack uuid; d date; i int := 0;
begin
  if auth.uid() is null then raise exception 'sign in first'; end if;
  select id into v_pack from ref_packs where destination = p_destination order by valid_from desc limit 1;
  insert into trips (title, destination, origin, start_date, end_date, checkin_date, on_site_hotel, arrival_time,
                     credits_ts, credits_qs, credits_sn, pack_id)
  values (p_title, p_destination, p_origin, p_start, p_end, coalesce(p_checkin, p_start), p_on_site, p_arrival,
          p_credits_ts, p_credits_qs, p_credits_sn, v_pack)
  returning id into v_trip;
  for d in select generate_series(p_start, p_end, interval '1 day')::date loop
    i := i + 1;
    insert into days (trip_id, "order", date, park, label) values (v_trip, i, d, 'TR', '');
  end loop;
  if v_pack is not null then
    insert into rides (trip_id, park, tier, name, flag, "order")
      select v_trip, park, tier, name, flag, "order" from ref_rides where pack_id = v_pack;
    insert into food (trip_id, name, type, area, spot, url, "order")
      select v_trip, name, type, area, spot, url, "order" from ref_food where pack_id = v_pack;
  end if;
  return v_trip;
end $$;

-- ---------- account deletion (UK GDPR) ----------
-- Deletes the caller's account. Trips they own go with it (cascade); they're
-- removed from trips they were invited to.
create function public.delete_my_account() returns void
language plpgsql security definer set search_path = public, auth as $$
begin
  if auth.uid() is null then raise exception 'sign in first'; end if;
  delete from auth.users where id = auth.uid();
end $$;
revoke all on function public.delete_my_account() from public, anon;
grant execute on function public.delete_my_account() to authenticated;
