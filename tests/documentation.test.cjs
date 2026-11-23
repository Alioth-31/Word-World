'use strict';

const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '..');
const pages = [
  ['README.md', 'README.en.md'],
  ['PRIVACY.md', 'PRIVACY.en.md'],
  ['docs/DATA.md', 'docs/DATA.en.md']
];

function localTargets(markdown) {
  const targets = [];
  for (const match of markdown.matchAll(/!?\[[^\]]*\]\(([^\s)]+)(?:\s+"[^"]*")?\)/g)) targets.push(match[1]);
  for (const match of markdown.matchAll(/<(?:img|a)\s+[^>]*?(?:src|href)="([^"]+)"[^>]*>/g)) targets.push(match[1]);
  return targets.filter(x => !/^(?:https?:|mailto:|data:|#)/.test(x));
}

test('documentation offers separate Chinese and English pages', () => {
  for (const [zh, en] of pages) {
    const zhText = fs.readFileSync(path.join(root, zh), 'utf8');
    const enText = fs.readFileSync(path.join(root, en), 'utf8');
    assert.match(zhText, /\[English\]\([^)]*\.en\.md\)/, zh);
    assert.match(enText, /\[简体中文\]\([^)]*\.md\)/, en);
    assert.ok(!/\n## English\s*\n/.test(zhText), `${zh} still stacks both language sections`);
    assert.ok(!/\n## 简体中文\s*\n/.test(enText), `${en} still stacks both language sections`);
  }
});

test('local documentation links and screenshot references resolve', () => {
  for (const files of pages) for (const relative of files) {
    const file = path.join(root, relative);
    const markdown = fs.readFileSync(file, 'utf8');
    for (const link of localTargets(markdown)) {
      const resolved = path.resolve(path.dirname(file), decodeURIComponent(link.split('#')[0]));
      assert.ok(resolved.startsWith(root + path.sep), `${relative}: path escapes repository: ${link}`);
      assert.ok(fs.existsSync(resolved), `${relative}: missing target ${link}`);
      if (/\.(png|svg|jpg)$/i.test(resolved)) assert.ok(fs.statSync(resolved).size > 100, `empty image: ${link}`);
    }
  }
});

test('README flowcharts use Mermaid fence and remain language-specific', () => {
  for (const relative of pages[0]) {
    const markdown = fs.readFileSync(path.join(root, relative), 'utf8');
    assert.match(markdown, /```mermaid\nflowchart LR\n[\s\S]*?\n```/);
    assert.match(markdown, /docs\/images\/today\.png/);
    assert.match(markdown, /docs\/images\/study\.png/);
  }
});
