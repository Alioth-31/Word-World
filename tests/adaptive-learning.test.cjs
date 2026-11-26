'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const a=require('../app/js/adaptive-learning.js'),p=require('../app/js/learning-policy.js');
const day='2026-11-25',now=new Date(day+'T10:00:00Z').toISOString();
const base={day,budget:30,goal:20,newWords:200,newSkills:20,events:[],daily:{new:0,reviews:0},materials:[],timings:[],materialWeeklyMinutes:90};
const plan=x=>a.plan(x,p.plan(x));
const costs=(kind,seconds,n=25)=>Array.from({length:n},()=>({kind,seconds,day:'2026-11-24'}));
const events=(n,skill,correct)=>Array.from({length:n},(_,i)=>({kind:'ability',id:skill+i,skill,correct,delayed:true,first:false,at:now}));
test('observed costs adapt with a conservative prior and ignore extreme pauses',()=>{
 assert.equal(a.costs([]).newWord,35);
 assert.ok(a.costs(costs('newWord',12)).newWord<20);
 assert.ok(a.costs(costs('newWord',70)).newWord>55);
 assert.equal(a.normalize([{kind:'newWord',seconds:999,day}]).length,0);
 assert.equal(a.record([],'newWord',day,1).length,0);
 assert.equal(a.record([],'newWord',day,30)[0].seconds,30);
});
test('slow and fast learners receive different actual task quantities',()=>{
 const fixed={...base,budget:20,materialWeeklyMinutes:0};
 const slow=plan({...fixed,timings:[...costs('newWord',70),...costs('newAbility',70)]});
 const fast=plan({...fixed,timings:[...costs('newWord',12),...costs('newAbility',15)]});
 assert.ok(slow.wordNew<fast.wordNew);assert.ok(slow.wordNew*slow.costs.newWord+slow.skillNew*slow.costs.newAbility<=slow.remaining);
});
test('protected input can be selected despite overdue work, but review stays accessible',()=>{
 const dueWords=Array.from({length:180},(_,i)=>({id:String(i),due:now}));
 const x=plan({...base,budget:20,dueWords,daily:{new:0,reviews:58}});
 assert.equal(x.wordNew,0);assert.equal(x.primary,'materialInput');assert.ok(x.wordReviewBatch>0);assert.ok(x.debt>0);assert.ok(x.reserve>=300);
 const y=plan({...base,budget:20,dueWords,daily:{new:0,reviews:58},materialWeeklyMinutes:0});assert.equal(y.primary,'wordReview');
});
test('actual recorded duration replaces estimated time for matching observed activity',()=>{
 const x=plan({...base,daily:{new:1,reviews:1},timings:[{day,kind:'newWord',seconds:65},{day,kind:'repair',seconds:18}]});
 assert.equal(x.spent,83);
});
test('a material session already completed today releases the daily reservation',()=>{
 const x=plan({...base,materials:[{day,mode:'reading',minutes:15}],materialSpent:900});assert.equal(x.reserve,0);
});
test('goal migration changes weekly portfolio while preserving accumulated study time',()=>{
 const materials=[{day,mode:'reading',minutes:40},{day,mode:'listening',minutes:5}];
 const cet=a.portfolio(materials,day,'cet6',120),exam=a.portfolio(materials,day,'exam1',120);
 assert.equal(cet.next,'listening');assert.equal(exam.next,'reading');assert.equal(cet.modes.find(m=>m.mode==='reading').actual,40);assert.equal(exam.modes.find(m=>m.mode==='reading').actual,40);
});
test('independent delayed evidence, distinct items, no first-attempt or repeated-click inflation',()=>{
 const e=events(5,'context',false),one=Array(20).fill(e[0]);
 assert.equal(a.skillNeed(one).context.priority,'explore');assert.equal(a.skillNeed(e).context.priority,'repair');
 assert.equal(a.skillNeed(e.map(x=>({...x,first:true}))).context.n,0);
 assert.equal(a.skillNeed(e.map(x=>({...x,delayed:false}))).context.n,0);
 assert.equal(a.skillNeed(events(6,'spelling',true)).spelling.priority,'maintain');
});
test('supported weak skill gets extra opportunity while all eligible skills are explored',()=>{
 const bank=['context','collocation','spelling'].flatMap(skill=>Array.from({length:8},(_,i)=>({id:skill+i,skill})));
 const order=a.orderSkills(bank,{},events(5,'context',false),7);const types=order.map(x=>x.skill);
 assert.deepEqual(types.slice(0,3),['context','collocation','spelling']);assert.ok(types.filter(x=>x==='context').length>types.filter(x=>x==='spelling').length);assert.equal(new Set(order.map(x=>x.id)).size,7);
});
test('learning route distinguishes unknown, partial, repeated delayed lapses and ordinary recall',()=>{
 assert.equal(a.instruction({id:'a',diagnostic:'unknown'}).strategy,'encode');assert.equal(a.instruction({id:'a',diagnostic:'partial',hasExtra:true}).strategy,'contrast');
 const e=Array.from({length:2},()=>({kind:'word',id:'a',delayed:true,assisted:false,result:'again'}));
 assert.equal(a.instruction({id:'a',review:true,events:e}).strategy,'repair');assert.equal(a.instruction({id:'b',review:true,events:e}).strategy,'probe');
 assert.equal(a.instruction({id:'a',review:true,events:e.map(x=>({...x,assisted:true}))}).strategy,'probe');
});
test('material route depends on observed comprehension and previous difficulty',()=>{
 assert.equal(a.materialRoute({comprehension:'smooth',blocks:0}).maxFollowups,0);
 assert.equal(a.materialRoute({comprehension:'partial',blocks:3}).route,'acquisition');
 const history=Array.from({length:2},()=>({mode:'reading',observation:{comprehension:'blocked'}}));
 assert.match(a.materialRoute({comprehension:'blocked',blocks:5,history}).guide,/更短/);
});
test('exact duplicate contextual memory links to existing target, never merges other senses',()=>{
 const o={id:'a:1',kind:'sense',word:'address',cue:'address congestion',note:'应对拥堵',followup:true,memory:{due:now}};
 const history=[{obstacles:[o]}],s={obstacles:[{...o,id:'b:1',memory:null},{...o,id:'b:2',note:'地址',memory:null}]};
 const out=a.deduplicate(history,s);assert.equal(out.obstacles[0].linkedTo,'a:1');assert.equal(out.obstacles[0].followup,false);assert.equal(out.obstacles[1].followup,true);assert.equal(history[0].obstacles[0].followup,true);
});
test('new-work time invariant holds across budgets, backlogs, learner costs and input targets',()=>{
 for(const budget of [10,20,30,60,120])for(const n of [0,1,25,120])for(const seconds of [8,35,90])for(const materialWeeklyMinutes of [0,90,240]){
  const x=plan({...base,budget,materialWeeklyMinutes,timings:costs('newWord',seconds),dueWords:Array.from({length:n},()=>({due:now}))});
  assert.ok(x.wordNew*x.costs.newWord+x.skillNew*x.costs.newAbility<=Math.max(0,x.remaining-x.debt-x.reserve));assert.ok(x.wordNew<=20&&x.skillNew<=6);assert.equal(x.wordReviewBatch>0,n>0);
 }
});
