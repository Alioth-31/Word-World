'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {project,render}=require('../scripts/build-exam1-app-data.cjs');
const root=path.resolve(__dirname,'..');
const report=JSON.parse(fs.readFileSync(path.join(root,'data/exam1-frequency.json'),'utf8'));
test('app frequency asset is reproducible and covers the exact vocabulary IDs',()=>{
 const generated=render(report);
 assert.equal(fs.readFileSync(path.join(root,'app/data/exam1.js'),'utf8'),generated);
 const ctx={window:{}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'app/data/vocabulary.js'),'utf8'),ctx);
 if(!ctx.window.WORD_WORLD_META.sample){
  const keys=new Set(ctx.window.WORD_WORLD_VOCAB.map(w=>w.word));
  assert.equal(keys.size,5530);
  assert.ok(project(report).rows.every(r=>keys.has(r[0])));
 }
});
test('zero observations have no rank and case-distinct words are preserved',()=>{
 const rows=project(report).rows;
 assert.ok(rows.some(r=>r[4]===null));
 assert.ok(rows.every(r=>(r[1]+r[2]===0)===(r[4]===null)));
 assert.ok(rows.some(r=>r[0]==='May')&&rows.some(r=>r[0]==='may'));
});
