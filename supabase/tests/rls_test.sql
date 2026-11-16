-- Row-level security tests. Paste into the Supabase SQL editor and run.
-- Everything happens in one transaction that is rolled back, so nothing is left behind.
-- Success: the final select returns 'all RLS checks passed'. Any failure raises an error naming the check.
begin;

-- Three people: an owner, a viewer on the owner's trip, and an outsider.
insert into auth.users (id, email, instance_id, aud, role) values
  ('00000000-0000-0000-0000-0000000000a1', 'owner@test.invalid',    '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a2', 'viewer@test.invalid',   '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated'),
  ('00000000-0000-0000-0000-0000000000a3', 'outsider@test.invalid', '00000000-0000-0000-0000-000000000000', 'authenticated', 'authenticated');

create temp table t_ctx (k text primary key, v uuid) on commit drop;
grant all on t_ctx to authenticated;

-- Act as someone: same claims PostgREST would set from their JWT.
create function pg_temp.act_as(uid uuid) returns void language plpgsql as $$
begin
  perform set_config('role', 'authenticated', true);
  perform set_config('request.jwt.claims', json_build_object('sub', uid, 'role', 'authenticated')::text, true);
end $$;
create function pg_temp.reset_role() returns void language plpgsql as $$
begin
  perform set_config('role', 'postgres', true);
  perform set_config('request.jwt.claims', '', true);
end $$;

-- Owner creates a trip and adds an item.
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a1');
insert into t_ctx select 'trip', public.create_trip('RLS test', '2027-06-10', '2027-06-12');
insert into t_ctx select 'day', id from public.days where trip_id = (select v from t_ctx where k = 'trip') order by "order" limit 1;
insert into public.items (trip_id, day_id, text, credit)
  select (select v from t_ctx where k = 'trip'), (select v from t_ctx where k = 'day'), 'Owner item', 'TS';

do $$ begin
  if (select count(*) from public.days where trip_id = (select v from t_ctx where k = 'trip')) <> 3 then
    raise exception 'FAIL: create_trip should make one day per date';
  end if;
  if (select count(*) from public.items where trip_id = (select v from t_ctx where k = 'trip')) <> 1 then
    raise exception 'FAIL: owner should be able to write items';
  end if;
end $$;

-- Owner can't mark the trip as paid.
do $$ begin
  begin
    update public.trips set paid = true where id = (select v from t_ctx where k = 'trip');
    raise exception 'FAIL: owner set paid';
  exception when raise_exception then
    if sqlerrm like 'FAIL%' then raise; end if;
  end;
end $$;

-- Owner adds the viewer.
insert into public.trip_members (trip_id, user_id, role)
  select v, '00000000-0000-0000-0000-0000000000a2', 'viewer' from t_ctx where k = 'trip';

-- ---- viewer ----
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a2');
do $$
declare trip uuid := (select v from t_ctx where k = 'trip'); n int;
begin
  if (select count(*) from public.items where trip_id = trip) <> 1 then raise exception 'FAIL: viewer should read items'; end if;
  if (select count(*) from public.trips where id = trip) <> 1 then raise exception 'FAIL: viewer should read the trip'; end if;

  update public.items set text = 'hacked' where trip_id = trip;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: viewer updated items'; end if;

  delete from public.items where trip_id = trip;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: viewer deleted items'; end if;

  update public.trips set title = 'hacked' where id = trip;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: viewer updated the trip'; end if;

  begin
    insert into public.items (trip_id, text) values (trip, 'viewer item');
    raise exception 'FAIL: viewer inserted an item';
  exception when insufficient_privilege then null;
  end;

  begin
    insert into public.trip_members (trip_id, user_id, role) values (trip, '00000000-0000-0000-0000-0000000000a2', 'owner')
      on conflict (trip_id, user_id) do update set role = 'owner';
    raise exception 'FAIL: viewer promoted themselves';
  exception when insufficient_privilege then null;
  end;
end $$;

-- ---- outsider ----
select pg_temp.act_as('00000000-0000-0000-0000-0000000000a3');
do $$
declare trip uuid := (select v from t_ctx where k = 'trip'); n int;
begin
  if (select count(*) from public.trips where id = trip) <> 0 then raise exception 'FAIL: outsider can see the trip'; end if;
  if (select count(*) from public.items where trip_id = trip) <> 0 then raise exception 'FAIL: outsider can read items'; end if;
  if (select count(*) from public.days where trip_id = trip) <> 0 then raise exception 'FAIL: outsider can read days'; end if;
  if (select count(*) from public.trip_members where trip_id = trip) <> 0 then raise exception 'FAIL: outsider can read members'; end if;

  update public.items set text = 'hacked' where trip_id = trip;
  get diagnostics n = row_count;
  if n <> 0 then raise exception 'FAIL: outsider updated items'; end if;

  begin
    insert into public.trip_members (trip_id, user_id, role) values (trip, '00000000-0000-0000-0000-0000000000a3', 'editor');
    raise exception 'FAIL: outsider joined the trip';
  exception when insufficient_privilege then null;
  end;

  -- The outsider's own trip can't point an item at the owner's day.
  insert into t_ctx select 'trip2', public.create_trip('Outsider trip', '2027-07-01', '2027-07-02');
  begin
    insert into public.items (trip_id, day_id, text) select (select v from t_ctx where k = 'trip2'), (select v from t_ctx where k = 'day'), 'x';
    raise exception 'FAIL: item linked to another trip''s day';
  exception when raise_exception then
    if sqlerrm like 'FAIL%' then raise; end if;
  end;

  -- Reference data is readable but not writable.
  if (select count(*) from public.ref_packs) = 0 then raise exception 'FAIL: reference packs not readable (or not seeded)'; end if;
  begin
    insert into public.ref_rules (pack_id, key, value) select id, 'hack', '1' from public.ref_packs limit 1;
    raise exception 'FAIL: user wrote reference rules';
  exception when insufficient_privilege then null;
  end;
end $$;

select pg_temp.reset_role();
select 'all RLS checks passed' as result;
rollback;
