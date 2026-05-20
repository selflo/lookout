# LookOut!

**LookOut! is a fast-paced, high-intensity training app that challenges players to break their hyper-focus on the ball, lift their heads, and smash through cognitive roadblocks by scanning the field under pressure. It's not just a drill; it's a race against the clock to activate peak situational awareness.**

▶ **Play it now:** https://selflo.github.io/lookout/

---

## How it works

Prop your phone (or any browser) somewhere behind or beside your training area. LookOut! flashes a new cue on a configurable interval and beeps at every change. Each beep is a cue to:

1. **Scan** — turn your head, take a snapshot of what's around you.
2. **Read** — glance at the screen.
3. **Call it out** — say the color, number, or math answer aloud.
4. **Reset** — eyes back to the ball / drill.

The clock never stops. Miss a cue, you miss the rep.

## Modes

| Mode | What it shows | What it trains |
|---|---|---|
| **Colors** | The whole screen flashes one of: white, black, green, yellow, red | Pre-receive scanning under chromatic stress |
| **Numbers** | A single digit, 1–10 | Quick visual identification |
| **Math** | A simple equation (e.g. `7 + 2`, `8 − 3`), results stay 0–10 | Cognitive load while scanning — forces a working-memory task on top of the visual one |
| **Mixed** | Randomly picks one of the three each cue | Highest pressure: you don't know what's coming |

## Settings

- **Interval** — 1.0s to 10.0s between cues (default 4.0s)
- **Beep on change** — audible cue so you can train without watching the screen continuously
- **Keep screen on** — uses the Screen Wake Lock API so the phone won't sleep mid-session

Shortcuts: `Space` toggles start/stop, `F` toggles fullscreen.

## Drill ideas

- **Rondo + LookOut!**: place the phone outside the rondo. On every beep, the player on the ball calls out the cue before their next touch.
- **Receive-and-turn**: feed passes; the receiving player must call the cue before their first touch.
- **Wall passes**: solo drill — every time the ball returns from the wall, scan and call.
- **Conditioned scrimmage**: any player in possession must call the most recent cue at every touch. Miss a call = turnover.

Start at 5s intervals. As scanning becomes automatic, drop to 3s, then 2s. Mixed mode at 2s is brutal — that's the goal.

## Mobile notes

- Works on Android Chrome and iOS Safari 16.4+.
- On iPhone, tap **Share → Add to Home Screen** for a fullscreen, chrome-free launcher.
- On iOS versions without the Wake Lock API, set **Settings → Display & Brightness → Auto-Lock → Never** before your session.

## Local development

It's static HTML/CSS/JS — no build step. Just open `index.html` in a browser, or serve the folder:

```bash
python -m http.server 8000
# then visit http://localhost:8000
```

## Deployment

Every push to `main` triggers `.github/workflows/deploy.yml`, which publishes the repo root to GitHub Pages. The site lives at https://selflo.github.io/lookout/.

To deploy your own fork: push to `main`, then in repo **Settings → Pages**, set **Source = GitHub Actions**.
