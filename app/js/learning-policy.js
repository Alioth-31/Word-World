/* Learning policy: scheduling capacity and evidence are separate from FSRS. */
(function(root, factory){
 const api=factory();
 if(typeof module==='object'&&module.exports)module.exports=api;
 else root.WordWorldLearning=api;
})(typeof window==='undefined'?null:window, function(){
 'use strict';
 const DAY=86400000, MAX_EVENTS=5000;
 const COST={wordReview:15,newWord:35,ability:40,diagnostic:25,familiar:12};
 const SKILLS=['context','collocation','spelling'];
 const budgetMinutes=value=>[10,15,20,30,45,60,90,120].includes(Number(value))?Number(value):30;
 const integer=value=>Number.isSafeInteger(value)&&value>=0?value:0;
 function normalizeEvidence(raw){
  if(!Array.isArray(raw))return [];
  return raw.slice(-MAX_EVENTS).filter(e=>e&&typeof e.id==='string'&&e.id.length>0&&e.id.length<=180&&
   typeof e.day==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(e.day)&&Number.isFinite(Date.parse(e.at))&&(
   (e.kind==='word'&&['again','hard','good','easy'].includes(e.result))||
   (e.kind==='ability'&&SKILLS.includes(e.skill)&&typeof e.correct==='boolean'&&Number.isSafeInteger(e.variant)&&e.variant>=0)||
   (e.kind==='diagnostic'&&['unknown','partial','accurate'].includes(e.result))||
   (e.kind==='familiar'&&e.result==='known'))).slice(-MAX_EVENTS).map(e=>({
    kind:e.kind,id:e.id,day:e.day,at:e.at,...(Number.isFinite(e.gapMs)&&e.gapMs>=DAY&&e.delayed===true?{gapMs:e.gapMs}:{}),...(e.kind==='ability'?{skill:e.skill,correct:e.correct,variant:e.variant,first:e.first===true,delayed:e.delayed===true&&e.first!==true,novel:e.novel===true&&e.delayed===true&&e.first!==true}:{result:e.result,...(e.kind==='word'?{delayed:e.delayed===true,assisted:e.assisted===true}:{})})
   }));
 }
 function appendEvidence(events,event){
  const valid=normalizeEvidence([event]);if(!valid.length)throw Error('Invalid learning evidence');
  events.push(valid[0]);if(events.length>MAX_EVENTS)events.splice(0,events.length-MAX_EVENTS);
 }
 function gap(previous,now){const last=Date.parse(previous?.lastReviewed),ms=now.getTime()-last;return Number.isFinite(ms)&&ms>=DAY?ms:undefined;}
 function delayed(previous,now){return gap(previous,now)!==undefined;}
 function abilityEvent(item,previous,result,now,day){
  const n=integer(previous?.attempts),isDelayed=!!previous&&delayed(previous.memory,now);
  return {kind:'ability',id:item.id,skill:item.skill,day,at:now.toISOString(),correct:result.lastCorrect===true,
   variant:n%item.variants.length,first:!previous,delayed:isDelayed,gapMs:gap(previous?.memory,now),novel:isDelayed&&n>0&&n<item.variants.length};
 }
 function knownAuditDates(events){
  const dates=new Map();
  for(const e of events)if((e.kind==='diagnostic'&&e.result==='accurate')||e.kind==='familiar'){
   const at=Date.parse(e.at);if(Number.isFinite(at)&&at>(dates.get(e.id)??-Infinity))dates.set(e.id,at);
  }
  return dates;
 }
 function knownAuditDue(events,id,now,days=30){
  const dates=events instanceof Map?events:knownAuditDates(events);
  return !dates.has(id)||now.getTime()-dates.get(id)>=days*DAY;
 }
 function evidenceSummary(events,items){
  const scoped=new Map(items.map(item=>[item.id,item.skill]));
  const metric=()=>({correct:0,total:0});
  const result=Object.fromEntries(SKILLS.map(skill=>[skill,{first:metric(),delayed:metric(),novel:metric()}]));
  const firstSeen=new Set(),wordRecall=metric();
  const add=(m,correct)=>{m.total++;m.correct+=Number(correct)};
  for(const e of events){
   if(e.kind==='word'&&e.delayed&&!e.assisted)add(wordRecall,e.result!=='again');
   if(e.kind!=='ability'||scoped.get(e.id)!==e.skill)continue;
   const r=result[e.skill];
   if(e.first&&!firstSeen.has(e.id)){firstSeen.add(e.id);add(r.first,e.correct)}
   if(e.delayed&&!e.first)add(r.delayed,e.correct);
   if(e.novel&&e.delayed&&!e.first)add(r.novel,e.correct);
  }
  return {skills:result,wordRecall};
 }
 function estimateSpent(daily,events,day){
  const newWords=integer(daily?.new),reviews=Math.max(0,integer(daily?.reviews)-newWords);
  let seconds=newWords*COST.newWord+reviews*COST.wordReview;
  for(const e of events)if(e.day===day&&e.kind!=='word')seconds+=COST[e.kind]||0;
  return seconds;
 }
 // Reserve time for all current due items, including ones from other books.
 // A budget is a new-work ceiling, never a deletion of a due FSRS task.
 function plan({dueWords=[],dueSkills=[],dueMaterials=[],materialSpent=0,newWords=0,newSkills=0,goal=20,daily={},events=[],day,budget=30}){
  const spent=estimateSpent(daily,events,day)+integer(materialSpent),remaining=Math.max(0,budgetMinutes(budget)*60-spent);
  const debt=dueWords.length*COST.wordReview+dueSkills.length*COST.ability+dueMaterials.length*COST.ability;
  const available=Math.max(0,remaining-debt);
  const wordGoal=Math.min(integer(newWords),Math.max(0,integer(goal)-integer(daily.new)));
  // A configurable starting heuristic: reserve up to one quarter for new skill work.
  const reserved=wordGoal?Math.floor(available*.25):available;
  let skillNew=Math.min(integer(newSkills),6,Math.floor(reserved/COST.ability));
  let wordNew=Math.min(wordGoal,Math.floor((available-skillNew*COST.ability)/COST.newWord));
  skillNew=Math.min(integer(newSkills),6,Math.floor((available-wordNew*COST.newWord)/COST.ability));
  const earliest=[['wordReview',dueWords[0]],['abilityReview',dueSkills[0]],['materialReview',dueMaterials[0]]].filter(([,item])=>item).sort((a,b)=>Date.parse(a[1].due)-Date.parse(b[1].due));
  const primary=earliest[0]?.[0]||(wordNew?'newWord':skillNew?'newAbility':'done');
  return {spent,remaining,debt,wordNew,skillNew,primary,
   wordReviewBatch:Math.min(dueWords.length,30,Math.max(1,Math.floor(remaining/COST.wordReview))),
   abilityReviewBatch:Math.min(dueSkills.length,6,Math.max(1,Math.floor(remaining/COST.ability))),
   materialReviewBatch:Math.min(dueMaterials.length,3,Math.max(1,Math.floor(remaining/COST.ability)))};
 }
 // Initial balanced exploration; at least three observed items before prioritizing a skill.
 // First-attempt and latest error evidence are not mixed into an overall proficiency score.
 function orderNewSkills(items,records,limit){
  const groups=SKILLS.map(skill=>{
   const all=items.filter(i=>i.skill===skill),seen=all.filter(i=>records[i.id]);
   const weak=seen.filter(i=>!records[i.id].lastCorrect).length;
   return {skill,items:all.filter(i=>!records[i.id]),extra:seen.length>=3&&weak/seen.length>=.5};
  });
  const result=[];
  while(result.length<limit&&groups.some(g=>g.items.length)){
   for(const g of groups)if(result.length<limit&&g.items.length)result.push(g.items.shift());
   for(const g of groups)if(result.length<limit&&g.extra&&g.items.length)result.push(g.items.shift());
  }
  return result;
 }
 return {budgetMinutes,normalizeEvidence,appendEvidence,delayed,gap,abilityEvent,knownAuditDates,knownAuditDue,evidenceSummary,estimateSpent,plan,orderNewSkills};
});
