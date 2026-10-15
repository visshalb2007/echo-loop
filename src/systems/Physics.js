// Shared constants and a tiny AABB helper. All gameplay runs on a fixed 60 FPS step,
// so every loop plays out exactly the same way.
const PHY = {
  W: 24, H: 32,            // player / ghost size
  GRAV: 1900,              // px/s^2
  SPEED: 230,              // px/s
  JUMP: 640,               // px/s  (max jump height is about 108 px)
  MAXFALL: 900,
  DT: 1 / 60,
  ROUND_FRAMES: 720,       // 12 seconds per loop
  WORLD_W: 960
};

function overlap(a, b) {
  return a.x < b.x + b.w && a.x + a.w > b.x && a.y < b.y + b.h && a.y + a.h > b.y;
}
