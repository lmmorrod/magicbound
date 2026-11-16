# Magicbound (working name)

An unofficial planner for theme-park trips: day-by-day plan, calendar with drag and drop, dining-credit tracking,
Lightning Lane picks, reservations with booking-window countdowns, food wishlist, budget and packing list.

Not affiliated with or endorsed by The Walt Disney Company. All park and attraction names are trademarks of their owners.

## Status

Milestone 1 (Port) done: the UI from the original dashboard running in Next.js on a local sample trip
(`data/sample.ts`). Edits work but only live in the browser tab; Supabase comes in milestone 2.

## Running it

Node 22 lives in `~/.local/node` on this machine, so put it on your PATH first:

```sh
export PATH="$HOME/.local/node/bin:$PATH"
npm install
npm run dev        # http://localhost:3000
npm test           # Vitest: planning logic
npm run typecheck
```

`scripts/dev.sh` does the same with the PATH set (port 3100 by default).

## Layout

- `lib/plan.ts`: pure logic ported from the original (sorting, credit maths, booking windows, quick-service
  matching, calendar drops). Booking-window numbers come from `Rules` (the reference pack), not constants.
- `lib/writeQueue.ts`: per-document write queue for optimistic updates.
- `lib/types.ts`: row types matching the planned Supabase tables (original field names kept).
- `components/store.tsx`: trip state, optimistic writes, edit mode, dialog and toasts. `Backend` is the seam
  for Supabase.
- `components/*Tab.tsx`: one component per tab. `PlannerDialog.tsx` is the shared editor.
- `app/globals.css`: the original's CSS and tokens (`--mk`, `--ep`, `--accent`…), unchanged apart from fonts
  and a few additions at the end.

`reference/` holds the original dashboard for comparison. It contains personal data, so it's git-ignored.
