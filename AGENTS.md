# AGENTS.md

## Project Overview

LookOut! is a soccer scan-training web app. It flashes visual cues (colors, numbers, math problems) on a configurable interval with an audio beep, training players to lift their heads and build situational awareness under pressure.

**Live site:** https://selflo.github.io/lookout/

## Tech Stack

- **Pure static site** — HTML, CSS, vanilla JavaScript. No frameworks, no bundler, no build step.
- Deployed to GitHub Pages via `.github/workflows/deploy.yml` on every push to `main`.

## File Structure

| File | Purpose |
|---|---|
| `index.html` | Single-page app markup and settings panel |
| `app.js` | All application logic (IIFE): modes, timer, rendering, audio (Web Audio API), wake lock |
| `styles.css` | Full styling including color-mode backgrounds and settings panel |
| `favicon.svg` | App icon |
| `.github/workflows/deploy.yml` | GitHub Pages deploy workflow |
| `README.md` | User-facing documentation |

## Local Development

No install or build required. Serve the repo root with any static server:

```bash
python -m http.server 8000
# visit http://localhost:8000
```

Or simply open `index.html` in a browser.

## Architecture Notes

- `app.js` is a single IIFE — all state, event wiring, rendering, audio, and wake-lock logic live inside it.
- Four modes: `colors`, `numbers`, `math`, `mixed` (randomly picks one of the other three each tick).
- Settings are persisted to `localStorage` under the key `lookout.settings.v1`.
- Audio uses the Web Audio API (`AudioContext`); `primeAudio()` must run inside a user gesture for iOS compatibility.
- Screen Wake Lock API keeps the display on during sessions; gracefully degrades when unsupported.

## Coding Conventions

- **No build tools** — keep the app as a zero-dependency static site. Do not introduce bundlers, transpilers, or package managers.
- **Single JS file** — all logic stays in `app.js` unless a feature clearly warrants a new module.
- **Vanilla JS only** — no frameworks or libraries.
- **CSS custom properties** — use the variables defined in `:root` (e.g., `--bg`, `--accent`, `--border`) for theming.
- **Mobile-first** — all UI must work on phone screens. Test touch interactions and safe-area insets.
- **Accessible** — use `aria-*` attributes where appropriate; the stage uses `aria-live="polite"`.
- **Minimal comments** — only comment non-obvious logic; the code should be self-explanatory.

## Deployment

Every push to `main` auto-deploys to GitHub Pages. No manual steps needed. To deploy a fork, enable GitHub Pages with Source = GitHub Actions in repo settings.
