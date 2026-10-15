const COLS = {
  grid: 0x121a33, plat: 0x1c2848, platTop: 0x5b78c7, player: 0xe8fbff, accent: 0x35e0ff,
  ghost: [0xff4fd8, 0xffc247, 0x7dff8a], warn: 0xff4d6d, exit: 0x59ffa8
};
const BTN_COLS = [0xffc247, 0x35e0ff, 0xff4fd8];
const FONT = 'Trebuchet MS, Verdana, sans-serif';

class GameScene extends Phaser.Scene {
  constructor() { super('Game'); }

  init(data) { this.li = (data && data.level) || 0; }

  create() {
    const L = this.L = LEVELS[this.li];
    this.cameras.main.fadeIn(350);
    this.g = this.add.graphics();

    const T = (x, y, size, color, ox = 0, oy = 0) =>
      this.add.text(x, y, '', { fontFamily: FONT, fontSize: size + 'px', color, align: 'center', wordWrap: { width: 900 } })
        .setOrigin(ox, oy).setDepth(10);
    this.tTitle = T(20, 12, 20, '#cfe3ff');
    this.tTitle.setText('LEVEL ' + (this.li + 1) + '  -  ' + L.name);
    this.tTime = T(480, 8, 22, '#ffffff', 0.5);
    this.tEch = T(868, 12, 14, '#9fb4e6', 1);
    this.tEch.setText('ECHOES');
    this.tLoops = T(20, 40, 14, '#9fb4e6');
    this.tLoops.setText('LOOPS 0');
    this.tKeys = T(480, 60, 13, '#5f7099', 0.5);
    this.tKeys.setText('R end loop early   |   P pause   |   M mute   |   Backspace restart   |   Esc menu');
    this.tHint = T(480, 536, 15, '#b6c7f0', 0.5, 1);
    this.tHint.setText(L.hint);
    this.tBanner = T(480, 190, 38, '#ffffff', 0.5).setStroke('#0b1020', 6).setAlpha(0);
    this.tPaused = T(480, 250, 44, '#ffffff', 0.5).setStroke('#0b1020', 6).setText('PAUSED').setAlpha(0);

    this.keys = this.input.keyboard.addKeys('LEFT,RIGHT,UP,A,D,W,SPACE,R,BACKSPACE,ESC,M,P');
    this.input.keyboard.on('keydown', () => Sfx.init());

    // Pause automatically when the tab / window loses focus, so a loop is never
    // lost to an alt-tab. The loop resumes when the player presses P again.
    this.onBlur = () => { if (this.state === 'play') this.paused = true; };
    window.addEventListener('blur', this.onBlur);
    this.events.once('shutdown', () => window.removeEventListener('blur', this.onBlur));

    this.plat = L.platforms.map(p => ({ x: p[0], y: p[1], w: p[2], h: p[3] }));
    this.hazards = (L.spikes || []).map(s => ({ x: s.x + 3, y: 488, w: s.w - 6, h: 12 }));
    this.bcol = {};
    (L.buttons || []).forEach((b, i) => { this.bcol[b.id] = BTN_COLS[i % 3]; });

    this.player = new Player(L.start[0], L.start[1]);
    this.ghosts = [];
    this.parts = [];
    this.acc = 0;
    this.jumpQ = false;
    this.bannerT = 0;
    this.paused = false;
    this.loops = 0;
    this.inp = {};
    this.startRound();
  }

  // ---------- round control ----------
  startRound() {
    const L = this.L;
    this.frame = 0;
    this.rec = new Recorder();
    this.state = 'play';
    this.laserSounded = false;
    this.player.reset(L.start[0], L.start[1]);
    this.movers = (L.movers || []).map(m => {
      const o = Object.assign({}, m, { isMover: true, dx: 0 });
      o.x = moverX(o, 0);
      return o;
    });
    this.buttons = (L.buttons || []).map(b => ({
      id: b.id, rect: { x: b.x, y: b.y - 8, w: b.w, h: 8 }, pressed: false, was: false
    }));
    this.doors = (L.doors || []).map(d => Object.assign({}, d, { open: false }));
    this.beams = [];
    this.sync(0);
  }

  showBanner(text, secs) {
    this.tBanner.setText(text);
    this.bannerT = secs;
  }

