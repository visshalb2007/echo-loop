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
  }
};
