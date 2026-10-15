// Player (custom platformer physics) and the moving-platform helper.
class Player {
  constructor(x, y) { this.reset(x, y); }

  reset(x, y) {
    Object.assign(this, {
      x, y, w: PHY.W, h: PHY.H, vx: 0, vy: 0,
      onGround: false, ride: null, face: 1, coyote: 0, jumpBuf: 0, jumped: false
    });
  }

  moveX(d, solids) {
    if (!d) return;
    this.x += d;
    for (const s of solids) {
      if (overlap(this, s)) this.x = d > 0 ? s.x - this.w : s.x + s.w;
    }
    this.x = Math.max(0, Math.min(PHY.WORLD_W - this.w, this.x));
  }

  moveY(d, solids) {
    this.y += d;
    for (const s of solids) {
      if (!overlap(this, s)) continue;
      if (d > 0) {
        this.y = s.y - this.h;
        this.vy = 0;
        this.onGround = true;
        if (s.isMover) this.ride = s;
      } else {
        this.y = s.y + s.h;
        this.vy = 0;
      }
    }
  }

  // inp = { left, right, jumpHeld, jumpPressed }
  step(inp, solids) {
    const dt = PHY.DT;
    if (this.ride) this.moveX(this.ride.dx, solids);       // carried by moving platform

    const dir = (inp.right ? 1 : 0) - (inp.left ? 1 : 0);
    if (dir) this.face = dir;
    this.vx = dir * PHY.SPEED;

    this.coyote = this.onGround ? 6 : Math.max(0, this.coyote - 1);
    this.jumpBuf = inp.jumpPressed ? 6 : Math.max(0, this.jumpBuf - 1);
    if (this.jumpBuf > 0 && this.coyote > 0) {
      this.vy = -PHY.JUMP;
      this.jumpBuf = 0;
      this.coyote = 0;
      this.jumped = true;
    }
    if (!inp.jumpHeld && this.vy < -220) this.vy = -220;   // short hop when key is released

    this.vy = Math.min(this.vy + PHY.GRAV * dt, PHY.MAXFALL);
    this.moveX(this.vx * dt, solids);
    this.onGround = false;
    this.ride = null;
    this.moveY(this.vy * dt, solids);
  }
}

// Horizontal position of a moving platform at frame f (smooth back-and-forth).
function moverX(m, f) {
  const t = f / 60;
  const p = 0.5 - 0.5 * Math.cos(2 * Math.PI * (t - (m.phase || 0)) / m.period);
  return m.x1 + p * (m.x2 - m.x1);
}
