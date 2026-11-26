(() => {
'use strict';
const labels={context:'语境义项辨析',collocation:'搭配辨析',spelling:'拼写提取'};
const bank=(window.WORD_WORLD_ABILITIES||[]).filter(item=>window.WordWorldContent.getWord(item.word));
const byId=new Map(bank.map(item=>[item.id,item]));
if(byId.size!==bank.length)throw Error('Duplicate ability item ID');
function normalize(raw){
 const result=Object.create(null);
 if(!raw||typeof raw!=='object'||Array.isArray(raw))return result;
 for(const item of bank){
  if(!Object.hasOwn(raw,item.id))continue;
  const r=raw[item.id];
  if(!r||!Number.isSafeInteger(r.attempts)||r.attempts<1||!Number.isSafeInteger(r.correct)||r.correct<0||r.correct>r.attempts||typeof r.firstCorrect!=='boolean'||typeof r.lastCorrect!=='boolean'||!r.memory||!Number.isFinite(Date.parse(r.memory.due)))continue;
  result[item.id]={attempts:r.attempts,correct:r.correct,firstCorrect:r.firstCorrect,lastCorrect:r.lastCorrect,memory:r.memory};
 }
 return result;
}
function scoped(words){const ids=new Set(words.map(w=>w.word));return bank.filter(item=>ids.has(item.word))}
function queue(records,words,now,limit=6){
 const available=scoped(words);
 const due=available.filter(item=>records[item.id]&&Date.parse(records[item.id].memory.due)<=now.getTime()).sort((a,b)=>Date.parse(records[a.id].memory.due)-Date.parse(records[b.id].memory.due)||a.id.localeCompare(b.id));
 const result=due.slice(0,limit);
 const newBySkill=Object.keys(labels).map(skill=>available.filter(item=>item.skill===skill&&!records[item.id]));
 while(result.length<limit&&newBySkill.some(group=>group.length)){
  for(const group of newBySkill){if(result.length<limit&&group.length)result.push(group.shift())}
 }
 return result;
}
function variant(item,record){return item.variants[(record?.attempts||0)%item.variants.length]}
function check(question,response){
 if(question.options)return Number.isInteger(response)&&response===question.correct;
 return typeof response==='string'&&response.trim().toLowerCase()===question.answer.toLowerCase();
}
function record(item,previous,response,now,scheduler){
 const question=variant(item,previous),correct=check(question,response);
 const memory=scheduler.review(previous?.memory||null,correct?'good':'again',now);
 return {attempts:(previous?.attempts||0)+1,correct:(previous?.correct||0)+Number(correct),firstCorrect:previous?.firstCorrect??correct,lastCorrect:correct,memory};
}
function summary(records,words,now){
 const available=scoped(words);
 return Object.entries(labels).map(([skill,label])=>{
  const group=available.filter(item=>item.skill===skill),seen=group.filter(item=>records[item.id]);
  return {skill,label,total:group.length,seen:seen.length,firstCorrect:seen.filter(item=>records[item.id].firstCorrect).length,due:seen.filter(item=>Date.parse(records[item.id].memory.due)<=now.getTime()).length,weak:seen.filter(item=>!records[item.id].lastCorrect).length};
 });
}
window.WordWorldAbilities={bank,labels,normalize,queue,variant,check,record,summary};
})();
