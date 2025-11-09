# 🎯 Darts Scorekeeper (301/501) — Browser SPA

A single-page web application to keep score in **Darts** legs and sets (301/501). No backend; all state stays in-memory.

## Features (maps to evaluation)
- ✅ Add 2 players, select **301/501**, set size (best-of N), first throw, optional **bust rule**.
- ✅ Per-leg turn entry (turn total 0–180 + note), per-turn **list view** with **edit/delete**.
- ✅ Real-time aggregations: remaining, legs won, per-player average, highest turn.
- ✅ Set-level tracking, next-leg, and **auto declare set winner** (majority of legs).
- ✅ **Undo/Redo** and **CSV export**, **Print**.
- ✅ **Responsive** layout and **accessible** (semantic markup, labels, ARIA live, skip link, focus styles).
- ✅ **TypeScript** source split into modules (`types`, `state`, `ui`, `main`). Compiled ES modules run in the browser.
- ✅ Style sheets and original look (dark gradient, badges, cards).
- ✅ No persistence (state resets on refresh).

## Quick start
Using Node 18+:
```bash
npm i
npm run build   # compile TS -> public/js
npm run dev     # serve ./public and open in browser
```
Or simply open `public/index.html` directly (already includes a working prebuilt JS).

## Project structure
```
public/
  index.html      # SPA
  styles.css      # CSS
  js/
    state.js ui.js main.js   # compiled from src/*
src/
  types.ts state.ts ui.ts main.ts  # TypeScript source
docs/
  SUBJECT_PROPOSAL.md
  TEAMWORK_EVALUATION_TEMPLATE.md
tsconfig.json
package.json
README.md
```

## Notes
- **Bust rule**: When enabled, a below-zero result automatically becomes 0 for that turn.
- Double/bull rules are **left to the user**; use turn notes to document them.
- First throw alternates each leg.
- Keyboard: **U** undo, **R** redo, **N** next leg.

## Dev tips
- Use Git with small, frequent commits and clear messages referencing issues/tasks.
- Consider adding ESLint + Prettier if allowed.
