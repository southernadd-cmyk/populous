const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.join(__dirname, '..');
const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
const game = fs.readFileSync(path.join(root, 'src/main.js'), 'utf8');
const css = fs.readFileSync(path.join(root, 'style.css'), 'utf8');

test('every field guide tab has a corresponding labelled panel', () => {
  const tabs = [...html.matchAll(/<button id="tab-([a-z]+)" role="tab" aria-controls="panel-([a-z]+)"[^>]+data-guide-tab="([a-z]+)"/g)];
  assert.equal(tabs.length, 7);
  assert.deepEqual(tabs.map(([, id]) => id), ['overview', 'land', 'followers', 'stones', 'festivals', 'spells', 'controls']);
  for (const [, id, target, dataId] of tabs) {
    assert.equal(target, id);
    assert.equal(dataId, id);
    assert.match(html, new RegExp(`<section id="panel-${id}" role="tabpanel" aria-labelledby="tab-${id}"`));
  }
});

test('the guide explains every command and spell offered by the game', () => {
  for (const [kind, attribute] of [['commands', 'command'], ['spells', 'spell']]) {
    const definition = game.match(new RegExp(`const ${kind}=\\[(.*?)\\];`, 's'));
    assert.ok(definition, `missing ${kind} definition`);
    const inGame = [...definition[1].matchAll(/\['([^']+)',/g)].map(([, id]) => id);
    const inGuide = [...html.matchAll(new RegExp(`<article data-${attribute}="([a-z]+)"`, 'g'))].map(([, id]) => id);
    assert.deepEqual(inGuide, inGame);
  }
});


test('inspect, toast and terrain status overlays have separate screen lanes', () => {
  assert.match(css, /#sitePanel\{[^}]*top:72px;bottom:auto/);
  assert.match(css, /#toast\{[^}]*bottom:62px/);
  assert.match(css, /#landPreview\{[^}]*bottom:18px/);
});


test('opening guide is clearly branded as an alpha playtest', () => {
  assert.match(html, /ALPHA BUILD/);
  assert.match(html, /EARLY PLAYTEST · FIELD GUIDE/);
  assert.match(html, /PLAY ALPHA/);
  assert.match(html, /alpha build/);
  assert.match(css, /\.alpha-badge/);
});
