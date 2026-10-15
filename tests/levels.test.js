#!/usr/bin/env node
// Validates src/levels/levels.js against the level schema. Runs under plain node,
// no browser required (and is the check the CI workflow runs).
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const file = path.join(__dirname, '..', 'src', 'levels', 'levels.js');
const src = fs.readFileSync(file, 'utf8');
const LEVELS = vm.runInNewContext(src + '\n;LEVELS;', {});

const problems = [];
const isNum = v => typeof v === 'number' && isFinite(v);
const isStr = v => typeof v === 'string' && v.length > 0;
const isRect = r => r && isNum(r.x) && isNum(r.y) && isNum(r.w) && isNum(r.h);

if (!Array.isArray(LEVELS) || LEVELS.length === 0) problems.push('LEVELS must be a non-empty array');

(LEVELS || []).forEach((L, i) => {
  const at = `level ${i + 1}`;
  if (!isStr(L.name)) problems.push(`${at}: name must be a non-empty string`);
  if (!isStr(L.hint)) problems.push(`${at}: hint must be a non-empty string`);
  if (!Array.isArray(L.start) || L.start.length !== 2 || !L.start.every(isNum)) problems.push(`${at}: start must be [x, y]`);
  if (!isRect(L.exit)) problems.push(`${at}: exit must be {x,y,w,h}`);
  if (!isNum(L.maxGhosts)) problems.push(`${at}: maxGhosts must be a number`);
  if (!Array.isArray(L.platforms) || L.platforms.length === 0) problems.push(`${at}: platforms required`);
  (L.platforms || []).forEach((p, j) => {
    if (!Array.isArray(p) || p.length !== 4 || !p.every(isNum)) problems.push(`${at}: platform ${j} must be [x,y,w,h]`);
  });

  const ids = new Set();
  (L.buttons || []).forEach((b, j) => {
    if (!isStr(b.id)) problems.push(`${at}: button ${j} needs an id`);
    else if (ids.has(b.id)) problems.push(`${at}: duplicate button id '${b.id}'`);
    else ids.add(b.id);
    if (!isNum(b.x) || !isNum(b.y) || !isNum(b.w)) problems.push(`${at}: button ${b.id} needs numeric x,y,w`);
  });

  (L.doors || []).forEach((d, j) => {
    if (!isRect(d)) problems.push(`${at}: door ${j} must be {x,y,w,h}`);
    if (!Array.isArray(d.btns) || d.btns.length === 0) problems.push(`${at}: door ${j} needs a non-empty btns list`);
    (d.btns || []).forEach(id => {
      if (!ids.has(id)) problems.push(`${at}: door ${j} references unknown button '${id}'`);
    });
  });

  (L.movers || []).forEach((m, j) => {
    ['x1', 'x2', 'y', 'w', 'h', 'period'].forEach(k => {
      if (!isNum(m[k])) problems.push(`${at}: mover ${j} needs numeric ${k}`);
    });
  });

  (L.lasers || []).forEach((l, j) => {
    ['x', 'y', 'on'].forEach(k => {
      if (!isNum(l[k])) problems.push(`${at}: laser ${j} needs numeric ${k}`);
    });
  });

  (L.spikes || []).forEach((s, j) => {
    if (!isNum(s.x) || !isNum(s.w)) problems.push(`${at}: spike ${j} needs numeric x and w`);
  });

  if (L.solidEchoes !== undefined && typeof L.solidEchoes !== 'boolean') {
    problems.push(`${at}: solidEchoes must be a boolean when present`);
  }
});

if (problems.length) {
  console.error('Level schema errors:');
  for (const p of problems) console.error('  - ' + p);
  process.exit(1);
}
console.log(`OK: ${LEVELS.length} levels valid.`);
