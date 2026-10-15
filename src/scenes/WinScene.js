class WinScene extends Phaser.Scene {
  constructor() { super('Win'); }

  create() {
    this.cameras.main.fadeIn(500);
    this.g = this.add.graphics();
    const T = (x, y, s, c, str, ox = 0.5, oy = 0) => this.add.text(x, y, str, {
      fontFamily: FONT, fontSize: s + 'px', color: c, align: 'center'
    }).setOrigin(ox, oy);

    T(480, 70, 60, '#59ffa8', 'ALL LOOPS CLOSED').setStroke('#0b1020', 6);
    T(480, 150, 20, '#cfe3ff', 'You beat time by cooperating with yourself.');

    // Per-level results table (name, loops, time, deaths) plus a totals row.
    const results = this.registry.get('results') || [];
    const hx = 250, cLoops = 540, cTime = 640, cDeaths = 730;
    let y = 210;
    T(hx, y, 15, '#5f7099', 'LEVEL', 0);
    T(cLoops, y, 15, '#5f7099', 'LOOPS', 1);
    T(cTime, y, 15, '#5f7099', 'TIME', 1);
    T(cDeaths, y, 15, '#5f7099', 'DEATHS', 1);
    y += 26;
    let tl = 0, tt = 0, td = 0;
    results.forEach(r => {
      tl += r.loops; tt += r.time; td += r.deaths;
      T(hx, y, 15, '#cfe3ff', r.name, 0);
      T(cLoops, y, 15, '#9fb4e6', String(r.loops), 1);
      T(cTime, y, 15, '#9fb4e6', r.time.toFixed(1) + 's', 1);
      T(cDeaths, y, 15, '#9fb4e6', String(r.deaths), 1);
      y += 24;
    });
    y += 6;
    T(hx, y, 15, '#59ffa8', 'TOTAL', 0);
    T(cLoops, y, 15, '#59ffa8', String(tl), 1);
    T(cTime, y, 15, '#59ffa8', tt.toFixed(1) + 's', 1);
    T(cDeaths, y, 15, '#59ffa8', String(td), 1);

    T(480, 448, 18, '#ffffff', 'SPACE / tap: play again     ESC: menu');
    Sfx.win();
    this.keys = this.input.keyboard.addKeys('SPACE,ESC');

    // Tap (or click) anywhere to continue.
    this.leaving = false;
    this.leave = () => { if (this.leaving) return; this.leaving = true; this.scene.start('Menu'); };
    this.input.on('pointerdown', this.leave);
  }

  update(time) {
    const J = Phaser.Input.Keyboard.JustDown;
    if (J(this.keys.SPACE) || J(this.keys.ESC)) this.leave();
    const g = this.g, t = time / 1000;
    g.clear();
    for (let i = 0; i < 3; i++) {
      const x = ((t * 140 + i * -70) % 1100) - 70;
      g.fillStyle(COLS.ghost[i], 0.7); g.fillRoundedRect(x, 496, 24, 32, 6);
    }
    g.fillStyle(COLS.player, 1); g.fillRoundedRect(((t * 140 + 70) % 1100) - 70, 496, 24, 32, 6);
  }
}
