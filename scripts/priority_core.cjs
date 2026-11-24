'use strict';
const fs = require('fs');
const path = require('path');

function number(value){if(value==null||String(value).trim()==='')return null;const n=Number(String(value).replace(/,/g,''));return Number.isFinite(n)&&n>=0?n:null;}

function pick(r,...keys){for(const k of keys)if(Object.prototype.hasOwnProperty.call(r,k))return r[k];}

function parseVocabulary(input) {
  if (Array.isArray(input)) return input;
  if (!input || typeof input !== 'object') throw new Error('Invalid dictionary JSON');
  const tables=Object.values(input).filter(Array.isArray);
  if(Array.isArray(input['5530考研词汇词频排序表'])) return input['5530考研词汇词频排序表'];
  if(tables.length===1)return tables[0];
  throw new Error('Cannot locate main vocabulary array in source data');
}

function readExamOneCorpus(corpusDir) {
  if (!corpusDir || !fs.existsSync(corpusDir)) return null;
  const base = path.join(corpusDir, 'data');
  if (!fs.existsSync(base)) return null;
  const counts = new Map();
  const years = new Map();
  const availableYears = [];
  for (const folder of fs.readdirSync(base).sort()) {
    const match = /^(20\d\d)-1$/.exec(folder);
    if (!match || Number(match[1]) < 2010 || Number(match[1]) > 2025) continue;
    const filename = path.join(base, folder, folder + '.json');
    if (!fs.existsSync(filename)) continue;
    let paper;
    try { paper = JSON.parse(fs.readFileSync(filename, 'utf8')); }
    catch (_) { continue; }
    if (paper.exam !== '英语一' || !Array.isArray(paper.sections)) continue;
    const phrases = [];
    for (const section of paper.sections) {
      for (const group of section.groups || []) {
        if (typeof group.passage === 'string') phrases.push(group.passage);
        else if (Array.isArray(group.passage)) phrases.push(...group.passage.filter(x=>typeof x === 'string'));
      }
    }
    if (!phrases.length) continue;
    availableYears.push(Number(match[1]));
    const observed = new Set();
    for (const phrase of [...new Set(phrases)]) {
      // Passage text only: question explanations, answer options and translations are excluded.
      const tokens = phrase.match(/[A-Za-z]+(?:['’-][A-Za-z]+)*/g) || [];
      for (const token of tokens) {
        const word = token.toLowerCase();
        counts.set(word, (counts.get(word) || 0) + 1);
        observed.add(word);
      }
    }
    for (const word of observed) years.set(word, (years.get(word) || 0) + 1);
  }
  return availableYears.length ? { counts, years, availableYears } : null;
}

function generatePriority(input, corpus=null, coreWords=null){
  const byWord=new Map();
  for(const row of parseVocabulary(input)){
    const word=String(pick(row,'单词','word')??'').trim();
    if(!word||byWord.has(word))continue;
    const examCount=number(pick(row,'真题次数','exam_count','examCount'));
    const mixedFreq=number(pick(row,'词频','frequency','freq'));
    if(mixedFreq===null)throw new Error('Invalid source frequency: '+word);
    const cefr=String(pick(row,'CEFR等级','cefr')??'').trim().toUpperCase();
    const academic=['1','true','yes','是'].includes(String(pick(row,'学术词汇','academic')??'').toLowerCase().trim());
    byWord.set(word,{word,examCount,mixedFreq,cefr,academic,core:coreWords instanceof Set&&coreWords.has(word),corpusCount:corpus?(corpus.counts.get(word.toLowerCase())||0):null,corpusYears:corpus?(corpus.years.get(word.toLowerCase())||0):null});
  }
  const records=[...byWord.values()];
  if(!records.length)throw new Error('Vocabulary source contains no words');
  const maximum=field=>Math.max(1,...records.map(r=>r[field]??0));
  const scale=(v,max)=>Math.log1p(v??0)/Math.log1p(max);
  const examMax=maximum('examCount'),freqMax=maximum('mixedFreq'),corpusMax=maximum('corpusCount');
  const difficulty={A1:0,A2:.25,B1:.5,B2:.75,C1:1,C2:1};
  const years=corpus?.availableYears||[];
  for(const r of records){
    const e=scale(r.examCount,examMax),f=scale(r.mixedFreq,freqMax),d=difficulty[r.cefr]??.5,a=+r.academic,c=+r.core;
    // Missing exam evidence receives no contribution, rather than redistributing its weight.
    r.score=years.length?100*(.30*scale(r.corpusCount,corpusMax)+.15*r.corpusYears/years.length+.30*e+.12*f+.08*c+.04*d+.01*a):100*(.56*e+.26*f+.10*c+.06*d+.02*a);
    r.basis=years.length?'英语一正文表面词形计数+来源指标':r.examCount===null?'真题次数缺失；仅按可用来源指标贡献评分':'真题样本次数+混合考试词频';
  }
  const compareWord=(a,b)=>a.word.localeCompare(b.word,'en');
  [...records].sort((a,b)=>b.mixedFreq-a.mixedFreq||compareWord(a,b)).forEach((r,i)=>r.frequencyRank=i+1);
  records.sort((a,b)=>b.score-a.score||(b.examCount??0)-(a.examCount??0)||b.mixedFreq-a.mixedFreq||compareWord(a,b));
  const ranked=Object.create(null),counts={P0:0,P1:0,P2:0,P3:0},n=records.length;
  records.forEach((r,i)=>{
    const fraction=i/n,level=fraction<.2?'P0':fraction<.5?'P1':fraction<.8?'P2':'P3';counts[level]++;
    ranked[r.word]={rank:i+1,frequencyRank:r.frequencyRank,core:r.core,level,score:Math.round(r.score*100)/100,examCount:r.examCount,mixedFreq:r.mixedFreq,cefr:r.cefr||null,academic:r.academic,exam1Count:r.corpusCount,exam1Years:r.corpusYears,basis:r.basis};
  });
  return {count:n,counts,records:ranked,source:'exam-data/NETEMVocabulary',description:'真题次数为2005–2023年考研真题词表统计；混合词频为多类考试词形还原统计，非英语一专属。',corpusYears:years,method:years.length?'v2: 英语一正文表面词形计数30%、年份覆盖15%、来源真题次数30%、混合词频12%、核心表8%、CEFR 4%、学术词2项中的1%。':'v2: 来源真题次数56%、混合词频26%、核心表10%、CEFR 6%、学术词2%；计数按全表最大值作对数归一化；缺失真题次数不贡献，未知CEFR取中性0.5。'};
}
module.exports = { generatePriority, parseVocabulary, readExamOneCorpus };
