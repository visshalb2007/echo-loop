// Tiny localStorage wrapper for persistence (best times, mute, play time).
// Values are JSON encoded. If localStorage is unavailable (e.g. opened via file://
// or blocked by privacy settings) it transparently falls back to an in-memory map,
// so the game never throws just because storage is missing.
const Store = {
  PREFIX: 'echoloop.',
  mem: {},

  _ls() {
    try { return window.localStorage; } catch (e) { return null; }
  },

  get(key, def) {
    const ls = this._ls();
    if (ls) {
      try {
        const raw = ls.getItem(this.PREFIX + key);
        return raw === null ? def : JSON.parse(raw);
      } catch (e) { /* fall through to memory */ }
    }
    if (key in this.mem) {
      try { return JSON.parse(this.mem[key]); } catch (e) { return def; }
    }
    return def;
  },

  set(key, val) {
    const raw = JSON.stringify(val);
    const ls = this._ls();
    if (ls) {
      try { ls.setItem(this.PREFIX + key, raw); return; } catch (e) { /* fall through */ }
    }
    this.mem[key] = raw;
  },

  // ---- best results -------------------------------------------------------
  // Each level keeps its best clear as { loops, time }. Fewer loops wins;
  // when two runs use the same number of loops, the faster time wins.
  best(level) { return this.get('best.' + level, null); },

  recordBest(level, loops, time) {
    const prev = this.best(level);
    const better = !prev || loops < prev.loops || (loops === prev.loops && time < prev.time);
    if (better) this.set('best.' + level, { loops, time });
    return { improved: better, prev };
  },

  // Remove every value this game has ever stored (used to reset progress).
  clear() {
    const ls = this._ls();
    if (ls) {
      try {
        for (let i = ls.length - 1; i >= 0; i--) {
          const k = ls.key(i);
          if (k && k.indexOf(this.PREFIX) === 0) ls.removeItem(k);
        }
      } catch (e) { /* ignore */ }
    }
    this.mem = {};
  }
};
