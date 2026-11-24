'use strict';
const assert=require('node:assert/strict');
const test=require('node:test');
const {generatePriority,parseVocabulary,readExamOneCorpus}=require('../scripts/priority_core.cjs');
const fs=require('node:fs');const os=require('node:os');const path=require('node:path');
test('priority chooses exam appearances over mixed raw frequency with its declared weights',()=>{
 const data={'5530考研词汇词频排序表':[
  {'单词':'anchor','词频':40,'真题次数':150,'CEFR等级':'B1'},
  {'单词':'signal','词频':100,'真题次数':2,'CEFR等级':'C1'},
  {'单词':'abundant','词频':1,'真题次数':0,'CEFR等级':'C2'}]};
 const ranked=generatePriority(data);
 assert.equal(ranked.count,3);
 assert.ok(ranked.records.anchor.rank<ranked.records.signal.rank);
 assert.equal(ranked.records.anchor.examCount,150);
 assert.equal(ranked.records.anchor.basis,'真题样本次数+混合考试词频');
 assert.deepEqual(parseVocabulary(data),data['5530考研词汇词频排序表']);
});
test('English I corpus reads passage only, ignoring explanations and answer options',()=>{
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'kaoyan-corpus-'));
 const folder=path.join(base,'data','2024-1');fs.mkdirSync(folder,{recursive:true});
 fs.writeFileSync(path.join(folder,'2024-1.json'),JSON.stringify({year:2024,exam:'英语一',sections:[{groups:[{passage:['Address issues as they appear. Address them promptly.'],questions:[{options:{A:'bogus'},explanation:'bogus'}]}]}]}));
 const corpus=readExamOneCorpus(base);
 assert.equal(corpus.counts.get('address'),2);
 assert.equal(corpus.years.get('address'),1);
 assert.equal(corpus.counts.has('bogus'),false);
 fs.rmSync(base,{recursive:true,force:true});
});
test('full vocabulary builder validates count and produces a standalone JS asset offline',async()=>{
 const base=fs.mkdtempSync(path.join(os.tmpdir(),'kaoyan-builder-'));
 const scriptRoot=path.join(base,'scripts');const sourceRoot=path.join(base,'sources');
 fs.mkdirSync(scriptRoot,{recursive:true});fs.mkdirSync(sourceRoot,{recursive:true});
 fs.mkdirSync(path.join(base,'app','data'),{recursive:true});
 fs.mkdirSync(path.join(base,'data'),{recursive:true});
 fs.writeFileSync(path.join(base,'data','demo-vocabulary.tsv'),'word\tmeaning\texample\texample_zh\nword0\tx\tOriginal sample context.\t原创语境。\n');
 fs.copyFileSync(path.join(__dirname,'..','scripts','priority_core.cjs'),path.join(scriptRoot,'priority_core.cjs'));
 fs.copyFileSync(path.join(__dirname,'..','scripts','prepare-data.cjs'),path.join(scriptRoot,'prepare-data.cjs'));
 fs.writeFileSync(path.join(sourceRoot,'netem_full_list.json'),JSON.stringify({'5530考研词汇词频排序表':Array.from({length:5530},(_,i)=>({'单词':'word'+i,'词频':i+1,'真题次数':i%80,'释义':'释义'+i,'例句':'Original sentence '+i}))}));
 const {spawnSync}=require('node:child_process');
 const res=spawnSync(process.execPath,[path.join(scriptRoot,'prepare-data.cjs'),'--offline','--without-corpus'],{encoding:'utf8',timeout:20000});
 assert.equal(res.status,0,res.stderr);
 const text=fs.readFileSync(path.join(base,'app','data','vocabulary.js'),'utf8');
 assert.match(text,/"count":5530/);assert.match(text,/word5529/);
 assert.match(text,/Original sample context/);
 fs.rmSync(base,{recursive:true,force:true});
});

test('importance rank and raw frequency rank are independent ordering systems',()=>{
 const ranked=generatePriority({'5530考研词汇词频排序表':[
  {'单词':'semantic','词频':15,'真题次数':140},
  {'单词':'the','词频':40000,'真题次数':0},
  {'单词':'address','词频':120,'真题次数':2}
 ]});
 assert.equal(ranked.records.the.frequencyRank,1);
 assert.equal(ranked.records.semantic.rank,1);
 assert.notEqual(ranked.records.the.frequencyRank,ranked.records.the.rank);
});
test('core list contributes to importance, not raw word frequency',()=>{
 const data={'5530考研词汇词频排序表':[
  {'单词':'context','词频':100,'真题次数':10},
  {'单词':'syntax','词频':100,'真题次数':10}
 ]};
 const ranked=generatePriority(data,null,new Set(['syntax']));
 assert.equal(ranked.records.syntax.rank,1);
 assert.equal(ranked.records.syntax.core,true);
 assert.equal(ranked.records.context.frequencyRank,1);
});

test('zero and missing exam counts remain distinct, without redistributing their weights',()=>{
 const rows=[{word:'zero',frequency:100,examCount:0},{word:'missing',frequency:100},{word:'positive',frequency:100,examCount:10}];
 const {records}=generatePriority(rows);
 assert.equal(records.zero.examCount,0);
 assert.equal(records.missing.examCount,null);
 assert.equal(records.zero.score,records.missing.score);
 assert.ok(records.positive.score>records.zero.score);
});
test('core membership preserves case-distinct words and frequency ties stay independent',()=>{
 const {records}=generatePriority([{word:'May',frequency:10},{word:'may',frequency:10}],null,new Set(['May']));
 assert.equal(records.May.core,true);
 assert.equal(records.may.core,false);
 assert.ok(records.May.rank<records.may.rank);
 assert.equal(records.may.frequencyRank,1);
});
