class WinScene extends Phaser.Scene {
  constructor() { super('Win'); }

  create() {
    this.cameras.main.fadeIn(500);
    this.g = this.add.graphics();
    const T = (y, s, c, str) => this.add.text(480, y, str, {
      fontFamily: FONT, fontSize: s + 'px', color: c, align: 'center'
    }).setOrigin(0.5, 0);
    T(110, 60, '#59ffa8', 'ALL LOOPS CLOSED').setStroke('#0b1020', 6);
    T(210, 22, '#cfe3ff', 'You beat time by cooperating with yourself.');
    T(270, 18, '#9fb4e6', 'Total deaths: ' + (this.registry.get('deaths') || 0));
    T(400, 18, '#ffffff', 'SPACE: play again     ESC: menu');
    Sfx.win();
    this.keys = this.input.keyboard.addKeys('SPACE,ESC');
  }

  update(time) {
    const J = Phaser.Input.Keyboard.JustDown;
    if (J(this.keys.SPACE) || J(this.keys.ESC)) this.scene.start('Menu');
    const g = this.g, t = time / 1000;
    g.clear();
    for (let i = 0; i < 3; i++) {
      const x = ((t * 140 + i * -70) % 1100) - 70;
      g.fillStyle(COLS.ghost[i], 0.7); g.fillRoundedRect(x, 480, 24, 32, 6);
    }
    g.fillStyle(COLS.player, 1); g.fillRoundedRect(((t * 140 + 70) % 1100) - 70, 480, 24, 32, 6);
  }
}
