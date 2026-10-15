// On-screen controls for touch devices.
//
// The buttons stay hidden until the first *real* touch (a pointer whose
// `wasTouch` flag is set), so mouse and keyboard users never see them. Several
// fingers can be held down at once (we ask Phaser for extra pointers), and the
// one-shot actions (jump / echo / restart / pause / menu) are edge-detected so a
// tap fires exactly once no matter how many fixed steps run in that frame.
const TOUCH_BTNS = [
  { id: 'left',    x: 70,  y: 470, r: 36, label: '\u25C0', hold: true },
  { id: 'right',   x: 160, y: 470, r: 36, label: '\u25B6', hold: true },
  { id: 'jump',    x: 880, y: 470, r: 44, label: 'JUMP',  hold: true },
  { id: 'echo',    x: 772, y: 470, r: 34, label: 'ECHO' },
  { id: 'restart', x: 772, y: 392, r: 28, label: '\u21BA' },
  { id: 'pause',   x: 60,  y: 60,  r: 22, label: '\u275A\u275A' },
  { id: 'menu',    x: 900, y: 60,  r: 22, label: '\u2630' }
];

class Touch {
  constructor(scene) {
    this.scene = scene;
    this.enabled = false;                 // buttons visible / usable
    this.held = { left: false, right: false, jump: false };   // continuous actions
    this.oneshot = { jump: false, echo: false, restart: false, pause: false, menu: false };
    this.byPointer = {};                  // pointer id -> id of the button it presses
    this.objs = [];

    scene.input.addPointer(3);            // allow up to four simultaneous touches
    this.build();
    this.watch();
  }

  build() {
    const s = this.scene;
    for (const b of TOUCH_BTNS) {
      const c = s.add.circle(b.x, b.y, b.r, 0x16203a, 0.34)
        .setStrokeStyle(2, 0x35e0ff, 0.55).setDepth(20).setInteractive({ useHandCursor: false });
      const t = s.add.text(b.x, b.y, b.label, {
        fontFamily: 'Trebuchet MS, Verdana, sans-serif',
        fontSize: (b.r > 34 ? 16 : 13) + 'px', color: '#cfe3ff'
      }).setOrigin(0.5, 0.5).setDepth(21);
      c.on('pointerdown', p => this.down(b, p));
      c.on('pointerup', p => this.up(b, p));
      c.on('pointerout', p => this.up(b, p));
      this.objs.push(c, t);
    }
    this.setVisible(false);
  }

  watch() {
    this.scene.input.on('pointerdown', p => {
      if (p.wasTouch && !this.enabled) { this.enabled = true; this.setVisible(true); }
    });
  }

  down(b, p) {
    this.byPointer[p.id] = b.id;
    if (b.hold) this.held[b.id] = true;
    this.oneshot[b.id] = true;
  }

  up(b, p) {
    if (this.byPointer[p.id] !== b.id) return;
    delete this.byPointer[p.id];
    if (b.hold) this.held[b.id] = Object.keys(this.byPointer).some(k => this.byPointer[k] === b.id);
  }

  // Read and clear a one-shot action (edge detection).
  take(id) { const v = this.oneshot[id]; this.oneshot[id] = false; return v; }

  setVisible(v) { for (const o of this.objs) o.setVisible(v); }
}
