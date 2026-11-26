/* A short vocabulary lesson. The caller owns persistent memory and the scheduler. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WordWorldLesson=api;})(typeof window==='undefined'?null:window,function(){
 'use strict';
 // New use targets have a separate record; never infer their mastery from a word rating.
 // At most one new target for the same word in a rolling 24 h; existing due reviews are unaffected.
 function selectSkills({bank,records,progress,known=()=>false,diagnostic=()=>null,priority=()=>0,now=new Date()}){
  const at=now.getTime(),counts=new Map(),recent=new Set();
  for(const item of bank){const r=records[item.id];if(!r)continue;counts.set(item.word,(counts.get(item.word)||0)+1);const t=Date.parse(r.memory?.lastReviewed||r.lastReviewed);if(Number.isFinite(t)&&at-t<86400000)recent.add(item.word);}
  const due=bank.filter(i=>records[i.id]&&Date.parse(records[i.id].memory?.due||records[i.id].due)<=at).map(i=>({...i,due:records[i.id].memory?.due||records[i.id].due}));
  const fresh=bank.filter(i=>!records[i.id]&&!recent.has(i.word)&&(known(i.word)||progress(i.word))&&progress(i.word)?.lastRating!=='again');
  const gap=i=>Number(diagnostic(i.word)==='partial')*2+Number(progress(i.word)?.lastRating==='hard');
  fresh.sort((a,b)=>gap(b)-gap(a)||(counts.get(a.word)||0)-(counts.get(b.word)||0)||Number(a.skill==='spelling')-Number(b.skill==='spelling')||priority(a.word)-priority(b.word)||a.id.localeCompare(b.id));
  return [...due,...fresh.map(i=>({...i,eligible:true}))];
 }
 function plan({due=[],fresh=[],skills=[],goal=20,learned=0,remaining=1800,costs={wordReview:15,newWord:35,abilityReview:40},size=8}){
  const limit=Math.max(1,Math.min(12,Math.floor(size)||8)),out=[];
  const sorted=due.slice().sort((a,b)=>Date.parse(a.due)-Date.parse(b.due));
  const backlog=sorted.length*costs.wordReview+skills.filter(s=>s.due).length*costs.abilityReview;
  const seen=new Set();let left=Math.max(0,remaining),newCount=0;
  const add=(task,cost)=>{if(out.length>=limit||seen.has(task.id))return false;seen.add(task.id);out.push(task);left-=cost;return true;};
  // Oldest due items across word and skill directions; a budget never erases due work.
  const reviews=[...sorted.map(w=>({id:'word:'+w.word,kind:'word',word:w.word,review:true,due:w.due,cost:costs.wordReview})),...skills.filter(s=>s.due).map(s=>({id:'skill:'+s.id,kind:'skill',word:s.word,skillId:s.id,due:s.due,cost:costs.abilityReview}))].sort((a,b)=>Date.parse(a.due)-Date.parse(b.due));
  for(const r of reviews){if(out.length&&left<r.cost)break;if(!add(r,r.cost))continue;if(out.length>=limit)break;}
  // Only introduce new work if all current debt fits and the daily new-word quota permits it.
  if(backlog<=remaining&&reviews.length<=out.length){
   // Reserve one slot and its time for a new use target, when eligible. New words cannot starve it.
   const skill=skills.find(s=>!s.due&&s.eligible&&!seen.has('skill:'+s.id));
   const skillCost=costs.newAbility||costs.abilityReview;
   const reserve=skill&&left>=skillCost&&out.length<limit;
   for(const w of fresh){if(newCount>=Math.min(5,Math.max(0,goal-learned))||left<costs.newWord+(reserve?skillCost:0)||out.length>=limit-Number(!!reserve))break;if(add({id:'word:'+w.word,kind:'word',word:w.word,review:false},costs.newWord))newCount++;}
   if(reserve)add({id:'skill:'+skill.id,kind:'skill',word:skill.word,skillId:skill.id},skillCost);
  }
  return {tasks:out,newCount,reviewCount:out.filter(t=>t.review||t.due).length,backlog,seconds:Math.max(0,remaining-left)};
 }
 function create(tasks){return {tasks:tasks.map(t=>({...t})),index:0,phase:'probe',rated:0,newCount:0,repairs:0,firstCorrect:0};}
 function current(s){return s.tasks[s.index]||null;}
 function advance(s){return {...s,index:s.index+1,phase:'probe'};}
 function reveal(s){return current(s)&&s.phase==='probe'?{...s,phase:'answer'}:current(s)?.repair&&s.phase==='retry'?{...s,phase:'repairJudge'}:s;}
 function hide(s){return current(s)?.repair&&s.phase==='answer'?{...s,phase:'retry'}:s;}
 function rating(s,value){const t=current(s);if(!t||!['good','hard','again'].includes(value)||t.kind!=='word'||(t.repair?s.phase!=='repairJudge':s.phase!=='answer'))return null;
  if(t.repair)return {next:advance({...s,repairs:s.repairs+Number(value!=='again')}),event:null};
  const tasks=value==='again'?[...s.tasks,{...t,id:t.id+':repair',repair:true}]:s.tasks;
  return {next:advance({...s,tasks,rated:s.rated+1,newCount:s.newCount+Number(!t.review),firstCorrect:s.firstCorrect+Number(value==='good')}),event:{kind:'word',word:t.word,rating:value}};
 }
 function answerSkill(s,response,check){const t=current(s);if(!t||t.kind!=='skill'||s.phase!=='probe')return null;return {next:{...s,phase:'skillFeedback',rated:s.rated+1},event:{kind:'skill',skillId:t.skillId,response,correct:check}};}
 return {selectSkills,plan,create,current,advance,reveal,hide,rating,answerSkill};
});
