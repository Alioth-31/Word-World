'use strict';
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const {createHash}=require('node:crypto');
const {countPaper,buildReport}=require('./exam1-frequency-core.cjs');

const root=path.resolve(__dirname,'..');
const manifest=JSON.parse(fs.readFileSync(path.join(root,'data/exam1-source.json'),'utf8'));
const corpusDir=path.resolve(process.argv[2]||path.join(root,'sources/structured-kaoyan-english'));
const out=path.join(root,'data/exam1-frequency.json');
const context={window:{}};
vm.runInNewContext(fs.readFileSync(path.join(root,'app/data/vocabulary.js'),'utf8'),context,{timeout:10000});
const words=context.window.WORD_WORLD_VOCAB.map(w=>w.word);
if(words.length!==5530)throw Error('Expected full 5530-word vocabulary');
const yearly=manifest.papers.map(({year,blob})=>{
  const name=year+'-1';
  const buffer=fs.readFileSync(path.join(corpusDir,'data',name,name+'.json'));
  const actual=createHash('sha1').update('blob '+buffer.length+'\0').update(buffer).digest('hex');
  if(actual!==blob)throw Error('Source revision mismatch: '+name+' (use the pinned corpus revision)');
  return countPaper(JSON.parse(buffer.toString('utf8')),year,words);
});
const report=buildReport(yearly,words,manifest);
fs.writeFileSync(out,JSON.stringify(report)+'\n');
console.log('English I frequency:',report.scope.years.length,'years,',report.totals.tokens,'tokens;',report.words.filter(w=>w.estimatedRank!==null).length,'observed entries');
console.log(out);
