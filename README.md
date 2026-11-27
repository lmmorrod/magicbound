# Magicbound (working name)

A shared planner for theme-park holidays, starting with Walt Disney World.

## The problem

Planning a Disney trip means juggling things that live in different places and run on different clocks:
restaurant bookings that open 60 days out, Lightning Lane slots that open 7 days before check-in, dining
plan credits that are easy to over- or under-use, park hours, hotel perks, a budget and a packing list. Most
people end up with a spreadsheet, a notes app and a group chat, and still miss a booking window. When two
people plan together, it gets worse: nobody's sure which copy is current.

## What it does

- **One plan, shared live.** Couples and families edit the same trip, and changes show up for everyone straight away.
- **Built up as you go.** Start with dates and who's going, then add flights, hotels (including split stays),
  a dining plan and park days. Each step fills in the plan for you.
- **Day by day and calendar views,** with drag and drop to move things around.
- **Booking windows worked out for you.** Every restaurant and Lightning Lane booking shows the date it
  opens, with a countdown to the next one.
- **Dining credits tracked:** what's planned, what's earmarked and what's used, so you don't run out or waste any.
- **Lightning Lane picks, food wishlist, budget and packing list** in the same place.
- **Plain-English guide.** Tap ⓘ next to any term (Multi Pass, snack credit, early entry) to see what it means.
- **Resort map** with typical journey times from your hotel to each park.

Rules, prices and tiers change, so all guidance shows when it was last checked and points to the official site.

Not affiliated with or endorsed by The Walt Disney Company. All park and attraction names are trademarks of
their owners.

## Tech

Next.js (App Router) and TypeScript, Supabase (Postgres, row-level security, Realtime, magic-link sign-in),
Vitest. Stripe payments are planned.

## Running it locally

Needs Node 22 and a Supabase project.

```sh
cp .env.example .env.local   # add your Supabase URL and publishable key
npm install
npm run dev                  # http://localhost:3000
npm test
```

Database migrations live in `supabase/migrations/`. `supabase/tests/rls_test.sql` checks the security rules and
rolls back everything it creates.