  endLoop() {
    if (this.state !== 'play') return;
    if (this.rec.frames.length < 20) { this.showBanner('Move first, then press R', 1); return; }
    this.loops++;
    if (this.ghosts.length >= this.L.maxGhosts) {
      this.ghosts = [];
      this.showBanner('Out of echoes - level reset', 1.6);
      Sfx.death();
    } else {
      this.ghosts.push({ frames: this.rec.frames, color: COLS.ghost[this.ghosts.length % 3] });
      this.showBanner('Echo ' + this.ghosts.length + ' saved', 1);
      Sfx.echo();
    }
    this.startRound();
  }

  die() {
    if (this.state !== 'play') return;
    this.state = 'dead';
    Sfx.death();
    this.cameras.main.shake(260, 0.012);
    this.burst(this.player.x + 12, this.player.y + 16, 0xe8fbff, 28);
    this.registry.set('deaths', (this.registry.get('deaths') || 0) + 1);
    this.time.delayedCall(700, () => { this.startRound(); });
  }

  win() {
    if (this.state !== 'play') return;
    this.state = 'win';
    Sfx.win();
    this.burst(this.player.x + 12, this.player.y + 16, COLS.exit, 36);
    this.showBanner('LOOP CLOSED!', 1.6);
    this.time.delayedCall(1100, () => {
      this.cameras.main.fadeOut(450);
      this.cameras.main.once('camerafadeoutcomplete', () => {
        if (this.li + 1 < LEVELS.length) this.scene.start('Game', { level: this.li + 1 });
        else this.scene.start('Win');
      });
    });
  }

  burst(x, y, c, n) {
    for (let i = 0; i < n; i++) {
      this.parts.push({
        x, y, c, vx: Phaser.Math.Between(-220, 220), vy: Phaser.Math.Between(-360, 60), life: 0.8, max: 0.8
      });
    }
  }

  // ---------- simulation ----------
  sync(f) {
    for (const m of this.movers) {
      const nx = moverX(m, f);
      m.dx = nx - m.x;
      m.x = nx;
    }
    this.gAct = this.ghosts.map(g => {
      const p = Recorder.sample(g.frames, f);
      return { x: p[0], y: p[1], w: PHY.W, h: PHY.H, face: p[2], color: g.color };
    });
    const acts = [this.player].concat(this.gAct);
    for (const b of this.buttons) {
      b.pressed = acts.some(a => overlap(a, b.rect));
      if (b.pressed && !b.was) Sfx.click();
      b.was = b.pressed;
    }
    for (const d of this.doors) {
      const was = d.open;
      d.open = d.btns.every(id => this.buttons.some(b => b.id === id && b.pressed));
      if (d.open !== was) Sfx.door();
    }
  }

  // Returns true if the beam hit the player. Beams stop at the first solid or echo.
  castBeams(solids) {
    this.beams = [];
    const acts = [this.player].concat(this.gAct);
    let killed = false;
    for (const l of (this.L.lasers || [])) {
      const active = this.frame / 60 >= (l.on || 0);
      let ex = PHY.WORLD_W, hit = null;
      if (active) {
        if (!this.laserSounded) { this.laserSounded = true; Sfx.laser(); }
        for (let x = l.x; x < PHY.WORLD_W; x += 4) {
          const pt = { x, y: l.y - 3, w: 4, h: 6 };
          if (solids.some(s => overlap(pt, s))) { ex = x; break; }
          const a = acts.find(q => overlap(pt, q));
          if (a) { ex = x; hit = a; break; }
        }
      }
      this.beams.push({ x: l.x, y: l.y, ex, active, hit, on: l.on || 0 });
      if (hit === this.player) killed = true;
    }
    return killed;
  }

  step() {
    if (this.state !== 'play') return;
    this.sync(this.frame);
    const p = this.player;
    for (const d of this.doors) if (!d.open && overlap(p, d)) return this.die();

    const solids = this.plat.concat(this.movers, this.doors.filter(d => !d.open));
    p.step(Object.assign({}, this.inp, { jumpPressed: this.jumpQ }), solids);
    this.jumpQ = false;
    if (p.jumped) { Sfx.jump(); p.jumped = false; }
    this.rec.record(p);

    if (p.y > 580) return this.die();
    if (this.hazards.some(h => overlap(p, h))) return this.die();
    if (this.castBeams(solids)) return this.die();
    if (overlap(p, this.L.exit)) return this.win();

    this.frame++;
    if (this.frame >= PHY.ROUND_FRAMES) this.endLoop();
  }

