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

  // 4. Moving Ground -- the moving platform is only flush with the left edge at
  //    ~frame 78 and with the right edge at ~frame 222, so we wait, ride, and step off.
  function crossLevel4(bot) {
    bot.hold(['right'], () => bot.x() >= 262);   // stop at the ledge edge
    bot.hold([], () => bot.frame() >= 78);        // wait for the platform to arrive
    bot.hold(['right'], 10);                      // step on
    bot.hold([], () => bot.frame() >= 222);       // ride across
    bot.hold(['right'], () => bot.x() >= 618);    // step off on the far side
  }

  S.level_4 = function () {
    const bot = b();
    bot.restart();
    // loop 1: echo A stands on the floor button
    crossLevel4(bot);
    bot.hold(['right'], () => bot.x() >= 652);
    bot.echo();
    // loop 2: echo B climbs onto the ledge and stands on the high button
    crossLevel4(bot);
    bot.hold(['left'], () => bot.x() <= 604);
    bot.hold(['right', 'jump'], () => bot.onGround() && bot.x() > 660);
    bot.hold(['right'], () => bot.x() >= 700);
    bot.echo();
    // loop 3: both buttons held, ride across and run to the exit
    crossLevel4(bot);
    bot.hold(['right'], () => bot.done() || bot.state() !== 'play');
    return bot.done();
  };

  // 5. Stepping Echo -- echo A stands on the block and turns solid; the player climbs
  //    onto its head and leaps from there to the high ledge (unreachable otherwise).
  S.level_5 = function () {
    const bot = b();
    const climb = () => {
      bot.hold(['right'], () => bot.x() >= 636);
      bot.hold(['right', 'jump'], () => bot.onGround() && bot.x() > 660);
    };
    bot.restart();
    // loop 1: echo A stands on the block near x~717
    climb();
    bot.hold(['left'], () => bot.x() <= 718);
    bot.echo();
    // loop 2: wait for echo A to settle, climb onto its head, then leap to the ledge
    bot.hold([], () => bot.frame() >= 200);
    climb();
    bot.hold(['right', 'jump'], () => bot.onGround() && bot.y() < 330);
    bot.hold(['right'], () => bot.done() || bot.state() !== 'play');
    return bot.done();
  };

  // 6. Echo Tower -- the ledge is too high for a single echo, so echo B is stacked on
  //    echo A to raise the launch pad; the player jumps straight up and lands on top.
  S.level_6 = function () {
    const bot = b();
    const climb = () => {
      bot.hold(['right'], () => bot.x() >= 636);
      bot.hold(['right', 'jump'], () => bot.onGround() && bot.x() > 660);
    };
    bot.restart();
    // loop 1: echo A stands on the block
    climb();
    bot.hold(['left'], () => bot.x() <= 716);
    bot.echo();
    // loop 2: wait for A to settle, climb onto A, drop echo B on top of A
    bot.hold([], () => bot.frame() >= 170);
    climb();
    bot.hold(['right'], () => bot.x() >= 714);
    bot.echo();
    // loop 3: wait for both to settle, then stack up: block -> tower top -> ledge
    bot.hold([], () => bot.frame() >= 400);
    climb();
    bot.hold(['left'], () => bot.x() <= 690);
    bot.hold(['jump'], 14);
    bot.hold(['right'], 6);
    bot.hold([], () => bot.onGround() && bot.y() < 360);
    bot.hold(['right', 'jump'], () => bot.onGround() && bot.y() < 270);
    bot.hold(['right'], () => bot.done() || bot.state() !== 'play');
    return bot.done();
  };
})();
