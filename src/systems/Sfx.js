// Sound effects made in code with the Web Audio API (no audio files needed).
const Sfx = {
  ctx: null,
  muted: false,

  // Load the persisted mute preference (defaults to unmuted).
  loadPrefs() { this.muted = !!Store.get('muted', false); },

  setMuted(v) { this.muted = !!v; Store.set('muted', this.muted); },

  toggleMute() { this.setMuted(!this.muted); return this.muted; },

  init() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext;
        if (AC) this.ctx = new AC();
      }
      if (this.ctx && this.ctx.state === 'suspended') this.ctx.resume();
    } catch (e) { /* audio is optional */ }
  },

  tone(f1, f2, dur, type = 'square', vol = 0.1, delay = 0) {
    const c = this.ctx;
    if (!c || this.muted) return;
    const t0 = c.currentTime + delay;
    const o = c.createOscillator();
    const g = c.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f1, t0);
    o.frequency.exponentialRampToValueAtTime(Math.max(1, f2), t0 + dur);
    g.gain.setValueAtTime(vol, t0);
    g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
    o.connect(g);
    g.connect(c.destination);
    o.start(t0);
    o.stop(t0 + dur + 0.02);
  },

  jump()  { this.tone(280, 640, 0.14, 'square', 0.06); },
  click() { this.tone(760, 980, 0.06, 'triangle', 0.1); },
  door()  { this.tone(180, 90, 0.18, 'sawtooth', 0.05); },
  laser() { this.tone(1400, 180, 0.35, 'sawtooth', 0.05); },
  death() { this.tone(260, 35, 0.45, 'sawtooth', 0.12); },
  echo()  { this.tone(520, 260, 0.28, 'sine', 0.14); this.tone(780, 390, 0.28, 'sine', 0.09, 0.07); },
  win()   { [523, 659, 784, 1047].forEach((f, i) => this.tone(f, f, 0.2, 'triangle', 0.12, i * 0.11)); }
};
