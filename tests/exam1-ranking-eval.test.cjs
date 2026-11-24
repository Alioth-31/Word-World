'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {evaluate}=require('../scripts/exam1-ranking-eval.cjs');
const root=path.resolve(__dirname,'..');
const report=JSON.parse(fs.readFileSync(path.join(root,'data/exam1-frequency.json'),'utf8'));
const saved=JSON.parse(fs.readFileSync(path.join(root,'data/exam1-ranking-eval.json'),'utf8'));
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'app/data/vocabulary.js'),'utf8'),context,{timeout:10000});
const vocab=context.window.WORD_WORLD_VOCAB;

test('ranking experiment reproduces the committed result',()=>{
 const result=evaluate(report,vocab);
 assert.equal(JSON.stringify(result),JSON.stringify(saved));
 assert.deepEqual(result.validation.train,[2010,2017]);
 assert.deepEqual(result.validation.test,[2018,2021]);
 assert.deepEqual(result.holdout.train,[2010,2021]);
 assert.deepEqual(result.holdout.test,[2022,2025]);
 assert.ok(result.models[result.selected].temporal);
 for(const model of ['mixed','v2'])assert.equal(result.models[model].temporal,false);
});
test('changing holdout counts does not change validation selection',()=>{
 const changed={...report,words:report.words.map(w=>({...w,byYear:Object.fromEntries(Object.entries(w.byYear).map(([y,[e,i]])=>[y,Number(y)>=2022?[e*2+1,i*3]:[e,i]]))}))};
 const result=evaluate(changed,vocab);
 assert.equal(JSON.stringify(result.validation),JSON.stringify(saved.validation));
 assert.equal(JSON.stringify(result.selection),JSON.stringify(saved.selection));
 assert.equal(result.selected,saved.selected);
});
test('retrospective ranks cannot influence temporal candidates',()=>{
 const changed=Array.from(vocab,w=>({...w,priority:{...w.priority,frequencyRank:5531-w.priority.frequencyRank,rank:5531-w.priority.rank}}));
 const result=evaluate(report,changed);
 assert.equal(JSON.stringify(result.selection),JSON.stringify(saved.selection));
 for(const period of ['validation','holdout'])for(const group of Object.keys(saved[period].groups))for(const target of ['exact','estimated']){
  const scores=result[period].groups[group].outcomes[target].scores;
  const baseline=saved[period].groups[group].outcomes[target].scores;
  for(const [name,model] of Object.entries(saved.models))if(model.temporal)assert.equal(JSON.stringify(scores[name]),JSON.stringify(baseline[name]));
 }
});
test('coverage stays within bounds and is monotone with study budget',()=>{
 for(const period of ['validation','holdout'])for(const group of Object.values(saved[period].groups))for(const outcome of Object.values(group.outcomes))for(const rows of Object.values(outcome.scores)){
  let tokens=0,types=0;
  for(const row of rows){
   assert.ok(row.tokens>=tokens&&row.tokens<=outcome.total);
   assert.ok(row.distinct>=types&&row.distinct<=outcome.types);
   assert.equal(row.tokenCoverage,row.tokens/outcome.total);
   assert.equal(row.typeCoverage,row.distinct/outcome.types);
   tokens=row.tokens;types=row.distinct;
  }
 }
});
