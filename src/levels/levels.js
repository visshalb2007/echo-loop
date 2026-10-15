// All levels are plain data, so a new level needs no new code.
// platforms: [x, y, w, h]      buttons: y is the floor the button sits on
// doors open only while ALL their buttons are pressed (by you or by an echo)
// lasers: beam shoots right from (x, y) and switches on after `on` seconds;
//         it kills you, but stops at the first echo it touches
// movers: platforms that glide between x1 and x2
const LEVELS = [
  {
    name: 'First Echo',
    hint: 'Stand on the button, then press R. Your run becomes an echo that holds it for you.',
    start: [100, 468], exit: { x: 850, y: 436, w: 34, h: 64 }, maxGhosts: 3,
    platforms: [[0, 500, 960, 40]],
    buttons: [{ id: 'a', x: 300, y: 500, w: 48 }],
    doors: [{ x: 620, y: 330, w: 20, h: 170, btns: ['a'] }]
  },
  {
    name: 'Two Locks',
    hint: 'Each door has its own button. Build the echoes one at a time.',
    start: [60, 468], exit: { x: 850, y: 436, w: 34, h: 64 }, maxGhosts: 3,
    platforms: [[0, 500, 960, 40], [520, 430, 110, 70]],
    buttons: [{ id: 'a', x: 200, y: 500, w: 48 }, { id: 'b', x: 540, y: 430, w: 48 }],
    doors: [
      { x: 400, y: 330, w: 20, h: 170, btns: ['a'] },
      { x: 720, y: 330, w: 20, h: 170, btns: ['b'] }
    ]
  },
  {
    name: 'The Beam',
    hint: 'The laser wakes at 2s and kills the first thing it touches. Echoes absorb it. Walk to the left wall and press R before 2s.',
    start: [140, 468], exit: { x: 850, y: 436, w: 34, h: 64 }, maxGhosts: 3,
    platforms: [[0, 500, 960, 40]],
    lasers: [{ x: 0, y: 484, on: 2 }]
  },
  {
    name: 'Moving Ground',
    hint: 'Ride the platform across the pit. Two buttons, two echoes. One button is up on the ledge.',
    start: [60, 468], exit: { x: 880, y: 436, w: 34, h: 64 }, maxGhosts: 3,
    platforms: [[0, 500, 290, 40], [610, 500, 350, 40], [660, 420, 100, 14]],
    movers: [{ x1: 290, x2: 520, y: 500, w: 90, h: 14, period: 5, phase: 1.25 }],
    buttons: [{ id: 'a', x: 640, y: 500, w: 48 }, { id: 'b', x: 680, y: 420, w: 48 }],
    doors: [{ x: 830, y: 330, w: 20, h: 170, btns: ['a', 'b'] }]
  },
  {
    name: 'Stepping Echo', solidEchoes: true,
    hint: 'Echoes turn solid once they stop. Leave one standing on the block, then stand on its head to reach the ledge.',
    start: [60, 468], exit: { x: 880, y: 246, w: 34, h: 64 }, maxGhosts: 3,
    platforms: [[0, 500, 960, 40], [660, 436, 100, 64], [790, 310, 170, 14]]
  },
  {
    name: 'Final Loop',
    hint: 'Shield the beam, hold the button, then run for the exit. Mind the spikes.',
    start: [140, 468], exit: { x: 860, y: 436, w: 34, h: 64 }, maxGhosts: 3,
    platforms: [[0, 500, 960, 40]],
    lasers: [{ x: 0, y: 484, on: 2 }],
    spikes: [{ x: 540, w: 42 }],
    buttons: [{ id: 'a', x: 400, y: 500, w: 48 }],
    doors: [{ x: 700, y: 330, w: 20, h: 170, btns: ['a'] }]
  }
];
