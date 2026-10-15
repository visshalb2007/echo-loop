# ECHO LOOP

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
| Esc | Back to menu |
| 1 to 5 (menu) | Pick a level |

## Rules

1. A loop lasts 12 seconds. Reach the green exit portal to win the level.
2. When time runs out, or you press **R**, your run becomes an echo and a new loop starts.
3. You can keep at most **3 echoes**. If a 4th loop ends without winning, the level resets.
4. An echo that finishes its recording keeps standing where it ended.
5. **Buttons** are pressed by you or by any echo standing on them. A **door** opens only while all of its buttons are pressed.
6. **Lasers** switch on after a delay and kill you. A beam stops at the first echo it touches, so an echo works as a shield.
7. **Spikes**, lasers and falling into a pit restart the current loop. Your echoes stay.

## Levels

| # | Name | New idea |
|---|---|---|
| 1 | First Echo | One button, one door. Your echo holds the button. |
| 2 | Two Locks | Two doors in a row. Build two echoes in order. |
| 3 | The Beam | A laser that wakes at 2s. Use R to place an echo at the wall as a shield. |
| 4 | Moving Ground | A moving platform over a pit and a door that needs two buttons. |
| 5 | Final Loop | Laser shield, button, door and spikes together. |

Levels are plain data in `src/levels/levels.js`, so adding a level needs no new code.

## Project structure

```
echo-loop/
  index.html              loads Phaser and the scripts
  README.md
  lib/phaser.min.js       Phaser 3.80.1 (bundled)
  src/
    main.js               game config
    scenes/
      MenuScene.js        title, instructions, level select
      GameScene.js        main loop: rounds, echoes, buttons, doors, lasers, HUD
      WinScene.js         ending screen
    systems/
      Physics.js          constants and box overlap helper
      Recorder.js         records and replays positions
      Sfx.js              sound effects made in code (Web Audio)
    objects/
      Entities.js         Player physics and the moving-platform helper
    levels/
      levels.js           5 levels as data
```

## Technical notes

- **Fixed timestep:** the game logic runs at exactly 60 steps per second, so every loop plays out the same way.
- **Recording:** the Recorder saves the player's position (and facing) each frame. Echoes replay those positions, so they always match what you did, even if the world changes around them.
- **Custom physics:** the platformer movement (gravity, jump buffer, coyote time, variable jump height, moving-platform carrying) is written by hand in `Entities.js`. It does not use Phaser's physics engine.
- **Lasers:** each frame a beam is traced in small steps from its emitter to the right until it meets a solid, an echo or the player.
- **Assets:** there are none. All graphics are drawn with code, and all sounds are generated with the Web Audio API.

## How this meets the brief

- **Original concept:** a record-and-replay puzzle mechanic where echoes act as buttons-holders and laser shields.
- **Code-based mechanics:** recording, replay, buttons, doors, lasers, moving platforms and physics are all written in JavaScript.
- **Clear objectives and choices:** reach the exit within 12 seconds, planning which echo does which job.
- **Functional loop with win/lose:** loops, death and restart, level progression, and an ending screen.
- **Polish:** HUD with timer bar and echo counter, in-code sound effects, screen shake, particles, echo trails, fades between levels, hints in every level.
