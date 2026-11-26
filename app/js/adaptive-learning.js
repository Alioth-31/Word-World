/* Transparent instructional policy. Observations are not estimates of latent proficiency. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WordWorldAdaptive=api;})(typeof window==='undefined'?null:window,function(){
 'use strict';
 const DAY=86400000, kinds=['wordReview','newWord','abilityReview','newAbility','materialReview','diagnostic','repair'], defaults={wordReview:15,newWord:35,abilityReview:40,newAbility:40,materialReview:40,diagnostic:25,repair:20};
 const clamp=(x,min,max)=>Math.max(min,Math.min(max,x));
 const sum=xs=>xs.reduce((a,b)=>a+b,0);
 const validTime=n=>Number.isFinite(n)&&n>=2&&n<=180;
 const dayOf=x=>typeof x==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(x)&&Number.isFinite(Date.parse(x));
 function normalize(raw){
  if(!Array.isArray(raw))return [];
  return raw.filter(e=>e&&kinds.includes(e.kind)&&dayOf(e.day)&&validTime(e.seconds)).slice(-4000).map(e=>({kind:e.kind,day:e.day,seconds:e.seconds}));
 }
 function record(history,kind,day,seconds){if(!kinds.includes(kind)||!dayOf(day)||!validTime(seconds))return history;return [...history,{kind,day,seconds:Math.round(seconds)}].slice(-4000);}
 // A shrinkage estimator: robust per-task median, with a default-equivalent prior of 6 samples.
 // Slow/abandoned interactions above 180 seconds are omitted, not treated as actual active study.
 function costs(history){const rows=normalize(history);return Object.fromEntries(kinds.map(k=>{const xs=rows.filter(e=>e.kind===k).slice(-40).map(e=>e.seconds).sort((a,b)=>a-b);const n=xs.length,m=n?(xs[(n-1)>>1]+xs[n>>1])/2:defaults[k];return [k,Math.round(clamp((6*defaults[k]+n*m)/(6+n),5,120))];}));}
 function weeklyMaterial(materials,day){const end=Date.parse(day+'T00:00:00Z');return sum((materials||[]).filter(s=>dayOf(s.day)&&Date.parse(s.day)>=end-6*DAY&&Date.parse(s.day)<=end).map(s=>Number.isFinite(s.minutes)?clamp(s.minutes,0,120)*60:0));}
 // The material reserve is a weekly guardrail, not an empirically optimal allocation.
 // It does not pre-empt reviews on days with no opted-in material target.
 function plan(input,base){
  const c=costs(input.timings),day=input.day,minutes=Number(input.budget)||30;
  const adjustment=sum(normalize(input.timings).filter(e=>e.day===day&&e.kind!=='materialReview').map(e=>e.kind==='repair'?e.seconds:e.seconds-defaults[e.kind]));
  const spent=Math.max(0,(base.spent||0)+adjustment),remaining=Math.max(0,minutes*60-spent);
  const all=[['wordReview',input.dueWords||[]],['abilityReview',input.dueSkills||[]],['materialReview',input.dueMaterials||[]]];
  const debt=sum(all.map(([k,rows])=>rows.length*c[k]));
  const target=clamp(Number(input.materialWeeklyMinutes)||0,0,420)*60;
  const deficit=Math.max(0,target-weeklyMaterial(input.materials,day));
  const materialToday=sum((input.materials||[]).filter(s=>s.day===day).map(s=>Math.max(0,Number(s.minutes)||0)*60));
  // Six-day nominal target from the agreed study cadence; severe review debt reduces the
  // protected block to a recovery floor. A target can be infeasible and is never promised.
  const dayCapacity=minutes*60,nominal=Math.min(dayCapacity*.55,Math.ceil(target/6/60)*60);
  const oldest=Math.min(Infinity,...all.flatMap(([,rows])=>rows.map(x=>Date.parse(x.due)).filter(Number.isFinite)));
  const overdueDays=(Date.parse(day+'T00:00:00Z')-oldest)/DAY;
  const severe=debt>dayCapacity*1.5||(overdueDays>=2&&debt>dayCapacity*.6);
  const recovery=Math.min(nominal,Math.max(300,Math.floor(dayCapacity*.20/60)*60));
  const request=Math.max(0,Math.min(deficit,severe?recovery:nominal)-materialToday);
  const reserve=target&&request>=300&&remaining>=300?Math.min(request,remaining):0;
  const usable=Math.max(0,remaining-reserve);
  // Preserve explicit access to every due item, even beyond the recommendation. Reserve only changes suggested batch.
  const batch=(k,rows,limit)=>rows.length?Math.min(rows.length,limit,Math.max(1,Math.floor(usable/c[k]))):0;
  const wordReviewBatch=batch('wordReview',all[0][1],30),abilityReviewBatch=batch('abilityReview',all[1][1],6),materialReviewBatch=batch('materialReview',all[2][1],3);
  const available=Math.max(0,usable-debt),wordGoal=Math.min(Math.max(0,input.newWords||0),Math.max(0,(input.goal||20)-(input.daily?.new||0)));
  // New specialist work is optional. Give one task to each available stream before using remaining capacity.
  const skillCap=Math.min(6,Math.max(0,input.newSkills||0));
  let wordNew=0,skillNew=0,left=available;
  const canBoth=wordGoal&&skillCap&&left>=c.newWord+c.newAbility;
  if(canBoth){wordNew++;skillNew++;left-=c.newWord+c.newAbility;}
  // Stronger evidence of a bottleneck changes marginal allocation, not the daily review schedule.
  const need=skillNeed(input.events||[]),hasWeak=Object.values(need).some(x=>x.priority==='repair');
  const ratio=hasWeak?.40:.20;
  while(skillNew<skillCap&&left>=c.newAbility&&(skillNew*c.newAbility<available*ratio||!wordGoal)){skillNew++;left-=c.newAbility;}
  while(wordNew<wordGoal&&left>=c.newWord){wordNew++;left-=c.newWord;}
  while(skillNew<skillCap&&left>=c.newAbility&&wordNew>=wordGoal){skillNew++;left-=c.newAbility;}
  const earliest=all.flatMap(([k,rows])=>rows.map(item=>({k,due:Date.parse(item.due)}))).sort((a,b)=>a.due-b.due)[0];
  // Protect input after the planned review share has been consumed, even if debt is still large.
  const materialFirst=reserve>0&&remaining<=reserve+Math.min(120,c.wordReview*2);
  const primary=materialFirst?'materialInput':earliest?.k||(reserve&&(!wordNew&&!skillNew)?'materialInput':wordNew?'newWord':skillNew?'newAbility':reserve?'materialInput':'done');
  return {...base,costs:c,spent,remaining,debt,wordNew,skillNew,wordReviewBatch,abilityReviewBatch,materialReviewBatch,primary,reserve,materialDeficit:deficit,reason:materialFirst?'已接近保留的输入时间，建议切换到材料学习。':severe?'积压严重：暂停新增知识，将输入时间缩至维持性下限。':debt>usable?'到期任务超过建议容量；暂停增加新任务，保留材料时间。':hasWeak?'独立延迟证据显示薄弱项，增加针对性练习。':'先复习，再按剩余时间安排新知识。'};
 }
 // Count each item at most once per evidence stream; take recent independent delayed attempts.
 // Small samples are explicitly uncertain. No inference from immediate feedback or from other skills.
 function skillNeed(events){const result={};for(const skill of ['context','collocation','spelling']){
  const latest=new Map();for(const e of events){if(e.kind==='ability'&&e.skill===skill&&e.delayed===true&&e.first!==true&&typeof e.correct==='boolean'){const old=latest.get(e.id);if(!old||Date.parse(e.at)>=Date.parse(old.at))latest.set(e.id,e);}}
  const rows=[...latest.values()].sort((a,b)=>Date.parse(b.at)-Date.parse(a.at)).slice(0,12),errors=rows.filter(e=>!e.correct).length;
  const risk=(errors+2)/(rows.length+4);result[skill]={n:rows.length,errors,risk,priority:rows.length>=4&&errors>=3&&risk>=.55?'repair':rows.length>=4&&risk<=.3?'maintain':'explore'};
 }return result;}
 function orderSkills(items,records,events,limit){const profile=skillNeed(events),groups=Object.keys(profile).map(skill=>({skill,items:items.filter(i=>i.skill===skill&&!records[i.id]),served:0}));const out=[];
  // Round one explores each skill; later rounds weight corroborated weakness, without starving other groups.
  for(const g of groups)if(g.items.length&&out.length<limit){out.push(g.items.shift());g.served++;}
  while(out.length<limit&&groups.some(g=>g.items.length)){const g=groups.filter(g=>g.items.length).sort((a,b)=>(a.served/(profile[a.skill].priority==='repair'?2:1))-(b.served/(profile[b.skill].priority==='repair'?2:1))||profile[b.skill].risk-profile[a.skill].risk)[0];out.push(g.items.shift());g.served++;}return out;
 }
 // Evidence-based route for the *next* encounter, not a diagnosis of an unobserved error cause.
 function instruction({id,events=[],review=false,diagnostic,hasExample=false,hasExtra=false}){
  const history=events.filter(e=>e.kind==='word'&&e.id===id&&e.delayed&&!e.assisted).slice(-4);
  const failures=history.filter(e=>e.result==='again').length;
  if(review&&failures>=2)return {strategy:'repair',reason:'最近独立延迟提取多次失败',guide:hasExtra?'先对照已知义项与漏掉的义项；选择一个能区分它们的线索，再遮住解释提取。':hasExample?'换一个能表达核心含义的短语或例句；理解后遮住提示，再提取。':'换用一个简短、可理解的词形或意义线索，再遮住提示提取。'};
  if(!review&&diagnostic==='unknown')return {strategy:'encode',reason:'已自评不认识',guide:'先直接核对简明释义，建立词形和含义联系，再遮住答案。'};
  if(!review&&diagnostic==='partial'&&hasExtra)return {strategy:'contrast',reason:'已有部分义项知识',guide:'只补充原来不会的义项，比较使用场合，再独立提取。'};
  return {strategy:'probe',reason:review?'先观察独立记忆保持':'先确认已有知识，避免重复学习',guide:'先独立回忆；不会时选择先学习或纠错。'};
 }
 // Choose a material route from actual first-pass comprehension and assistance, not assumed coverage.
 function portfolio(materials,day,focus,weeklyMinutes){
  const target=clamp(Number(weeklyMinutes)||0,0,420),end=Date.parse(day+'T00:00:00Z');
  const actual={reading:0,listening:0,expression:0};
  for(const s of materials||[])if(Object.hasOwn(actual,s.mode)&&dayOf(s.day)&&Date.parse(s.day)>=end-6*DAY&&Date.parse(s.day)<=end&&Number.isFinite(s.minutes))actual[s.mode]+=clamp(s.minutes,0,120);
  const ratios=focus==='cet6'?[.40,.40,.20]:focus==='exam1'?[.75,0,.25]:[.50,.30,.20];
  const modes=Object.keys(actual).map((mode,i)=>({mode,actual:actual[mode],target:Math.round(target*ratios[i]),deficit:Math.max(0,Math.round(target*ratios[i])-actual[mode])}));
  return {modes,next:modes.sort((a,b)=>b.deficit-a.deficit)[0].mode};
 }
 function materialRoute({mode='reading',comprehension,blocks,history=[]}){
  if(!['smooth','partial','blocked'].includes(comprehension)||!Number.isInteger(blocks)||blocks<0||blocks>8)throw Error('需要先记录首次理解及障碍数');
  const similar=history.filter(s=>s.mode===mode&&s.observation?.comprehension).slice(-3),repeat=similar.length>=2&&similar.filter(s=>s.observation.comprehension==='blocked').length>=2;
  if(comprehension==='smooth'&&blocks<=1)return {route:'fluency',maxFollowups:0,guide:'继续完整理解；不要逐词拆解。结束后概括原意，下一篇可适度增加难度。'};
  if(comprehension==='blocked'||blocks>=5)return {route:'repair',maxFollowups:2,guide:repeat?'近期同类材料反复卡住：下一份选择更短、更熟悉的材料；本次先修复一个主导障碍。':'分段修复最影响理解的障碍，返回原任务，不要求背完所有生词。'};
  return {route:'acquisition',maxFollowups:3,guide:'挑选高价值且可复用的词义或词块；撤除提示后提取，再返回原材料。'};
 }
 // Conservative canonical identity: only exact same target, explanation and kind. No semantic guessing.
 function identity(o){const norm=s=>String(s||'').normalize('NFKC').trim().replace(/\s+/g,' ');return JSON.stringify([o.kind,norm(o.word),norm(o.cue),norm(o.note)]);}
 function deduplicate(history,session){const existing=new Map();for(const s of history)for(const o of s.obstacles||[])if(o.followup&&o.memory)existing.set(identity(o),o.id);
  return {...session,obstacles:session.obstacles.map(o=>{const key=identity(o),same=o.followup&&existing.get(key);return same?{...o,followup:false,memory:null,linkedTo:same}:o;})};
 }
 return {normalize,record,costs,plan,skillNeed,orderSkills,instruction,materialRoute,identity,deduplicate,weeklyMaterial,portfolio};
});
