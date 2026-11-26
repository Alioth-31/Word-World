/* Integration with the existing word-world schema-3 records. */
(function(root,factory){if(typeof module==='object'&&module.exports)module.exports=factory;else root.WordWorldVocabularyBridge=factory;})(typeof window==='undefined'?null:window,function(deps){
 'use strict';
 const {lesson:L,learning:P,adaptive:A,content,abilities,readState,day,now,scheduler,save}=deps;
 function timing(kind,seconds){const s=readState();s.timings=A.record(s.timings,kind,day(),seconds);}
 function log(e){P.appendEvidence(readState().evidence,e);}
 function daily(){const s=readState(),d=day();return s.daily[d]??={new:0,reviews:0,success:0};}
 function progress(word){return Object.hasOwn(readState().progress,content.wordKey(word))?readState().progress[content.wordKey(word)]:null;}
 function recordWord(word,rating,seconds){const s=readState(),key=content.wordKey(word),prev=progress(word),at=now();
  deps.beforeLearning?.();const result=scheduler().review(prev,rating,at);s.progress[key]={...prev,...result,reviews:(prev?.reviews||0)+1,lastRating:rating};delete s.known[key];
  const d=daily();d.reviews++;if(!prev)d.new++;if(rating==='good')d.success++;
  log({kind:'word',id:key,day:day(),at:at.toISOString(),result:rating,delayed:!!prev&&P.delayed(prev,at),gapMs:P.gap(prev,at),assisted:false});timing(prev?'wordReview':'newWord',seconds);deps.footballEvent?.({kind:'word',id:'word:'+key,fresh:!prev,verified:true});save();}
 function question(id){const item=abilities.bank.find(i=>i.id===id);return item?{...abilities.variant(item,readState().abilities[id]),explanation:item.explanation}:null;}
 function recordSkill(id,response,seconds){const item=abilities.bank.find(i=>i.id===id);if(!item)throw Error('Unknown skill');const s=readState(),prev=s.abilities[id],at=now();deps.beforeLearning?.();const result=abilities.record(item,prev,response,at,scheduler());s.abilities[id]=result;log(P.abilityEvent(item,prev,result,at,day()));timing(prev?'abilityReview':'newAbility',seconds);deps.footballEvent?.({kind:'skill',id:'skill:'+id,fresh:!prev,verified:true});save();}
 function planning({fresh,onlyReview=false}){const s=readState(),at=now(),d=daily(),costs=A.costs(s.timings),due=content.allWords.filter(w=>progress(w.word)&&Date.parse(progress(w.word).due)<=at.getTime()).map(w=>({...w,due:progress(w.word).due}));
  const skillRows=L.selectSkills({bank:abilities.bank,records:s.abilities,progress,known:w=>!!s.known[content.wordKey(w)],diagnostic:w=>s.diagnostic[content.wordKey(w)],priority:w=>deps.priority?.(w)??0,now:at}).map(i=>onlyReview?{...i,eligible:false}:i);
  const baseline=P.estimateSpent(d,s.evidence,day()),defaults={wordReview:15,newWord:35,abilityReview:40,newAbility:40,diagnostic:25};
  const correction=s.timings.filter(e=>e.day===day()).reduce((sum,e)=>sum+(e.kind==='repair'?e.seconds:Object.hasOwn(defaults,e.kind)?e.seconds-defaults[e.kind]:0),0);
  return {due,fresh:onlyReview?[]:fresh,skills:skillRows,goal:Number(s.prefs.goal)||20,learned:d.new,remaining:Math.max(0,P.budgetMinutes(s.prefs.budgetMinutes)*60-Math.max(0,baseline+correction)),costs};
 }
 function plan(args){return L.plan(planning(args));}
 function matchPlan(fresh){const p=planning({fresh});return {...p,freshCount:p.fresh.length,eligibleSkill:p.skills.some(s=>!s.due&&s.eligible),due:[...p.due.map(w=>({id:'word:'+content.wordKey(w.word),due:w.due,cost:p.costs.wordReview})),...p.skills.filter(s=>s.due).map(s=>({id:'skill:'+s.id,due:s.due,cost:p.costs.abilityReview}))]};}
 function deepen(word){const s=readState(),key=content.wordKey(word);return s.diagnostic[key]==='partial'||A.instruction({id:key,events:s.evidence,review:!!progress(word),hasExtra:true}).strategy==='repair';}
 return {recordWord,recordSkill,question,plan,matchPlan,deepen,recordRepair(seconds){timing('repair',seconds);save()}};
});