  // ---------- input / frame loop ----------
  handleKeys() {
    const k = this.keys, J = Phaser.Input.Keyboard.JustDown;
    if (J(k.P)) this.paused = !this.paused;
    if (J(k.M)) this.showBanner(Sfx.toggleMute() ? 'Sound off' : 'Sound on', 0.8);
    if (J(k.ESC)) { this.scene.start('Menu'); return; }
    if (this.paused) return;
    this.inp = {
      left: k.LEFT.isDown || k.A.isDown,
      right: k.RIGHT.isDown || k.D.isDown,
      jumpHeld: k.SPACE.isDown || k.UP.isDown || k.W.isDown
    };
    const j1 = J(k.SPACE), j2 = J(k.UP), j3 = J(k.W);
    if (j1 || j2 || j3) this.jumpQ = true;
    if (J(k.R)) this.endLoop();
    if (J(k.BACKSPACE)) {
      this.ghosts = [];
      this.startRound();
      this.showBanner('Level reset', 0.9);
    }
  }

  update(time, delta) {
    this.handleKeys();
    if (!this.paused) {
      this.acc += Math.min(delta, 50) / 1000;
      while (this.acc >= PHY.DT) { this.acc -= PHY.DT; this.step(); }
    }
    const dt = delta / 1000;
    for (const q of this.parts) { q.x += q.vx * dt; q.y += q.vy * dt; q.vy += 900 * dt; q.life -= dt; }
    this.parts = this.parts.filter(q => q.life > 0);
    this.draw();

    const rem = Math.max(0, (PHY.ROUND_FRAMES - this.frame) / 60);
    this.tTime.setText(rem.toFixed(1) + 's');
    this.tTime.setColor(rem < 3 ? '#ff6b8b' : '#ffffff');
    this.tLoops.setText('LOOPS ' + this.loops);
    this.tPaused.setAlpha(this.paused ? 1 : 0);
    if (this.bannerT > 0) { this.bannerT -= dt; this.tBanner.setAlpha(Math.min(1, this.bannerT * 3)); }
    else this.tBanner.setAlpha(0);
  }

