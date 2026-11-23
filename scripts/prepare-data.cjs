'use strict';
const fs = require('fs');
const path = require('path');
const https = require('https');
const {generatePriority, readExamOneCorpus, parseVocabulary} = require('./priority_core.cjs');
const root=path.resolve(__dirname,'..');
const sources=path.join(root,'sources');
const output=path.join(root,'app','data','vocabulary.js');
const isOffline=process.argv.includes('--offline');
const withoutCorpus=process.argv.includes('--without-corpus');
const vocabularyPath=path.join(sources,'netem_full_list.json');
const cetPath=path.join(sources,'cet_full_list.json');
const corePath=path.join(sources,'netem_core.json');
const corpusDir=path.join(sources,'structured-kaoyan-english');
const corpusRoot=path.join(corpusDir,'data');
const examUrl='https://raw.githubusercontent.com/exam-data/NETEMVocabulary/master/netem_full_list.json';
const cetUrl='https://raw.githubusercontent.com/exam-data/CETVocabulary/main/cet_full_list.json';
const coreUrl='https://raw.githubusercontent.com/exam-data/NETEMVocabulary/master/data/core/netem_core.json';
function download(url,dest){return new Promise((resolve,reject)=>{
  const req=https.get(url,{headers:{'User-Agent':'word-world-data-builder','Accept':'application/json'},timeout:18000},res=>{
   if([301,302,307,308].includes(res.statusCode)&&res.headers.location){res.resume();return download(res.headers.location,dest).then(resolve,reject)}
   if(res.statusCode!==200){res.resume();reject(new Error('HTTP '+res.statusCode+' '+url));return}
   fs.mkdirSync(path.dirname(dest),{recursive:true});const tmp=dest+'.part';const out=fs.createWriteStream(tmp);
   res.pipe(out);out.on('finish',()=>{out.close();fs.renameSync(tmp,dest);resolve(dest)});out.on('error',reject)
  });req.on('timeout',()=>req.destroy(new Error('下载超时: '+url)));req.on('error',reject)
})}
async function getFile(url,dest){if(fs.existsSync(dest)&&fs.statSync(dest).size>200)return dest;if(isOffline)throw new Error('离线构建缺少文件 '+dest);console.log('下载',url);return download(url,dest)}
// Upstream example sentences may have separate third-party copyrights.
// Keep vocabulary and metadata only in distributable assets.
async function main(){
 await getFile(examUrl,vocabularyPath);
 const raw=JSON.parse(fs.readFileSync(vocabularyPath,'utf8'));
 const rows=parseVocabulary(raw);
 let coreWords=new Set();
 try {await getFile(coreUrl,corePath);coreWords=new Set(parseVocabulary(JSON.parse(fs.readFileSync(corePath,'utf8'))).map(x=>String(x['单词']||x.word||'').trim().toLowerCase()));}
 catch(e){console.warn('核心词表不可用，仅按完整词表评分：',e.message)}
 let cetWords=new Map();
 try {
   if(!withoutCorpus || fs.existsSync(cetPath))await getFile(cetUrl,cetPath);
   if(fs.existsSync(cetPath)) {
     const data=JSON.parse(fs.readFileSync(cetPath,'utf8'));
     cetWords=new Map(parseVocabulary(data).filter(x=>x['单词']||x.word).map(x=>[String(x['单词']||x.word).toLowerCase(),x]));
     console.log('四六级词表已加载：',cetWords.size,'条');
   }
 }catch(e){console.warn('四六级词表暂不可用，保留考研主词库：',e.message)}
 let corpus=null;
 if(!withoutCorpus){
  let available=0;
  let remoteFailed=false;
  for(let year=2010;year<=2025;year++){
   const folder=year+'-1',dest=path.join(corpusRoot,folder,folder+'.json');
   const url=`https://raw.githubusercontent.com/LIziak112/structured-kaoyan-english/main/data/${folder}/${folder}.json`;
   try{
     if(remoteFailed && !fs.existsSync(dest))continue;
     await getFile(url,dest);available++;
   }catch(e){console.warn('真题数据下载不可用，跳过剩余远程下载:',year,e.message);remoteFailed=true}
  }
  if(available>=12)corpus=readExamOneCorpus(corpusDir);
  else console.warn('真题语料未满 12 年，不作为评分主依据，使用源项目真题次数字段。');
 }
 const ranked=generatePriority(raw,corpus,coreWords);
 const map=new Map();
 for(const item of rows){
  const word=String(item['单词']||item.word||'').trim();if(!word)continue;
  const key=word.toLowerCase(),p=ranked.records[word]||ranked.records[key];
  const meaning=String(item['释义']||item.definition||'').trim();
  const cet=cetWords.get(key);
  const six=cet?.['六级'];
  const isSix = six!==undefined && six!==null && !['', '0', 'false', '否', '无', 'no'].includes(String(six).trim().toLowerCase());
  const tags=['考研',...(cet?[isSix?'六级':'四级']:[])];
  const base={word,meaning,phonetic:String(item['英式音标']||item['音标']||item.phonetic||'').trim(),tags,
    category:String(item['分类名称']||'').trim(),frequency:Number(item['词频'])||0,
    priority:{level:p?.level||'P3',rank:p?.rank??null,frequencyRank:p?.frequencyRank??null,core:coreWords.has(key),score:p?.score??0,examCount:p?.examCount??null,exam1Count:p?.exam1Count??null,exam1Years:p?.exam1Years??null,basis:p?.basis||'原始词库'} }; 
  if(!map.has(word))map.set(word,base);
  else {const existing=map.get(word);if(meaning&&!existing.meaning.includes(meaning))existing.extraMeaning=[existing.extraMeaning,meaning].filter(Boolean).join('；');
   if((p?.rank||Infinity)<(existing.priority.rank||Infinity))existing.priority=base.priority;
  }
 }
 const items=[...map.values()].sort((a,b)=>(a.priority.rank||99999)-(b.priority.rank||99999)||a.word.localeCompare(b.word));
 if(items.length<5000||items.length>7000)throw new Error('考研词库规模异常：'+items.length);
 const meta={sample:false,count:items.length,cetMatches:items.filter(x=>x.tags.length>1).length,source:'exam-data/NETEMVocabulary + exam-data/CETVocabulary (full + core; corpus counts optional)',rankMethod:ranked.method,corpusYears:ranked.corpusYears,license:'CC BY-NC-SA 4.0; 非商业学习用途',createdAt:new Date().toISOString()};
 fs.mkdirSync(path.dirname(output),{recursive:true});
 fs.writeFileSync(output,'/* 考研词汇数据：CC BY-NC-SA 4.0；释义未经逐项人工校核。 */\nwindow.WORD_WORLD_META = '+JSON.stringify(meta)+';\nwindow.WORD_WORLD_VOCAB = '+JSON.stringify(items)+';\n','utf8');
 console.log('已构建词库：',items.length,'词；真题覆盖年份：',ranked.corpusYears.join(',')||'未导入');
 console.log('输出文件：',output);
}
main().catch(e=>{console.error('构建失败：',e.message);process.exitCode=1});
