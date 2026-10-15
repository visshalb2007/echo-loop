// Scripted solutions for every level, run by tests/harness.py.
//
// Each function plays the level from a clean start and returns true when the exit
// is reached. They rely only on tests/bot.js and the deterministic 60 Hz step.
(function () {
  const S = window.__solutions = window.__solutions || {};
  const b = () => window.__bot;

  // 1. First Echo -- leave one echo standing on the single button, then walk out.
  S.level_1 = function () {
    const bot = b();
    bot.restart();
    bot.hold(['right'], () => bot.x() >= 312);   // stand on the button
    bot.echo();
    bot.hold(['right'], () => bot.done() || bot.state() !== 'play');
    return bot.done();
  };

  // 2. Two Locks -- echo 1 holds button A, echo 2 climbs the block and holds button B.
  S.level_2 = function () {
    const bot = b();
    bot.restart();
    // loop 1: echo 1 on button A
    bot.hold(['right'], () => bot.x() >= 212);
    bot.echo();
    // loop 2: echo 2 climbs onto the block and lands on button B
    bot.hold(['right'], () => bot.x() >= 420);
    bot.hold(['right', 'jump'], () => bot.onGround() && bot.x() > 516);
    bot.echo();
    // loop 3: with both doors open, cross the block and reach the exit
    bot.hold(['right'], () => bot.x() >= 420);
    bot.hold(['right', 'jump'], () => bot.onGround() && bot.x() > 516);
    bot.hold(['right'], () => bot.x() > 620);
    bot.hold(['right'], () => bot.done() || bot.state() !== 'play');
    return bot.done();
  };

  // 3. The Beam -- echo 1 walks to the left wall before the laser wakes at 2s and
  //    absorbs the beam; the player then runs to the exit.
  S.level_3 = function () {
    const bot = b();
    bot.restart();
    bot.hold(['left'], () => bot.x() <= 2);
    bot.echo();
    bot.hold(['right'], () => bot.done() || bot.state() !== 'play');
    return bot.done();
  };
})();
