'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const p=require('../app/js/learning-policy.js');
const now=new Date('2026-11-24T10:00:00Z'),day='2026-11-24';
const at=now.toISOString(),old='2026-11-20T10:00:00Z';
const base={newWords:200,newSkills:12,goal:20,day,budget:30};
const item={id:'address-sense',skill:'context',variants:[{},{}]};
const event=(previous,correct)=>p.abilityEvent(item,previous,{lastCorrect:correct},now,day);
test('budget considers new-word quota and reserves skill time without exceeding capacity',()=>{
 const x=p.plan(base);assert.equal(x.wordNew,20);assert.equal(x.skillNew,6);assert.equal(x.primary,'newWord');
 const y=p.plan({...base,budget:10});assert.ok(y.wordNew*35+y.skillNew*40<=600);assert.ok(y.skillNew>0);assert.ok(y.wordNew>0);
});
test('daily old counters and new skill activity are not double counted',()=>{
 assert.equal(p.estimateSpent({new:2,reviews:5},[{day,kind:'word'},{day,kind:'ability'},{day,kind:'diagnostic'}],day),180);
});
test('global due debt prevents new tasks and overdue tasks remain actionable past budget',()=>{
 const x=p.plan({...base,budget:10,daily:{new:20,reviews:30},dueWords:[{due:at}],dueSkills:[{due:old}]});
 assert.equal(x.wordNew,0);assert.equal(x.skillNew,0);assert.equal(x.primary,'abilityReview');assert.equal(x.abilityReviewBatch,1);
});
test('due reservations include both streams and avoid adding new work when heavily overdue',()=>{
 const x=p.plan({...base,budget:10,dueWords:Array.from({length:40},()=>({due:at})),dueSkills:[{due:old}]});
 assert.equal(x.wordNew,0);assert.equal(x.skillNew,0);assert.equal(x.primary,'abilityReview');assert.equal(x.debt,640);
});
test('daily new quota remains global across book switches',()=>assert.equal(p.plan({...base,daily:{new:19,reviews:19}}).wordNew,1));
test('separates initial, immediate repeat, delayed novel variant, and later known variant',()=>{
 assert.equal(event(null,true).first,true);
 const quick=event({attempts:1,memory:{lastReviewed:at}},true);assert.equal(quick.delayed,false);assert.equal(quick.novel,false);
 const later=event({attempts:1,memory:{lastReviewed:old}},false);assert.equal(later.delayed,true);assert.equal(later.novel,true);assert.equal(later.variant,1);
 assert.equal(event({attempts:2,memory:{lastReviewed:old}},true).novel,false);
});
test('evidence uses actual item-level denominators, excludes immediate repeats and unscoped items',()=>{
 const first=event(null,false),quick=event({attempts:1,memory:{lastReviewed:at}},true),later=event({attempts:1,memory:{lastReviewed:old}},true);
 const s=p.evidenceSummary([first,first,quick,later,{...first,id:'outside'}],[item]);
 assert.deepEqual(s.skills.context.first,{correct:0,total:1});assert.deepEqual(s.skills.context.delayed,{correct:1,total:1});assert.deepEqual(s.skills.context.novel,{correct:1,total:1});
 assert.deepEqual(s.skills.spelling.first,{correct:0,total:0});
});
test('assisted word answers do not inflate delayed independent self recall',()=>{
 const e={kind:'word',id:'a',at,day,result:'good',delayed:true,assisted:true};
 assert.deepEqual(p.evidenceSummary([e,{...e,assisted:false,result:'again'},{...e,assisted:false,result:'hard'}],[]).wordRecall,{correct:1,total:2});
});
test('familiar words require periodic revalidation and legacy flags are eligible',()=>{
 assert.equal(p.knownAuditDue([],'a',now),true);
 const e={kind:'familiar',id:'a',day,at,result:'known'};
 assert.equal(p.knownAuditDue([e],'a',now),false);assert.equal(p.knownAuditDue([e],'a',new Date(now.getTime()+30*86400000)),true);
});
test('skill allocation explores all skills and adds emphasis only with sufficient weakness observations',()=>{
 const bank=['context','collocation','spelling'].flatMap(skill=>Array.from({length:5},(_,i)=>({id:skill+i,skill})));
 const records=Object.fromEntries([0,1,2].map(i=>['context'+i,{lastCorrect:false}]));
 assert.deepEqual(p.orderNewSkills(bank,records,4).map(i=>i.skill),['context','collocation','spelling','context']);
 assert.equal(new Set(p.orderNewSkills(bank,records,20).map(i=>i.id)).size,12);
});
test('legacy or invalid imported evidence cannot produce artificial first or delayed scores',()=>{
 assert.deepEqual(p.normalizeEvidence(null),[]);assert.deepEqual(p.normalizeEvidence([{kind:'ability'}]),[]);
 const valid=p.normalizeEvidence([event(null,true)]);assert.equal(valid.length,1);assert.equal(valid[0].first,true);
 const events=[];p.appendEvidence(events,event(null,false));assert.equal(events.length,1);
});
test('all supported budgets keep new work within remaining capacity across a range of backlogs',()=>{
 for(const budget of [10,15,20,30,45,60])for(const words of [0,1,20,60,150])for(const skills of [0,1,6,20]){
  const x=p.plan({...base,budget,dueWords:Array.from({length:words},()=>({due:at})),dueSkills:Array.from({length:skills},()=>({due:old}))});
  assert.ok(x.wordNew*35+x.skillNew*40<=Math.max(0,x.remaining-x.debt));
  assert.ok(x.wordNew<=20&&x.skillNew<=6);
  if(words+skills>0)assert.ok(['wordReview','abilityReview'].includes(x.primary));
 }
});
test('retained evidence is bounded and newest familiarity date takes precedence',()=>{
 const a={kind:'familiar',id:'a',at,day,result:'known'},b={...a,at:old};
 assert.equal(p.knownAuditDates([a,b]).get('a'),Date.parse(at));
 assert.equal(p.normalizeEvidence(Array(5010).fill(a)).length,5000);
});
test('actual elapsed gap is preserved only for delayed events; legacy missing gaps remain absent',()=>{const e={kind:'word',id:'issue',day,at,result:'good',delayed:true,gapMs:4*86400000};assert.equal(p.normalizeEvidence([e])[0].gapMs,4*86400000);assert.equal(p.normalizeEvidence([{...e,delayed:false}])[0].gapMs,undefined);assert.equal(p.normalizeEvidence([{...e,gapMs:10}])[0].gapMs,undefined);assert.equal(p.gap({lastReviewed:old},now),4*86400000);assert.equal(p.gap({lastReviewed:at},now),undefined);assert.equal(event({attempts:1,memory:{lastReviewed:old}},true).gapMs,4*86400000)});
