'use strict';

function evaluate(report,vocab){
  const budgets=[500,1000,2000],vmap=new Map(vocab.map(w=>[w.word,w]));
  if(vmap.size!==vocab.length||report.words.length!==vocab.length||new Set(report.words.map(w=>w.word)).size!==vocab.length||report.words.some(w=>!vmap.has(w.word)))throw Error('Vocabulary mismatch');
  const years=report.scope.years;
  if(years.join(',')!==Array.from({length:16},(_,i)=>2010+i).join(','))throw Error('Expected 2010–2025 corpus');
  const rows=report.words.map(w=>({...w,priority:vmap.get(w.word).priority})).filter(r=>!/\s/.test(r.word));
  const cmp=(a,b)=>a.word.localeCompare(b.word,'en');
  const definitions={
    exact:{score:r=>r.exact,description:'Training exact-match count',temporal:true},
    estimated:{score:r=>r.exact+r.inferred,description:'Training exact + inferred count',temporal:true},
    weighted:{score:r=>r.exact+.5*r.inferred,description:'Training exact + 0.5 inferred count',temporal:true},
    years:{score:r=>r.weightedYears,description:'Training years, exact hit 1; inferred-only hit 0.5',temporal:true},
    hybrid25:{score:r=>.75*r.weightedLog+.25*r.yearShare,description:'75% log weighted count + 25% weighted year share',temporal:true},
    hybrid50:{score:r=>.5*r.weightedLog+.5*r.yearShare,description:'50% log weighted count + 50% weighted year share',temporal:true},
    hybrid75:{score:r=>.25*r.weightedLog+.75*r.yearShare,description:'25% log weighted count + 75% weighted year share',temporal:true},
    mixed:{score:r=>-r.priority.frequencyRank,description:'Full upstream mixed frequency (retrospective comparator)',temporal:false},
    v2:{score:r=>-r.priority.rank,description:'Bundled V2 importance (retrospective comparator)',temporal:false}
  };
  const groups={all:r=>true,nonbasic:r=>!['A1','A2'].includes(r.priority.cefr),knownB:r=>['B1','B2','C1','C2'].includes(r.priority.cefr)};
  const range=(r,lo,hi)=>{
    let exact=0,inferred=0,weightedYears=0;
    for(const [year,[e,i]] of Object.entries(r.byYear)){if(+year<lo||+year>hi)continue;exact+=e;inferred+=i;weightedYears+=e>0?1:i>0?.5:0;}
    return {exact,inferred,weightedYears};
  };
  function period(train,test){
    if(train[1]>=test[0])throw Error('Overlapping train/test years');
    const features=rows.map(r=>({...r,...range(r,...train)}));
    const max=Math.max(1,...features.map(r=>r.exact+.5*r.inferred));
    for(const r of features){r.weightedLog=Math.log1p(r.exact+.5*r.inferred)/Math.log1p(max);r.yearShare=r.weightedYears/(train[1]-train[0]+1)}
    const result={train,test,groups:{}};
    for(const [group,include] of Object.entries(groups)){
      const eligible=features.filter(include);
      const testRows=new Map(eligible.map(r=>[r.word,range(r,...test)]));
      const groupResult={eligible:eligible.length,outcomes:{}};
      for(const [kind,getCount] of Object.entries({exact:r=>r.exact,estimated:r=>r.exact+r.inferred})){
        const target=new Map([...testRows].map(([word,v])=>[word,getCount(v)]));
        const total=[...target.values()].reduce((a,b)=>a+b,0),types=[...target.values()].filter(n=>n>0).length;
        const scores={};
        for(const [name,definition] of Object.entries(definitions)){
          const order=[...eligible].sort((a,b)=>definition.score(b)-definition.score(a)||cmp(a,b));
          scores[name]=budgets.map(k=>{
            const top=order.slice(0,k),tokens=top.reduce((sum,r)=>sum+target.get(r.word),0),distinct=top.filter(r=>target.get(r.word)>0).length;
            return {k,tokens,distinct,tokenCoverage:tokens/total,typeCoverage:distinct/types};
          });
        }
        groupResult.outcomes[kind]={total,types,scores};
      }
      result.groups[group]=groupResult;
    }
    return result;
  }
  const validation=period([2010,2017],[2018,2021]);
  // Select solely on validation, equally weighting token and type coverage at each budget.
  const objective=scores=>scores.reduce((sum,m)=>sum+m.tokenCoverage+m.typeCoverage,0)/(scores.length*2);
  const candidates=Object.keys(definitions).filter(k=>definitions[k].temporal);
  const selection=candidates.map(name=>({name,objective:objective(validation.groups.nonbasic.outcomes.exact.scores[name])})).sort((a,b)=>b.objective-a.objective||a.name.localeCompare(b.name,'en'));
  const selected=selection[0].name;
  const holdout=period([2010,2021],[2022,2025]);
  return {schema:1,sourceRevision:report.source.revision,scope:{excluded:'multiword entries excluded to avoid overlapping phrase counts',groups:{all:'all single-word entries',nonbasic:'exclude CEFR A1/A2; unknown retained',knownB:'only B1/B2/C1/C2'},denominator:'matched vocabulary tokens and distinct entries in each held-out subset; not all passage tokens',selection:'Mean of exact-target token and type coverage at 500/1000/2000 on nonbasic validation subset; no holdout selection',limitations:'2024 vocabulary and CEFR labels are retrospectively defined. Upstream frequency and V2 may include evaluation years and are descriptive comparators, not temporally independent models. Exact matches are not sense-disambiguated. Vocabulary coverage is not measured exam performance.'},budgets,models:Object.fromEntries(Object.entries(definitions).map(([name,{description,temporal}])=>[name,{description,temporal}])),selection,selected,validation,holdout};
}
module.exports={evaluate};
