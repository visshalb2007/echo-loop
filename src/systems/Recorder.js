// Records the player's position every frame. Replaying the saved frames makes an "echo".
// After the recording ends, the echo keeps standing at its last position.
class Recorder {
  constructor() { this.frames = []; }

  record(p) { this.frames.push([p.x, p.y, p.face]); }

  static sample(frames, f) {
    return frames[Math.min(f, frames.length - 1)];
  }
}