  // ---------- drawing ----------
  draw() {
    const g = this.g, L = this.L, f = this.frame, now = this.time.now / 1000;
    g.clear();

    g.lineStyle(1, COLS.grid, 1);
    for (let x = 0; x <= 960; x += 48) g.lineBetween(x, 0, x, 540);
    for (let y = 0; y <= 540; y += 48) g.lineBetween(0, y, 960, y);

    for (const p of this.plat) {
      g.fillStyle(COLS.plat, 1); g.fillRect(p.x, p.y, p.w, p.h);
      g.fillStyle(COLS.platTop, 1); g.fillRect(p.x, p.y, p.w, 3);
    }
    for (const m of this.movers) {
      g.fillStyle(0x2c3f73, 1); g.fillRect(m.x, m.y, m.w, m.h);
      g.fillStyle(COLS.accent, 1); g.fillRect(m.x, m.y, m.w, 3);
    }
    g.fillStyle(COLS.warn, 1);
    for (const s of (L.spikes || [])) {
      for (let x = s.x; x < s.x + s.w; x += 14) g.fillTriangle(x, 500, x + 7, 486, x + 14, 500);
    }

    // buttons
    for (const b of this.buttons) {
      const c = this.bcol[b.id], r = b.rect;
      g.fillStyle(0x0d1428, 1); g.fillRect(r.x - 3, r.y + 5, r.w + 6, 4);
      g.fillStyle(c, 1);
      if (b.pressed) g.fillRect(r.x, r.y + 5, r.w, 3);
      else g.fillRect(r.x, r.y, r.w, 8);
      if (b.pressed) { g.fillStyle(c, 0.15); g.fillRect(r.x - 6, r.y - 18, r.w + 12, 26); }
    }

    // doors
    for (const d of this.doors) {
      const c = this.bcol[d.btns[0]];
      if (d.open) {
        g.fillStyle(c, 0.08); g.fillRect(d.x, d.y, d.w, d.h);
        g.lineStyle(2, c, 0.35); g.strokeRect(d.x, d.y, d.w, d.h);
      } else {
        g.fillStyle(c, 0.85); g.fillRect(d.x, d.y, d.w, d.h);
        g.fillStyle(0x0b1020, 0.35);
        for (let y = d.y + 10; y < d.y + d.h; y += 20) g.fillRect(d.x, y, d.w, 5);
      }
      d.btns.forEach((id, i) => { g.fillStyle(this.bcol[id], 1); g.fillRect(d.x + 3, d.y - 14 - i * 12, d.w - 6, 8); });
    }

    // exit portal
    const e = L.exit, pulse = 0.5 + 0.5 * Math.sin(now * 3);
    g.fillStyle(COLS.exit, 0.10 + 0.10 * pulse); g.fillRoundedRect(e.x - 8, e.y - 8, e.w + 16, e.h + 16, 12);
    g.fillStyle(COLS.exit, 0.55); g.fillRoundedRect(e.x, e.y, e.w, e.h, 8);
    g.fillStyle(0xffffff, 0.35); g.fillRoundedRect(e.x + 8, e.y + 8, e.w - 16, e.h - 16, 5);

    // lasers
    for (const b of this.beams) {
      g.fillStyle(0x2a1830, 1); g.fillRect(b.x, b.y - 12, 10, 24);
      g.fillStyle(COLS.warn, 1); g.fillRect(b.x + 3, b.y - 3, 4, 6);
      if (b.active) {
        g.lineStyle(10, COLS.warn, 0.15); g.lineBetween(b.x + 10, b.y, b.ex, b.y);
        g.lineStyle(4, COLS.warn, 0.95);  g.lineBetween(b.x + 10, b.y, b.ex, b.y);
        g.lineStyle(1.5, 0xffffff, 0.9);  g.lineBetween(b.x + 10, b.y, b.ex, b.y);
        if (b.hit && b.hit !== this.player) { g.fillStyle(0xffffff, 0.9); g.fillCircle(b.ex, b.y, 5 + 2 * Math.sin(now * 30)); }
      } else {
        const left = b.on - f / 60;
        const a = left < 0.6 ? (Math.floor(now * 12) % 2 ? 0.8 : 0.15) : 0.22;
        g.lineStyle(2, COLS.warn, a);
        for (let x = b.x + 12; x < 960; x += 20) g.lineBetween(x, b.y, x + 10, b.y);
      }
    }

    // echoes (ghosts): trail + glow + body
    // gAct is built in the same order as this.ghosts, so index straight into the
    // recordings. Sampling is clamped to each ghost's own length so a finished echo
    // cannot read past the end of its trail.
    for (let i = 0; i < this.gAct.length; i++) {
      const a = this.gAct[i], fr = this.ghosts[i].frames;
      const last = fr.length - 1;
      for (let k = 6; k >= 1; k--) {
        const q = fr[Math.max(0, Math.min(last, f - k * 3))];
        g.fillStyle(a.color, 0.05 + 0.025 * (6 - k)); g.fillRoundedRect(q[0], q[1], PHY.W, PHY.H, 6);
      }
      g.fillStyle(a.color, 0.18); g.fillRoundedRect(a.x - 4, a.y - 4, PHY.W + 8, PHY.H + 8, 9);
      g.fillStyle(a.color, 0.6); g.fillRoundedRect(a.x, a.y, PHY.W, PHY.H, 6);
      g.fillStyle(0x0b1020, 0.8); g.fillRect(a.x + (a.face > 0 ? 13 : 3), a.y + 8, 8, 6);
    }

    // player
    if (this.state !== 'dead') {
      const p = this.player;
      g.fillStyle(COLS.accent, 0.25); g.fillRoundedRect(p.x - 3, p.y - 3, p.w + 6, p.h + 6, 8);
      g.fillStyle(COLS.player, 1); g.fillRoundedRect(p.x, p.y, p.w, p.h, 6);
      g.fillStyle(0x0b1020, 1); g.fillRect(p.x + (p.face > 0 ? 13 : 3), p.y + 8, 8, 6);
    }

    // particles
    for (const q of this.parts) { g.fillStyle(q.c, Math.max(0, q.life / q.max)); g.fillRect(q.x, q.y, 4, 4); }

    // pause dim
    if (this.paused) { g.fillStyle(0x0b1020, 0.45); g.fillRect(0, 0, 960, 540); }

    // HUD: timer bar and echo pips
    const frac = Math.max(0, (PHY.ROUND_FRAMES - f) / PHY.ROUND_FRAMES);
    g.fillStyle(0x16203a, 1); g.fillRect(330, 40, 300, 8);
    g.fillStyle(frac < 0.25 ? COLS.warn : COLS.accent, 1); g.fillRect(330, 40, 300 * frac, 8);
    for (let i = 0; i < L.maxGhosts; i++) {
      const x = 876 + i * 22;
      if (i < this.ghosts.length) { g.fillStyle(this.ghosts[i].color, 1); g.fillRoundedRect(x, 14, 14, 14, 3); }
      else { g.lineStyle(2, 0x5f7099, 1); g.strokeRoundedRect(x, 14, 14, 14, 3); }
    }
  }
}
