# ECHO LOOP
<img width="1607" height="866" alt="image" src="https://github.com/user-attachments/assets/35f3ce14-d9de-436e-8f06-7572f4ee7c1f" />

**A 12-second time-travel platformer.** Finish a level in one loop, or finish it by
cooperating with the echoes of your own past attempts.

Every loop lasts 12 seconds. When it ends, your run is saved as an **echo** — a ghost
that replays your exact movements while you play the next loop. Echoes hold buttons
down, block laser beams and (later on) become platforms, so each puzzle is solved by
splitting one job across several versions of yourself.

Think of it as leaving sticky notes for yourself: each loop you leave a note, and in
the next loop that note walks around and does the job for you.

7 levels · up to 3 echoes per level · no assets and no dependencies to install.

## Play it

Download the `echo-loop-web` artifact from the latest successful CI run
([Actions → CI](https://github.com/visshalb2007/echo-loop/actions)), extract it and
open `index.html`. Phaser 3 is bundled in `lib/`, so there is nothing else to install.

To run from a checkout instead, either double-click `index.html`, or serve the folder:

```
python -m http.server
```

Then open http://localhost:8000.

## Controls

| Key | Action |
|---|---|
| Arrows or A / D | Move |
| Space, W or Up | Jump (hold for a higher jump) |
| R | End the loop now and save it as an echo |
| Backspace | Restart the level, removing all echoes |
| P / M / Esc | Pause · mute · back to menu |
| 1–7 (menu) | Pick a level |

On a **touch device** an on-screen pad appears after the first tap — left, right, JUMP,
ECHO (same as R), restart, pause and menu. All of it is multi-touch, so you can hold a
direction and jump at the same time.

## How a level works

1. A loop lasts **12 seconds**. Reach the green exit portal to close the level.
2. Let the timer run out, or press **R**, and the run becomes an echo while a fresh loop starts.
3. At most **3 echoes** at once. A fourth loop that fails to win resets the level.
4. An echo that has finished replaying keeps standing where it stopped. **Buttons** are pressed by you or any echo; a **door** opens only while all of its buttons are held.
5. **Lasers** switch on after a delay and kill you, but a beam stops at the first echo it touches — an echo makes a perfect shield.
6. **Spikes**, lasers and pits restart the current loop. Your echoes survive.

## The seven levels

| # | Name | New idea |
|---|---|---|
| 1 | First Echo | One button, one door. Your echo holds the button. |
| 2 | Two Locks | Two doors in a row. Build two echoes in order. |
| 3 | The Beam | A laser that wakes at 2s. Use R to place an echo at the wall as a shield. |
| 4 | Moving Ground | A moving platform over a pit and a door that needs two buttons. |
| 5 | Stepping Echo | A resting echo is solid: stand on its head to reach a high ledge. |
| 6 | Echo Tower | The ledge is too high for one echo - stack two to build a tower. |
| 7 | Final Loop | Laser shield, button, door and spikes together. |

On levels 5 and 6 an echo that has finished replaying becomes a **solid platform**, but
never a trap: the game ignores it while you are standing inside it. Lasers still pass
through it.

Levels are plain data in `src/levels/levels.js` — adding one needs no new code, and
`maxGhosts` (the echo limit for that level) lives there too.

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

## Design notes

- **Determinism first.** The game logic runs on a fixed 60 Hz step rather than on real
  elapsed time, and the recorder stores the player's position and facing each step.
  Echoes replay those stored positions, so a loop always plays out the same way — and
  the headless tests can drive it frame by frame.
- **Hand-written physics.** Gravity, jump buffer, coyote time, variable jump height and
  moving-platform carrying live in `Entities.js`; Phaser's physics engine is not used.
- **Lasers are traced, not simulated.** Each step a beam walks rightward in small
  increments until it meets static geometry, an echo or the player. Only static
  geometry stops it, which is what makes solid echoes safe to stand on.
- **No assets.** Graphics are drawn with Phaser's graphics API and sounds are Web Audio
  oscillators, so the whole game is `index.html`, `lib/` and `src/`.

## Tests

`node tests/levels.test.js` validates the level data schema and needs nothing installed.
The full suite solves every level end to end in a headless browser:

```
pip install playwright
python -m playwright install chromium
python tests/harness.py          # all levels
python tests/harness.py 3 7      # only levels 3 and 7
```

It prints one PASS/FAIL line per level and fails if the page logged any console error.
The plans it follows are scripted in `tests/solutions.js` on top of `tests/bot.js`.

## Builds

Pushing to `main` runs [`.github/workflows/ci.yml`](.github/workflows/ci.yml): it
validates the level data, then packages the playable game and uploads it as the
`echo-loop-web` artifact (the site itself; extract and open `index.html`). Pushing a
`v*` tag also attaches `dist/echo-loop-web.zip` to a GitHub release.

GitHub Pages is deliberately not used — it requires a public repository on the Free
plan. To build the same zip locally:

```
bash scripts/package-web.sh      # writes dist/echo-loop-web.zip
```

## How this meets the brief

- **Original concept:** record-and-replay puzzling, where echoes act as button-holders,
  laser shields and stepping stones.
- **Code-based mechanics:** recording, replay, buttons, doors, lasers, moving platforms,
  solid echoes and platformer physics are all written from scratch in JavaScript.
- **Clear goals and choices:** reach the exit within 12 seconds and decide which echo
  does which job.
- **A real loop:** win/lose states, loop and level progression, and an ending screen with
  per-level results.
- **Polish:** timer bar, loop counter and echo pips in the HUD, best-result tracking,
  generated sound effects, screen shake, particles, echo trails, level fades, hints,
  pause, mute and full touch support.
