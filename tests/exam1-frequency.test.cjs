'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {countPaper,buildReport}=require('../scripts/exam1-frequency-core.cjs');
const root=path.join(__dirname,'..');

function fixture(){
 const group=(type,text)=>({type,passage:[text],questions:[{explanation:'bogus bogus',options:{A:'bogus'}}]});
 return {year:2022,exam:'英语一',sections:[
  {title:'Section I Use of English',groups:[group('cloze','The studies {{1}} study. according {{2}} to according to.')]},
  {title:'Section II Reading Comprehension — Part A',groups:[
   group('reading','He went running. The men studied.'),
   group('reading','May may march March.'),
   group('reading','Axes axes.'),
   group('reading','The the.') ]},
  {title:'Section II Reading Comprehension — Part B',groups:[group('gap_fill','bogus bogus')]},
  {title:'Section II Reading Comprehension — Part C',groups:[group('translation','<u>The</u> book. Book.')]},
  {title:'Section III Writing — Part A',groups:[group('writing','bogus bogus')]}
 ]};
}
const words=['the','studies','study','according to','according','to','he','go','run','man','May','may','March','march','ax','axe','book','bogus'];

test('English I count uses comparable passage sections and separates exact forms from unique inflections',()=>{
 const result=countPaper(fixture(),2022,words);
 const count=w=>result.counts[w]||[0,0];
 assert.deepEqual(count('the'),[5,0]);
 assert.deepEqual(count('studies'),[1,0]);
 assert.deepEqual(count('study'),[1,1]);
 assert.deepEqual(count('go'),[0,1]);
 assert.deepEqual(count('run'),[0,1]);
 assert.deepEqual(count('man'),[0,1]);
 assert.deepEqual(count('May'),[1,0]);
 assert.deepEqual(count('may'),[1,0]);
 assert.deepEqual(count('March'),[1,0]);
 assert.deepEqual(count('march'),[1,0]);
 assert.deepEqual(count('book'),[2,0]);
 assert.deepEqual(count('according to'),[1,0]);
 assert.deepEqual(count('ax'),[0,0]);
 assert.deepEqual(count('axe'),[0,0]);
 assert.deepEqual(count('bogus'),[0,0]);
 assert.equal(result.totals.unmatched,2);
 assert.equal(result.totals.phrases,1);
 assert.equal(result.totals.tokens,result.totals.exact+result.totals.inferred+result.totals.unmatched);
});
test('English I count rejects incomplete or wrong papers',()=>{
 const p=fixture();p.sections[1].groups.pop();
 assert.throws(()=>countPaper(p,2022,words),/Incomplete/);
 assert.throws(()=>countPaper(fixture(),2023,words),/Invalid English I paper/);
});
test('both frequency rankings preserve ties and unobserved entries',()=>{
 const y=countPaper(fixture(),2022,words);
 const r=buildReport([y],words,{papers:[{year:2022}]});
 const lookup=word=>r.words.find(w=>w.word===word);
 assert.equal(lookup('the').exactRank,1);
 assert.equal(lookup('May').exactRank,lookup('may').exactRank);
 assert.equal(lookup('go').exactRank,null);
 assert.ok(lookup('go').estimatedRank>0);
 assert.equal(lookup('bogus').estimatedRank,null);
 assert.deepEqual(lookup('study').byYear,{'2022':[1,1]});
 assert.throws(()=>buildReport([y],words,{papers:[{year:2021},{year:2022}]}),/Source year coverage mismatch/);
});
test('bundled English I statistics cover exactly the current vocabulary and reconcile annual counts',()=>{
 const report=JSON.parse(fs.readFileSync(path.join(root,'data/exam1-frequency.json'),'utf8'));
 const source=JSON.parse(fs.readFileSync(path.join(root,'data/exam1-source.json'),'utf8'));
 assert.deepEqual(report.source,source);
 const context={window:{}};
 vm.runInNewContext(fs.readFileSync(path.join(root,'app/data/vocabulary.js'),'utf8'),context,{timeout:10000});
 assert.deepEqual(report.words.map(w=>w.word).sort(),Array.from(context.window.WORD_WORLD_VOCAB,w=>w.word).sort());
 assert.deepEqual(report.scope.years,Array.from({length:16},(_,i)=>2010+i));
 assert.equal(report.words.length,5530);
 const t=report.totals;
 assert.equal(t.tokens,38035);
 assert.equal(t.tokens,t.exact+t.inferred+t.unmatched);
 assert.equal(report.words.reduce((s,w)=>s+w.exact,0),t.exact+t.phrases);
 assert.equal(report.words.reduce((s,w)=>s+w.inferred,0),t.inferred);
 for(const w of report.words){
  const a=Object.values(w.byYear);
  assert.equal(w.exact,a.reduce((s,v)=>s+v[0],0));
  assert.equal(w.inferred,a.reduce((s,v)=>s+v[1],0));
  assert.equal(w.years,a.length);
  assert.equal(w.exactRank===null,w.exact===0);
  assert.equal(w.estimatedRank===null,w.exact+w.inferred===0);
  assert.ok(Object.keys(w.byYear).every(y=>report.scope.years.includes(Number(y))));
 }
 for(const [field,value] of [['exactRank',w=>w.exact],['estimatedRank',w=>w.exact+w.inferred]]){
  const ordered=report.words.filter(w=>value(w)>0).sort((a,b)=>value(b)-value(a)||a.word.localeCompare(b.word,'en'));
  let rank=0,last=null;
  for(const [i,w] of ordered.entries()){if(value(w)!==last){rank=i+1;last=value(w)}assert.equal(w[field],rank)}
 }
 for(const year of report.annual){
  assert.equal(year.tokens,year.exact+year.inferred+year.unmatched);
  assert.equal(year.tokens,Object.values(year.bySection).reduce((a,b)=>a+b,0));
  assert.equal(year.exact+year.phrases,report.words.reduce((s,w)=>s+(w.byYear[year.year]?.[0]||0),0));
  assert.equal(year.inferred,report.words.reduce((s,w)=>s+(w.byYear[year.year]?.[1]||0),0));
 }
});
