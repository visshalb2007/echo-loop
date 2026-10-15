// In-page test helpers, injected by tests/harness.py.
//
// Everything drives the deterministic 60 Hz step directly, so a scripted solution
// plays back identically on every machine. The Phaser loop is slept by the harness;
// these helpers call scene.step() by hand.
(function () {
  const game = () => window.__echoLoop;
  const scene = () => game().scene.getScene('Game');

  function stepOnce(input, jumpEdge) {
    const s = scene();
    if (!s || s.state !== 'play') return false;
    s.inp = { left: !!input.left, right: !!input.right, jumpHeld: !!input.jumpHeld };
    if (jumpEdge) s.jumpQ = true;
    s.step();
    return true;
  }

  function parseKeys(keys) {
    const list = typeof keys === 'string' ? keys.split(/[,\s]+/) : (keys || []);
    const want = { left: false, right: false, jumpHeld: false, jump: false };
    for (const raw of list) {
      const k = String(raw).toLowerCase();
      if (k === 'left' || k === 'a') want.left = true;
      else if (k === 'right' || k === 'd') want.right = true;
      else if (k === 'jump' || k === 'up' || k === 'w' || k === 'space') { want.jumpHeld = true; want.jump = true; }
    }
    return want;
  }

  window.__bot = {
    scene,
    levelCount() { return LEVELS.length; },
    state() { return scene().state; },
    frame() { return scene().frame; },
    x() { return scene().player.x; },
    y() { return scene().player.y; },
    onGround() { return !!scene().player.onGround; },
    ghosts() { return scene().ghosts.length; },
    loops() { return scene().loops; },
    done() { return scene().state === 'win'; },
    paused() { return !!scene().paused; },

    // Hold a set of keys for `until` fixed steps, or until `until(n)` is true.
    // Including 'jump' taps the jump edge on the first step and keeps it held
    // (so the jump reaches full height).
    hold(keys, until) {
      const want = parseKeys(keys);
      let n = 0, edges = want.jump;
      while (scene().state === 'play') {
        stepOnce(want, edges);
        edges = false;
        n++;
        if (typeof until === 'function') { if (until(n)) break; }
        else if (typeof until === 'number') { if (n >= until) break; }
        else break;
        if (n > 100000) break; // safety net
      }
      return n;
    },

    // Tap jump and hold just long enough for a full-height hop.
    jump(frames) { return this.hold(['jump'], frames || 14); },

    // Advance in place for n steps.
    wait(n) { return this.hold([], n); },

    // End the current loop early, saving it as an echo (the R key).
    echo() { scene().endLoop(); },

    // Restart the level, dropping every echo (the Backspace key).
    restart() { const s = scene(); s.ghosts = []; s.startRound(); }
  };
})();
