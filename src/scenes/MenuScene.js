class MenuScene extends Phaser.Scene {
  constructor() { super('Menu'); }

  create() {
    this.cameras.main.fadeIn(300);
    this.g = this.add.graphics();
    const T = (x, y, s, c, str) => this.add.text(x, y, str, {
      fontFamily: FONT, fontSize: s + 'px', color: c, align: 'center', wordWrap: { width: 880 }
    }).setOrigin(0.5, 0);

    T(480, 24, 78, '#e8fbff', 'ECHO LOOP').setStroke('#35e0ff', 3);
    T(480, 118, 20, '#9fb4e6', 'Team up with your own past selves.');

    const lines = [
      'Every loop lasts 12 seconds. Move: Arrows or A / D.   Jump: Space, W or Up.',
      'When time runs out (or you press R) your run becomes an ECHO and replays itself.',
      'Echoes can hold buttons down and absorb lasers. You can keep up to 3.',
      'Reach the green exit to win. Lasers, spikes and pits restart your loop.',
      'P pauses, M mutes. Touch screens get on-screen buttons after the first tap.'
    ];
    lines.forEach((s, i) => T(480, 262 + i * 28, 17, '#cfe3ff', s));

    // Level cards are laid out dynamically, so any number of levels fits:
    // centres are `gap` apart and the whole row is centred on the screen.
    const n = LEVELS.length, y = 410;
    const gap = Math.min(170, 880 / n);
    const cw = Math.min(150, gap - 16);
    const x0 = 480 - (n - 1) * gap / 2;
    this.boxes = [];
    LEVELS.forEach((L, i) => {
      const x = x0 + i * gap;
      const best = Store.best(i), cleared = !!best;
      const r = this.add.rectangle(x, y, cw, 74, 0x16203a)
        .setStrokeStyle(2, cleared ? 0x59ffa8 : 0x35e0ff).setInteractive({ useHandCursor: true });
      r.on('pointerover', () => r.setFillStyle(0x24345f));
      r.on('pointerout', () => r.setFillStyle(0x16203a));
      r.on('pointerdown', () => this.start(i));
      this.add.text(x, y - 20, String(i + 1), { fontFamily: FONT, fontSize: '24px', color: '#ffffff' }).setOrigin(0.5, 0.5);
      this.add.text(x, y + 4, L.name, {
        fontFamily: FONT, fontSize: '13px', color: '#cfe3ff', align: 'center', wordWrap: { width: cw - 10 }
      }).setOrigin(0.5, 0.5);
      const sub = cleared ? best.loops + ' loops, ' + best.time.toFixed(1) + 's' : 'not cleared';
      this.add.text(x, y + 26, sub, {
        fontFamily: FONT, fontSize: '11px', color: cleared ? '#59ffa8' : '#5f7099'
      }).setOrigin(0.5, 0.5);
      this.boxes.push(r);
    });

    T(480, 480, 16, '#59ffa8', 'Click a level, press 1-' + n + ', or press SPACE to start');
    const NAMES = ['ONE', 'TWO', 'THREE', 'FOUR', 'FIVE', 'SIX', 'SEVEN', 'EIGHT', 'NINE'];
    this.levelKeys = NAMES.slice(0, Math.min(n, NAMES.length));
    this.keys = this.input.keyboard.addKeys(this.levelKeys.concat(['SPACE', 'ENTER']).join(','));
    this.input.keyboard.on('keydown', () => Sfx.init());
    this.input.on('pointerdown', () => Sfx.init());
    this.starting = false;
  }

  start(i) {
    if (this.starting) return;
    this.starting = true;
    Sfx.init();
    Sfx.click();
    this.registry.set('deaths', 0);
    this.cameras.main.fadeOut(250);
    this.cameras.main.once('camerafadeoutcomplete', () => this.scene.start('Game', { level: i }));
  }

  update(time) {
    const J = Phaser.Input.Keyboard.JustDown, k = this.keys;
    this.levelKeys.forEach((name, i) => { if (J(k[name])) this.start(i); });
    if (J(k.SPACE) || J(k.ENTER)) this.start(0);

    // little demo: a player and three echoes following its path
    const g = this.g, t = time / 1000, floor = 232;
    g.clear();
    g.fillStyle(0x1c2848, 1); g.fillRect(180, floor, 600, 6);
    g.fillStyle(0x5b78c7, 1); g.fillRect(180, floor, 600, 2);
    const pos = s => ({ x: 480 + 250 * Math.sin(s * 0.9), y: floor - 32 - 46 * Math.max(0, Math.sin(s * 2.4)) });
    [0.5, 1.0, 1.5].forEach((d, i) => {
      const q = pos(t - d);
      g.fillStyle(COLS.ghost[i], 0.55); g.fillRoundedRect(q.x, q.y, 24, 32, 6);
    });
    const p = pos(t);
    g.fillStyle(COLS.player, 1); g.fillRoundedRect(p.x, p.y, 24, 32, 6);
  }
}
