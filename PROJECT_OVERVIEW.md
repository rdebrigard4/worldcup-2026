# World Cup 2026 app — project overview

A plain-language guide to what this app is, how it's built, and what's been done.
Written to be shareable — hand it to someone (or another assistant) to get up to speed fast.

## What it is

A React + TypeScript + Vite web app (a PWA-style site) that tracks the 2026 World
Cup. It's hosted free on GitHub Pages and auto-deploys whenever code is pushed.

- **Live:** https://rdebrigard4.github.io/worldcup-2026/
- **Repo:** rdebrigard4/worldcup-2026
- Dark theme, built mobile-first (works like an app on a phone).

## The 7 tabs (what the user sees)

A scrollable row of tab buttons at the top switches between these:

1. **Schedule** — Every match. Filter by phase (group stage, R32, R16, etc.), sort
   by date, show only your teams, search by team/city/venue, and ★ save any match.
2. **Groups** — A card for each group (A–L) showing the 4 teams, winner/runner-up
   slots, and which knockout match the group feeds into.
3. **Bracket** — The knockout tree from Round of 32 → Final, split into viewable
   pathways. Tap a match to save it.
4. **Locations** — A dark interactive map of all 16 host stadiums. Picking a team
   colors its venues and draws its travel route.
5. **Team Info** — Pick a team to see its group, opponents, schedule, and a "Quick
   Facts" panel + summary pulled live from **Wikipedia** (cached for 7 days).
6. **My Teams** — The teams you follow, each with its next match, plus a grid to
   follow/unfollow any team.
7. **Favorites** — Your ★ saved matches, grouped by round, each with a notes box.

## How the code is organized (the folders)

The project deliberately separates **data**, **logic**, and **UI**, so pieces are
reusable instead of copy-pasted.

- **`src/data/`** — the raw facts:
  - `schedule.ts` — all match fixtures (groups + knockout)
  - `flags.ts` — 48 nations → flag emoji
  - `venues.ts` — stadium coordinates + each team's flag colors
  - `groupPaths.ts` — which group winner/runner-up goes to which knockout match

- **`src/lib/`** — the shared logic ("helpers"):
  - `storage.ts` — remembers your saved matches, followed teams, and notes; **syncs
    instantly across all tabs** and saves to the browser so it persists. (Built so it
    can swap to a cloud database later.)
  - `matches.ts` — finds a match by ID, lists all matches, and shared sort/format helpers
  - `format.ts` — converts kickoff times to the viewer's local time zone
  - `teamRoutes.ts` — a team's matches and possible knockout path
  - `wiki.ts` — fetches + cleans up Wikipedia data for the Team Info tab

- **`src/components/`** — reusable UI building blocks:
  - `MatchTeams.tsx` — renders "Team A vs Team B" with flags
  - `MatchSummary.tsx` — the shared match-row layout (date + teams + venue/time)

- **`src/tabs/`** — one file per tab (the 7 above), each with its own styling file

- **`src/App.tsx`** — the shell: the header, the tab buttons, and which tab is showing

## The clever shared pieces (why it's well-built)

- **Star a match or follow a team in one tab → it updates everywhere instantly.**
  That's the shared `storage.ts` doing the work; everything reads from one source of truth.
- **Your choices are saved in the browser**, so they survive closing the tab.
- **Wikipedia data is cached** so revisiting a team is instant and works offline.

## Tech stack in plain terms

- **React** — the UI framework (builds the interface from reusable components)
- **TypeScript** — JavaScript with type-checking to catch mistakes early
- **Vite** — the build tool that bundles it for the web
- **Leaflet** — the interactive map library (Locations tab)
- **GitHub Pages + Actions** — free hosting that auto-rebuilds and deploys on every push

## Recent cleanup pass (under-the-hood improvements)

A round of maintenance that changed *nothing* about how the app looks or works —
just made it faster and cleaner:

1. **Faster load** — each tab now loads its code only when opened ("lazy loading"),
   so the heavy map library no longer downloads up front. Initial download dropped ~45%.
2. **Tidier app shell** — replaced a tangled if/else with a simple tab lookup; removed
   leftover placeholder text.
3. **Fixed a code-quality warning** — restructured the Team Info loading state so it's
   derived automatically (the pattern the linter prefers).
4. **Fixed hidden performance waste** — a shared "favorite teams" helper was being
   recreated on every screen update, causing two tabs to redo work needlessly; now stable.
5. **Removed duplicated code** — the match-row layout and sort/format logic were
   copy-pasted across tabs; pulled into one shared `MatchSummary` component + helpers.

## Planned but not built yet

- **Live match scores** — the big next feature: pull real scores from a football data
  service into a cloud database (Firebase/Firestore), then show them in the app. The
  plumbing is stubbed out but not wired up.
- Minor: a few cosmetic/accessibility polish items.
