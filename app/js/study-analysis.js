/* Descriptive learner-facing analytics. No inferred exam scores or mastery claims. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WordWorldStudyAnalysis=api;})(typeof window==='undefined'?null:window,function(){
 'use strict';
 const DAY=86400000, count=x=>Number.isSafeInteger(x)&&x>=0?x:0, pct=(a,b)=>b?Math.round(100*a/b):null;
 const dateKey=t=>new Date(t).toISOString().slice(0,10);
 function get(obj,id){return obj&&Object.hasOwn(obj,id)?obj[id]:undefined;}
 function summarize({words,bank=[],state={},key=w=>w,exam=()=>null,isPolysemy=()=>false,now=new Date(),today=now.toLocaleDateString('sv-SE'),period=7}){
  const end=Date.parse(today+'T00:00:00Z'),n=period===30?30:7,at=now.getTime();
  const byWord=new Map(words.map(w=>[key(w.word),w])),byItem=new Map(bank.map(i=>[i.id,i]));
  const active=words.filter(w=>get(state.progress,key(w.word))), known=words.filter(w=>!get(state.progress,key(w.word))&&get(state.known,key(w.word))===true);
  const dueWords=active.filter(w=>{const p=get(state.progress,key(w.word));return Number.isFinite(Date.parse(p.due))&&Date.parse(p.due)<=at;});
  const weak=active.filter(w=>get(state.progress,key(w.word)).lastRating==='again');
  const records=state.abilities||state.skills||{},seen=bank.filter(i=>get(records,i.id)),dueItems=seen.filter(i=>Date.parse(get(records,i.id).memory?.due||get(records,i.id).due)<=at);
  const wrong=i=>{const r=get(records,i.id);return r?.lastCorrect===false||r?.lastRating==='again';};
  const groups=['P0','P1','P2','P3'].map((id,i)=>{const group=words.filter(w=>w.priority?.level===id);return {id,label:['核心词','重点词','基础词','补充词'][i],total:group.length,studied:group.filter(w=>get(state.progress,key(w.word))).length,known:group.filter(w=>!get(state.progress,key(w.word))&&get(state.known,key(w.word))===true).length};});
  const recurring=words.filter(w=>(exam(w)?.years??0)>=5), recurringStudied=recurring.filter(w=>get(state.progress,key(w.word))).length;
  const events=Array.isArray(state.evidence)?state.evidence:[];
  const latestWords=new Map(),latestItems=new Map(),start=end-29*DAY,byDay=new Map(),failureDays=new Map(),intervalLatest=new Map();
  for(const e of events){const d=Date.parse(e.day+'T00:00:00Z'),t=Date.parse(e.at);if(!Number.isFinite(t)||t>at||!Number.isFinite(d)||d>end)continue;
   if(e.kind==='ability'&&byItem.has(e.id)){const v=byDay.get(e.day)||0;byDay.set(e.day,v+1);}
   if(d<start)continue;
   const m=e.kind==='word'&&e.delayed&&!e.assisted&&byWord.has(e.id)&&['again','hard','good','easy'].includes(e.result)?latestWords:e.kind==='ability'&&e.delayed&&!e.first&&byItem.has(e.id)&&typeof e.correct==='boolean'?latestItems:null;
   if(m&&(!m.has(e.id)||Date.parse(m.get(e.id).at)<=t))m.set(e.id,e);
   if(!m)continue;
   const identity=e.kind+':'+e.id, failed=e.kind==='word'?e.result==='again':!e.correct;
   if(failed){const days=failureDays.get(identity)||new Set();days.add(e.day);failureDays.set(identity,days);}
   if(e.kind==='word'&&Number.isFinite(e.gapMs)&&e.gapMs>=DAY&&(!intervalLatest.has(e.id)||Date.parse(intervalLatest.get(e.id).at)<=t))intervalLatest.set(e.id,e);
  }
  const metric=es=>({total:es.length,correct:es.filter(e=>e.kind==='word'?e.result!=='again':e.correct).length});
  const recall=metric([...latestWords.values()]),usageRecall=metric([...latestItems.values()].filter(e=>byItem.get(e.id)?.skill!=='spelling'));
  const usages=bank.filter(i=>i.skill==='context'||i.skill==='collocation');const learnedUsage=usages.filter(i=>get(records,i.id));
  const skills=['context','collocation','spelling'].map((skill,i)=>{const all=bank.filter(x=>x.skill===skill),done=all.filter(x=>get(records,x.id));return {label:['语境义项','搭配','拼写'][i],total:all.length,studied:done.length,weak:done.filter(wrong).length,delayed:metric([...latestItems.values()].filter(e=>byItem.get(e.id)?.skill===skill))};});
  const windowDays=offset=>Array.from({length:n},(_,i)=>{const date=dateKey(end-(n-1-i+offset)*DAY),d=get(state.daily,date)||{},fresh=count(d.new),reviews=Math.max(0,count(d.reviews)-fresh),usage=byDay.get(date)||0;return {date,fresh,reviews,usage,active:fresh+reviews+usage>0};});
  const days=windowDays(0),prior=windowDays(n),aggregate=rows=>rows.reduce((s,d)=>({fresh:s.fresh+d.fresh,reviews:s.reviews+d.reviews,usage:s.usage+d.usage,active:s.active+Number(d.active)}),{fresh:0,reviews:0,usage:0,active:0}),totals=aggregate(days),previous=aggregate(prior);const due=dueWords.length+dueItems.length;
  const overdue=dueWords.filter(w=>Date.parse(get(state.progress,key(w.word)).due)<=at-DAY).length+dueItems.filter(i=>Date.parse(get(records,i.id).memory?.due||get(records,i.id).due)<=at-DAY).length;
  const weakUsages=learnedUsage.filter(wrong),weakIds=new Set([...weak.map(w=>key(w.word)),...weakUsages.map(i=>key(i.word))]);
  const weakWordIds=new Set(weak.map(w=>key(w.word))),dueWordIds=new Set(dueWords.map(w=>key(w.word))),wrongByWord=new Map(),dueByItem=new Set(dueItems.map(i=>i.id));
  for(const i of weakUsages){const id=key(i.word),group=wrongByWord.get(id)||[];group.push({id:i.id,skill:i.skill,explanation:i.explanation||''});wrongByWord.set(id,group);}
  const weakDetails=words.filter(w=>weakIds.has(key(w.word))).map(w=>({word:w.word,meaning:w.meaning||'',tier:w.priority?.level||'',rank:w.priority?.rank??Infinity,forgot:weakWordIds.has(key(w.word)),usages:wrongByWord.get(key(w.word))||[],due:(weakWordIds.has(key(w.word))&&dueWordIds.has(key(w.word)))||(wrongByWord.get(key(w.word))||[]).some(i=>dueByItem.has(i.id))})).sort((a,b)=>Number(b.due)-Number(a.due)||a.rank-b.rank||a.word.localeCompare(b.word));
  // Only current failed knowledge with at least two separate delayed failure days is recurrent.
  const weakTasks=[];
  for(const w of weakDetails){const id=key(w.word);w.repeatDays=Math.max(w.forgot?(failureDays.get('word:'+id)?.size||0):0,...w.usages.map(i=>failureDays.get('ability:'+i.id)?.size||0),0);
   if(w.forgot&&dueWordIds.has(id))weakTasks.push({id:'word:'+w.word,kind:'word',word:w.word,review:true,due:get(state.progress,id).due});
   for(const i of w.usages){const r=get(records,i.id),d=r.memory?.due||r.due;if(Date.parse(d)<=at)weakTasks.push({id:'skill:'+i.id,kind:'skill',word:w.word,skillId:i.id,due:d});}
  }
  weakDetails.sort((a,b)=>Number(b.due)-Number(a.due)||Number(b.repeatDays>=2)-Number(a.repeatDays>=2)||a.rank-b.rank||a.word.localeCompare(b.word));
  const order=new Map(weakDetails.map((w,i)=>[w.word,i]));weakTasks.sort((a,b)=>order.get(a.word)-order.get(b.word)||Date.parse(a.due)-Date.parse(b.due));
  const intervals=[{label:'1–2 天',min:1,max:3},{label:'3–6 天',min:3,max:7},{label:'7 天以上',min:7,max:Infinity}].map(b=>({...b,...metric([...intervalLatest.values()].filter(e=>e.gapMs/DAY>=b.min&&e.gapMs/DAY<b.max))}));
  // Current scheduled workload, not a forecast of future FSRS re-scheduling.
  const workload=Array.from({length:8},(_,i)=>({label:i===0?'已到期':i===1?'今日稍后':dateKey(end+(i-1)*DAY).slice(5).replace('-','/'),words:0,usages:0}));
  const addDue=(value,kind)=>{const t=Date.parse(value);if(!Number.isFinite(t))return;const dayOffset=Math.round((Date.parse(new Date(t).toLocaleDateString('sv-SE')+'T00:00:00Z')-end)/DAY);const i=t<=at?0:dayOffset+1;if(i>=0&&i<workload.length)workload[i][kind]++;};
  for(const w of active)addDue(get(state.progress,key(w.word)).due,'words');for(const i of seen){const r=get(records,i.id);addDue(r.memory?.due||r.due,'usages');}
  const needs=weakDetails.slice(0,5).map(w=>w.word);
  const poly=usages.filter(i=>i.skill==='context'&&isPolysemy(i.word)),polySeen=poly.filter(i=>get(records,i.id));
  const suggestion=due?{title:'先巩固到期词汇',detail:overdue?`还有 ${due} 项到期任务，其中 ${overdue} 项已逾期一天以上。先复习，再增加新词。`:`还有 ${due} 项到期任务，完成后再学习新词。`,action:'review'}:weak.length||weakUsages.length?{title:'留意容易忘记的用法',detail:`有 ${weak.length} 个单词最近未想起、${weakUsages.length} 项用法最近答错。可先查阅这些词，之后仍按原计划复习。`,action:'weak'}:active.length===0?{title:'从核心词开始',detail:'完成第一组学习，逐步建立个人记忆记录。',action:'study'}:recall.total<5?{title:'保持间隔学习',detail:'隔天复习后，才能观察较可靠的记忆保持情况。',action:'study'}:{title:'按计划继续积累',detail:'保持每日学习节奏，优先补足核心词。',action:'study'};
  return {studied:active.length,total:words.length,known:known.length,due,weak:weak.length,needs,weakDetails,weakTasks,intervals,workload,recurrent:weakDetails.filter(w=>w.repeatDays>=2).length,groups,recurring:{total:recurring.length,studied:recurringStudied},usage:{total:usages.length,studied:learnedUsage.length,weak:learnedUsage.filter(wrong).length},polysemy:{total:poly.length,studied:polySeen.length},recall,usageRecall,skills,days,period:n,totals,previous:previous.active?previous:null,overdue,suggestion};
 }
 return {summarize,pct};
});
