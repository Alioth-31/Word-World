'use strict';

const SECTIONS = new Map([
  ['cloze', 1],
  ['reading', 4],
  ['translation_sentences', 1]
]);
const normalize = text => String(text).normalize('NFC').replace(/[’‘]/g, "'").replace(/[‐‑]/g, '-');
const lexicalKey = word => normalize(word).toLowerCase();

// Only frequent, unambiguous grammatical transformations are considered.
// Exact vocabulary matches always take precedence; ambiguous candidates are left unmatched.
const irregular = {
  am:'be',is:'be',are:'be',was:'be',were:'be',been:'be',being:'be',
  has:'have',had:'have',having:'have',does:'do',did:'do',done:'do',
  went:'go',gone:'go',got:'get',gotten:'get',made:'make',took:'take',taken:'take',
  came:'come',saw:'see',seen:'see',said:'say',thought:'think',knew:'know',known:'know',
  found:'find',gave:'give',given:'give',told:'tell',felt:'feel',left:'leave',
  brought:'bring',bought:'buy',caught:'catch',taught:'teach',kept:'keep',held:'hold',
  met:'meet',stood:'stand',understood:'understand',became:'become',began:'begin',
  begun:'begin',wrote:'write',written:'write',spoke:'speak',spoken:'speak',
  drove:'drive',driven:'drive',grew:'grow',grown:'grow',chose:'choose',chosen:'choose',
  ran:'run',ate:'eat',eaten:'eat',drank:'drink',drunk:'drink',fell:'fall',fallen:'fall',
  broke:'break',broken:'break',wore:'wear',worn:'wear',won:'win',lost:'lose',
  spent:'spend',sent:'send',built:'build',led:'lead',paid:'pay',sold:'sell',
  heard:'hear',read:'read',meant:'mean',dealt:'deal',sought:'seek',drew:'draw',
  drawn:'draw',flew:'fly',flown:'fly',rose:'rise',risen:'rise',shook:'shake',
  shaken:'shake',children:'child',men:'man',women:'woman',teeth:'tooth',feet:'foot',
  mice:'mouse',people:'person'
};
function candidates(token) {
  const result=new Set();
  const add=x=>{if(x.length>=2&&x!==token)result.add(x)};
  if(Object.hasOwn(irregular,token))add(irregular[token]);
  if(/ies$/.test(token)&&token.length>4)add(token.slice(0,-3)+'y');
  if(/ves$/.test(token)&&token.length>4){add(token.slice(0,-3)+'f');add(token.slice(0,-3)+'fe')}
  if(/(?:ches|shes|sses|xes|zes|oes)$/.test(token))add(token.slice(0,-2));
  if(/s$/.test(token)&&!/(?:ss|us|is)$/.test(token))add(token.slice(0,-1));
  if(/(?:ed|ing)$/.test(token)){
    const stem=token.replace(/(?:ed|ing)$/,'');
    add(stem);add(stem+'e');
    if(/(.)\1$/.test(stem)&&/[b-df-hj-np-tv-z]$/.test(stem))add(stem.slice(0,-1));
    if(/ied$/.test(token))add(token.slice(0,-3)+'y');
  }
  return result;
}
function makeMatcher(words) {
  const byKey=new Map(), phrases=new Map();
  for(const word of words){
    if(typeof word!=='string'||!word.trim())throw Error('Invalid vocabulary entry');
    const key=lexicalKey(word);
    if(!byKey.has(key))byKey.set(key,[]);
    byKey.get(key).push(word);
    if(key.includes(' ')){
      const first=key.split(' ')[0];
      if(!phrases.has(first))phrases.set(first,[]);
      phrases.get(first).push({word,parts:key.split(' ')});
    }
  }
  for(const list of phrases.values())list.sort((a,b)=>b.parts.length-a.parts.length||a.word.localeCompare(b.word,'en'));
  function exact(token) {
    const list=byKey.get(lexicalKey(token));
    if(!list)return null;
    if(list.length===1)return list[0];
    return list.find(w=>normalize(w)===normalize(token))||null;
  }
  function inferred(token) {
    const key=lexicalKey(token);
    if(byKey.has(key)||!/^[a-z]+$/.test(key))return null;
    const matches=new Set();
    for(const base of candidates(key)){
      const list=byKey.get(base);
      if(list?.length===1&&list[0]===base)matches.add(list[0]);
    }
    return matches.size===1?[...matches][0]:null;
  }
  return {exact,inferred,phrases};
}
function paragraphs(paper,year) {
  if(paper?.year!==year||paper.exam!=='英语一'||!Array.isArray(paper.sections))throw Error('Invalid English I paper '+year);
  const groups=new Map([...SECTIONS.keys()].map(k=>[k,[]]));
  for(const section of paper.sections){
    for(const group of section.groups||[]){
      const type=group.type==='translation'?'translation_sentences':group.type;
      if(!groups.has(type))continue;
      const expected=type==='cloze'?/^Section I Use of English$/:type==='reading'?/^Section II Reading Comprehension.*Part A$/:/^Section II Reading Comprehension.*Part C$/;
      if(!expected.test(section.title||''))throw Error('Unexpected section for '+type+' in '+year);
      const passages=typeof group.passage==='string'?[group.passage]:group.passage;
      if(!Array.isArray(passages)||!passages.length||passages.some(p=>typeof p!=='string'||!p.trim()))throw Error('Missing passage '+year+' '+type);
      groups.get(type).push(passages);
    }
  }
  for(const [type,n] of SECTIONS)if(groups.get(type).length!==n)throw Error('Incomplete '+year+' '+type+': expected '+n+' groups');
  return [...groups].flatMap(([type,lists])=>lists.flatMap(list=>list.map(text=>({type,text}))));
}
function countPaper(paper,year,words) {
  const matcher=makeMatcher(words),counts=new Map();
  const totals={tokens:0,exact:0,inferred:0,unmatched:0,phrases:0,bySection:{cloze:0,reading:0,translation_sentences:0},paragraphs:0};
  const add=(word,kind)=>{if(!counts.has(word))counts.set(word,[0,0]);counts.get(word)[kind]++};
  for(const {type,text} of paragraphs(paper,year)){
    totals.paragraphs++;
    // Underlining is formatting, not text. Blanks remain barriers between tokens.
    const cleaned=normalize(text).replace(/<\/?u>/gi,'').replace(/<[^>]*>/g,' ').replace(/\{\{\s*\d+\s*\}\}/g,' | ');
    if(/[\u4e00-\u9fff]/.test(cleaned))throw Error('Unexpected Chinese text in '+year+' '+type);
    const tokens=[...cleaned.matchAll(/[A-Za-z]+(?:['-][A-Za-z]+)*/g)];
    totals.tokens+=tokens.length;totals.bySection[type]+=tokens.length;
    for(let i=0;i<tokens.length;i++){
      const token=tokens[i][0],word=matcher.exact(token);
      if(word){add(word,0);totals.exact++}
      else {const base=matcher.inferred(token);if(base){add(base,1);totals.inferred++}else totals.unmatched++}
      // Phrases are supplemental overlapping matches, not added to token coverage.
      for(const phrase of matcher.phrases.get(lexicalKey(token))||[]){
        let matched=true;
        for(let k=1;k<phrase.parts.length;k++){
          const prev=tokens[i+k-1],next=tokens[i+k];
          if(!next||lexicalKey(next[0])!==phrase.parts[k]||!/^\s+$/.test(cleaned.slice(prev.index+prev[0].length,next.index))){matched=false;break}
        }
        if(matched){add(phrase.word,0);totals.phrases++;break}
      }
    }
  }
  return {year,totals,counts:Object.fromEntries([...counts].sort((a,b)=>a[0].localeCompare(b[0],'en')))};
}
function aggregate(yearly,words) {
  const seen=new Set(),records=Object.fromEntries(words.map(word=>[word,{exact:0,inferred:0,years:0}]));
  const totals={tokens:0,exact:0,inferred:0,unmatched:0,phrases:0,paragraphs:0};
  for(const row of [...yearly].sort((a,b)=>a.year-b.year)){
    if(seen.has(row.year))throw Error('Duplicate year '+row.year);
    seen.add(row.year);
    for(const k of Object.keys(totals))totals[k]+=row.totals[k];
    for(const [word,[exact,inferred]] of Object.entries(row.counts)){
      if(!Object.hasOwn(records,word))throw Error('Unknown vocabulary key '+word);
      const r=records[word];r.exact+=exact;r.inferred+=inferred;if(exact+inferred>0)r.years++;
    }
  }
  return {years:[...seen].sort((a,b)=>a-b),totals,records};
}
function buildReport(yearly,words,source) {
  if(new Set(words).size!==words.length)throw Error('Duplicate vocabulary entries');
  const sorted=[...yearly].sort((a,b)=>a.year-b.year);
  if(sorted.map(x=>x.year).join(',')!==source.papers.map(x=>x.year).join(','))throw Error('Source year coverage mismatch');
  const agg=aggregate(sorted,words);
  const compareWord=(a,b)=>a[0].localeCompare(b[0],'en');
  const entries=Object.entries(agg.records);
  function ranks(getCount){
    const result=new Map(),ordered=[...entries].sort((a,b)=>getCount(b[1])-getCount(a[1])||compareWord(a,b));
    let rank=0,last=null;
    ordered.forEach(([word,v],i)=>{const count=getCount(v);if(count!==last){rank=i+1;last=count}result.set(word,count>0?rank:null)});
    return result;
  }
  const exactRanks=ranks(v=>v.exact),estimatedRanks=ranks(v=>v.exact+v.inferred);
  const rows=entries.sort((a,b)=>(b[1].exact+b[1].inferred)-(a[1].exact+a[1].inferred)||compareWord(a,b)).map(([word,v])=>{
    const byYear=Object.fromEntries(sorted.filter(y=>Object.hasOwn(y.counts,word)).map(y=>[String(y.year),y.counts[word]]));
    return {word,exact:v.exact,inferred:v.inferred,years:v.years,exactRank:exactRanks.get(word),estimatedRank:estimatedRanks.get(word),byYear};
  });
  return {schema:1,source,scope:{years:agg.years,groups:['cloze','reading','translation_sentences'],excluded:['part B','questions','answers','explanations','writing','cloze missing words'],matching:'case-normalized surface forms plus unique candidate inflection estimate; case-distinct entries use literal spelling; no POS disambiguation',rank:'competition rank among positive counts; zero observations have null rank',annualCounts:'[exact,inferred]'},totals:agg.totals,annual:sorted.map(y=>({year:y.year,...y.totals,distinct:Object.keys(y.counts).length})),words:rows};
}
module.exports={countPaper,aggregate,candidates,buildReport};
