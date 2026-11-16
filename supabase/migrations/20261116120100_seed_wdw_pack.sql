-- Walt Disney World 2027 reference pack (v1). Factual names only; menu links go to the official site.
-- Rules are guidance and carry a last-checked date shown in the app.
with p as (
  insert into public.ref_packs (destination, version, valid_from, last_checked, notes)
  values ('Walt Disney World', '2027.1', '2027-01-01', '2026-11-01', 'Lightning Lane tiers as listed for 2026; recheck before booking.')
  returning id
),
rules as (
  insert into public.ref_rules (pack_id, key, value)
  select p.id, k, v from p, (values
    ('dining_window_days', '60'),
    ('dining_onsite_span_days', '10'),
    ('ll_window_onsite', '7'),
    ('ll_window_offsite', '3'),
    ('dining_open_time', '6am Orlando time'),
    ('ll_open_time', '7am Orlando time')
  ) as r(k, v)
),
rides as (
  insert into public.ref_rides (pack_id, park, tier, name, flag, "order")
  select p.id, park, tier, name, flag, ord from p, (values
    ('MK', 'Tier 1', 'Seven Dwarfs Mine Train', '', 1),
    ('MK', 'Tier 1', 'Tiana''s Bayou Adventure', '', 2),
    ('MK', 'Tier 1', 'Space Mountain', '', 3),
    ('MK', 'Tier 1', 'Peter Pan''s Flight', '', 4),
    ('MK', 'Tier 2', 'Big Thunder Mountain Railroad', '', 5),
    ('MK', 'Tier 2', 'Haunted Mansion', '', 6),
    ('MK', 'Tier 2', 'Jungle Cruise', '', 7),
    ('MK', 'Tier 2', 'Pirates of the Caribbean', '', 8),
    ('MK', 'Tier 2', 'Buzz Lightyear''s Space Ranger Spin', '', 9),
    ('MK', 'Tier 2', 'The Many Adventures of Winnie the Pooh', '', 10),
    ('MK', 'Tier 2', '"it''s a small world"', '', 11),
    ('MK', 'Single Pass', 'TRON Lightcycle / Run', '', 12),
    ('EP', 'Tier 1', 'Frozen Ever After', '', 13),
    ('EP', 'Tier 1', 'Remy''s Ratatouille Adventure', '', 14),
    ('EP', 'Tier 1', 'Test Track', '', 15),
    ('EP', 'Tier 1', 'Soarin'' Around the World', '', 16),
    ('EP', 'Tier 2', 'Mission: SPACE', '', 17),
    ('EP', 'Tier 2', 'Spaceship Earth', '', 18),
    ('EP', 'Tier 2', 'Living with the Land', '', 19),
    ('EP', 'Tier 2', 'The Seas with Nemo & Friends', '', 20),
    ('EP', 'Tier 2', 'Journey Into Imagination with Figment', '', 21),
    ('EP', 'Single Pass', 'Guardians of the Galaxy: Cosmic Rewind', '', 22),
    ('HS', 'Tier 1', 'Slinky Dog Dash', '', 23),
    ('HS', 'Tier 1', 'Mickey & Minnie''s Runaway Railway', '', 24),
    ('HS', 'Tier 1', 'The Twilight Zone Tower of Terror', '', 25),
    ('HS', 'Tier 1', 'Rock ''n'' Roller Coaster', 'Check it''s reopened', 26),
    ('HS', 'Tier 2', 'Toy Story Mania!', '', 27),
    ('HS', 'Tier 2', 'Millennium Falcon: Smugglers Run', '', 28),
    ('HS', 'Tier 2', 'Star Tours', '', 29),
    ('HS', 'Tier 2', 'Alien Swirling Saucers', '', 30),
    ('HS', 'Single Pass', 'Star Wars: Rise of the Resistance', '', 31),
    ('AK', '', 'Na''vi River Journey', '', 32),
    ('AK', '', 'Kilimanjaro Safaris', '', 33),
    ('AK', '', 'Expedition Everest', '', 34),
    ('AK', '', 'Kali River Rapids', '', 35),
    ('AK', 'Single Pass', 'Avatar Flight of Passage', '', 36)
  ) as r(park, tier, name, flag, ord)
)
insert into public.ref_food (pack_id, name, type, area, spot, url, "order")
select p.id, name, type, area, spot, 'https://disneyworld.disney.go.com/dining/', ord from p, (values
  ('Pecos Bill Tall Tale Inn and Cafe', 'QS', 'Magic Kingdom', 'Frontierland', 1),
  ('Columbia Harbour House', 'QS', 'Magic Kingdom', 'Liberty Square', 2),
  ('Dole Whip', 'Snack', 'Magic Kingdom', 'Adventureland', 3),
  ('Regal Eagle Smokehouse', 'QS', 'EPCOT', 'American Adventure', 4),
  ('Kringla Bakeri og Kafe', 'Snack', 'EPCOT', 'Norway', 5),
  ('Satu''li Canteen', 'QS', 'Animal Kingdom', 'Pandora', 6),
  ('Flame Tree Barbecue', 'QS', 'Animal Kingdom', 'Discovery Island', 7),
  ('Woody''s Lunch Box', 'QS', 'Hollywood Studios', 'Toy Story Land', 8),
  ('Sci-Fi Dine-In Theater', 'TS', 'Hollywood Studios', 'Commissary Lane', 9)
) as f(name, type, area, spot, ord);
