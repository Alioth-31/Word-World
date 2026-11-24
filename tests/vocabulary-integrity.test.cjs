'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');

test('bundled vocabulary preserves independent, complete rankings',()=>{
 const source=fs.readFileSync(path.join(__dirname,'../app/data/vocabulary.js'),'utf8');
 const context={window:{}};
 vm.runInNewContext(source,context,{timeout:10000});
 const words=context.window.WORD_WORLD_VOCAB,meta=context.window.WORD_WORLD_META;
 assert.equal(meta.sample,false);
 assert.equal(meta.count,5530);
 assert.equal(words.length,5530);
 assert.equal(words.filter(w=>w.priority?.core).length,3050);
 assert.equal(new Set(words.map(w=>w.word)).size,words.length);
 const importance=new Set(),frequencyRanks=new Set();
 for(const word of words){
  assert.ok(word.word && word.meaning && word.phonetic,'missing lexical field: '+word.word);
  assert.ok(Number.isFinite(word.frequency) && word.frequency>=0,'invalid source frequency: '+word.word);
  assert.equal(word.frequency,word.priority?.mixedFreq,'source count mismatch: '+word.word);
  const rank=word.priority?.rank,frequencyRank=word.priority?.frequencyRank;
  assert.ok(Number.isInteger(rank) && rank>=1 && rank<=words.length,'invalid importance rank: '+word.word);
  assert.ok(Number.isInteger(frequencyRank) && frequencyRank>=1 && frequencyRank<=words.length,'invalid source frequency rank: '+word.word);
  assert.ok(!importance.has(rank),'duplicate importance rank: '+rank);
  assert.ok(!frequencyRanks.has(frequencyRank),'duplicate source frequency rank: '+frequencyRank);
  importance.add(rank);
  frequencyRanks.add(frequencyRank);
 }
 for(let i=1;i<words.length;i++){
  assert.ok(words[i-1].priority.rank<words[i].priority.rank,'bundled importance order is inconsistent');
 }
 const sorted=[...words].sort((a,b)=>a.priority.frequencyRank-b.priority.frequencyRank);
 for(let i=1;i<sorted.length;i++){
  assert.ok(sorted[i-1].frequency>=sorted[i].frequency,'source frequency order is inconsistent');
 }
 assert.equal(sorted[0].word,'the');
 assert.notEqual(words[0].word,sorted[0].word);
});

test('bundled importance ranking reproduces from its saved evidence and notes',()=>{
 const {generatePriority}=require('../scripts/priority_core.cjs');
 const context={window:{}};
 vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../app/data/vocabulary.js'),'utf8'),context,{timeout:10000});
 const words=context.window.WORD_WORLD_VOCAB,meta=context.window.WORD_WORLD_META;
 assert.equal(meta.rankVersion,2);
 const core=new Set(words.filter(w=>w.priority.core).map(w=>w.word));
 const rows=words.map(w=>({word:w.word,frequency:w.frequency,examCount:w.priority.examCount,cefr:w.priority.cefr,academic:w.priority.academic}));
 const years=meta.corpusYears||[];
 const corpus=years.length?{availableYears:years,counts:new Map(words.map(w=>[w.word.toLowerCase(),w.priority.exam1Count])),years:new Map(words.map(w=>[w.word.toLowerCase(),w.priority.exam1Years]))}:null;
 const {records}=generatePriority(rows,corpus,core);
 for(const w of words){
   assert.equal(records[w.word].rank,w.priority.rank,'importance rank mismatch: '+w.word);
   assert.equal(records[w.word].score,w.priority.score,'importance score mismatch: '+w.word);
   assert.equal(records[w.word].frequencyRank,w.priority.frequencyRank,'frequency rank mismatch: '+w.word);
 }
 const notes=JSON.parse(fs.readFileSync(path.join(__dirname,'../data/sense-notes.json'),'utf8'));
 for(const [word,note] of Object.entries(notes)){
  assert.ok(words.find(w=>w.word===word)?.extraMeaning.includes(note.meaning));
  assert.match(note.reference,/^https:\/\/dictionary\.cambridge\.org\//);
 }
 assert.equal(meta.senseNotes,Object.keys(notes).length);
});
