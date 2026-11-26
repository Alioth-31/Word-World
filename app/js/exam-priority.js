/* Exam evidence and personal new-word ordering. No changes to due review dates. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.WordWorldExamPriority=api;})(typeof window==='undefined'?null:window,function(){
 'use strict';
 const tiers={P0:0,P1:1,P2:2,P3:3}, labels={P0:'核心',P1:'重点',P2:'基础',P3:'补充'};
 const rank=w=>Number.isInteger(w.priority?.rank)&&w.priority.rank>0?w.priority.rank:Infinity;
 function evidence(w,row){const r=row?.(w);if(!Array.isArray(r)||r[0]!==w.word||!r.slice(1,4).every(n=>Number.isInteger(n)&&n>=0)||r[3]>16)return null;
  if(r[4]!==null&&(!Number.isInteger(r[4])||r[4]<1))return null;
  return {exact:r[1],inferred:r[2],years:r[3],rank:r[4],total:r[1]+r[2]};}
 function info(w,row){const e=evidence(w,row);return {tier:labels[w.priority?.level]||'未分级',level:w.priority?.level||'',importance:Number.isFinite(rank(w))?rank(w):null,exam:e,sourceRank:w.priority?.frequencyRank??null,sourceCount:w.frequency??w.priority?.mixedFreq??null};}
 // Keep V2 tier boundaries. Within a tier blend its original rank with independent exam evidence.
 // Missing evidence is neutral (baseline score); a measured zero is not treated as missing.
 function score(w,row,total=5530){const base=Math.min(1,rank(w)/total),e=evidence(w,row);if(!e)return base;
  const exam=e.rank===null?1:Math.min(1,e.rank/total);
  const persistence=1-e.years/16;
  return .65*base+.35*(.7*exam+.3*persistence);
 }
 function order(words,row,{mode='personal',weak=()=>0,total=5530}={}){
  const data=words.map(w=>({w,e:evidence(w,row),score:score(w,row,total),weak:Math.max(0,Math.min(2,Number(weak(w))||0))}));
  const cmp=(a,b)=>{if(mode==='frequency')return (a.e?.rank??Infinity)-(b.e?.rank??Infinity)||rank(a.w)-rank(b.w);
   if(mode==='importance')return rank(a.w)-rank(b.w);
   return (tiers[a.w.priority?.level]??4)-(tiers[b.w.priority?.level]??4)|| (a.score-(mode==='personal'?.08*a.weak:0))-(b.score-(mode==='personal'?.08*b.weak:0))||rank(a.w)-rank(b.w);};
  return data.sort((a,b)=>cmp(a,b)||a.w.word.localeCompare(b.w.word,'en')).map(x=>x.w);
 }
 function summary(w,row){const i=info(w,row);return i.exam?i.exam.rank===null?'统计正文未检出':`${i.exam.total} 次 · ${i.exam.years}/16 年`:'暂无英语一统计';}
 return {info,score,order,summary};
});
