# Teamwork Subject Proposal — Darts Scorekeeper (SPA)

## Idea (short)
Build a **single-page, browser-only** Darts scorekeeper for **301 up** and **501 up**, supporting sets composed of multiple legs between two players. The app lets users enter each turn, tracks per-leg and per-set results, and shows live aggregations (averages, highs, remaining).

## Minimum requirements (mapped)
- **Add players (2), game type, set size**, and first throw before starting a set.
- For each leg: enter **each turn** (turn total + optional note), maintain per-player **remaining** and **leg winner** when reaching exactly 0 (no double/bull enforcement).
- At set level: keep **leg wins per player**, allow **next leg**, and **declare set winner** once someone has the majority of legs.
- Extra: **reset set**, **undo/redo**, **edit/delete turns**, **CSV export**, **print**.

## UI & Tech
- **TypeScript + ES modules**, no backend, no frameworks; **HTML/CSS/JS** only.
- **Responsive**, **accessible** (labels, ARIA live, skip link), keyboard shortcuts.
- Code split into modules: `types`, `state` (pure logic), `ui` (DOM), `main` (wiring).

## Why acceptable
Meets all listed criteria, including object list management, real-time aggregations, modular code, styling, responsiveness, accessibility, TypeScript usage, Git, and additional features (undo/redo, CSV export).
