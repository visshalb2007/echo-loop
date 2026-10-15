// Game configuration: 960x540 canvas that scales to fit any window.
Sfx.loadPrefs(); // restore the persisted mute preference before anything plays

new Phaser.Game({
  type: Phaser.AUTO,
  parent: 'game',
  width: 960,
  height: 540,
  backgroundColor: '#0b1020',
  scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH },
  scene: [MenuScene, GameScene, WinScene]
});
