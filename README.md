# ECHO LOOP
<img width="1607" height="866" alt="image" src="https://github.com/user-attachments/assets/35f3ce14-d9de-436e-8f06-7572f4ee7c1f" />

A 2D puzzle-platformer built around one mechanic: **record and replay**.

Every loop lasts 12 seconds. When it ends, your run is saved as an **echo**, a ghost that replays your exact movements while you play the next loop. Echoes can hold buttons down and absorb laser beams, so you solve each level by cooperating with your own past selves.

Analogy: it is like leaving sticky notes for yourself. Each loop you leave a note, and in the next loop that note walks around and does the job for you.

## How to run

Phaser 3 is bundled in `lib/`, so no install or internet is needed.

**Option A (easiest):** double-click `index.html`.

**Option B (local server):**
```
cd echo-loop
python -m http.server
```
Then open http://localhost:8000 in your browser.

## Controls

| Key | Action |
|---|---|
| Arrow keys or A / D | Move |
| Space, W or Up | Jump (hold for a higher jump) |
| R | End the current loop early and save it as an echo |
| Backspace | Restart the level (removes all echoes) |
| P | Pause / resume (the game also auto-pauses when the window loses focus) |
| M | Mute / unmute (the choice is remembered) |
| Esc | Back to menu |
| 1 to 7 (menu) | Pick a level |

On a **touch device** an on-screen pad appears after the first tap: left, right and **JUMP** on the bottom, plus **ECHO** (same as R), restart, pause and menu buttons. All controls support multi-touch, so you can hold a direction and jump at the same time.

## Rules

1. A loop lasts 12 seconds. Reach the green exit portal to win the level.
2. When time runs out, or you press **R**, your run becomes an echo and a new loop starts.
3. You can keep at most **3 echoes**. If a 4th loop ends without winning, the level resets.
4. An echo that finishes its recording keeps standing where it ended.
5. **Buttons** are pressed by you or by any echo standing on them. A **door** opens only while all of its buttons are pressed.
6. **Lasers** switch on after a delay and kill you. A beam stops at the first echo it touches, so an echo works as a shield.
7. **Spikes**, lasers and falling into a pit restart the current loop. Your echoes stay.
8. On levels with **solid echoes** (5 and 6) a resting echo turns into a solid platform you can stand on - unless you are standing inside it. Lasers still pass through solid echoes.

## Levels

| # | Name | New idea |
|---|---|---|
| 1 | First Echo | One button, one door. Your echo holds the button. |
| 2 | Two Locks | Two doors in a row. Build two echoes in order. |
| 3 | The Beam | A laser that wakes at 2s. Use R to place an echo at the wall as a shield. |
| 4 | Moving Ground | A moving platform over a pit and a door that needs two buttons. |
| 5 | Stepping Echo | A resting echo is solid: stand on its head to reach a high ledge. |
| 6 | Echo Tower | The ledge is too high for one echo - stack two to build a tower. |
| 7 | Final Loop | Laser shield, button, door and spikes together. |

Levels are plain data in `src/levels/levels.js`, so adding a level needs no new code.

## Project structure

```
echo-loop/
  index.html              loads Phaser and the scripts
  README.md
  lib/phaser.min.js       Phaser 3.80.1 (bundled)
  scripts/
    package-web.sh        builds dist/echo-loop-web.zip
  src/
    main.js               game config (and the window.__echoLoop test hook)
    scenes/
      MenuScene.js        title, instructions, level select with best results
      GameScene.js        main loop: rounds, echoes, buttons, doors, lasers, HUD
      WinScene.js         ending screen with a per-level results table
    systems/
      Physics.js          constants and box overlap helper
      Recorder.js         records and replays positions
      Sfx.js              sound effects made in code (Web Audio)
      Storage.js          localStorage wrapper (best times, mute, play time)
      Touch.js            on-screen controls for touch devices
    objects/
      Entities.js         Player physics and the moving-platform helper
    levels/
      levels.js           levels as data
  tests/
    harness.py            headless Playwright harness that solves every level
    bot.js                in-page helpers: hold / jump / echo / x / y / done ...
    solutions.js          the scripted plan for each level
    levels.test.js        node: validates the level data schema
```

## Technical notes

- **Fixed timestep:** the game logic runs at exactly 60 steps per second, so every loop plays out the same way.
- **Recording:** the Recorder saves the player's position (and facing) each frame. Echoes replay those positions, so they always match what you did, even if the world changes around them.
- **Custom physics:** the platformer movement (gravity, jump buffer, coyote time, variable jump height, moving-platform carrying) is written by hand in `Entities.js`. It does not use Phaser's physics engine.
- **Lasers:** each frame a beam is traced in small steps from its emitter to the right until it meets a solid, an echo or the player. Only static geometry stops a beam - solid echoes never block it.
- **Solid echoes:** with the `solidEchoes` level flag, an echo that has finished replaying becomes a platform. The game skips the platform while the player overlaps it, so an echo can never trap you.
- **Assets:** there are none. All graphics are drawn with code, and all sounds are generated with the Web Audio API.

## Tests

The level data has a schema check that runs under plain node:

```
node tests/levels.test.js
```

Every level is also solved end to end by a headless browser harness. Phaser's own
loop is put to sleep and the fixed 60 Hz step is driven by hand, so each run is
identical. First install the one dependency:

```
pip install playwright
python -m playwright install chromium
```

Then run the whole suite, or just some levels:

```
python tests/harness.py          # all levels
python tests/harness.py 3 7      # only levels 3 and 7
```

It prints a PASS/FAIL line per level and fails if the page logged any console
error. The scripted plans live in `tests/solutions.js` on top of the helpers in
`tests/bot.js`.

## Deploy

Pushing to `main` runs the GitHub Actions workflow in `.github/workflows/ci.yml`.
It validates the level data with `node tests/levels.test.js` and, if that passes,
publishes the playable build as a workflow artifact called `echo-loop-web`
(download it from the run's page, extract it and open `index.html`).

GitHub Pages is deliberately not used: it needs a public repository on the Free
plan. Push a `v*` tag to also attach `echo-loop-web.zip` to a GitHub release.

To build a shareable zip locally:

```
bash scripts/package-web.sh      # writes dist/echo-loop-web.zip
```

The zip contains only `index.html`, `lib/` and `src/`.

## How this meets the brief

- **Original concept:** a record-and-replay puzzle mechanic where echoes act as buttons-holders, laser shields and (on later levels) stepping stones.
- **Code-based mechanics:** recording, replay, buttons, doors, lasers, moving platforms, solid echoes and physics are all written in JavaScript.
- **Clear objectives and choices:** reach the exit within 12 seconds, planning which echo does which job.
- **Functional loop with win/lose:** loops, death and restart, level progression, and an ending screen with per-level results.
- **Polish:** HUD with timer bar, loop counter and echo pips, best-result tracking, in-code sound effects, screen shake, particles, echo trails, fades between levels, hints in every level, pause, mute and full touch support.
