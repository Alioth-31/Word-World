'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
function setup(initialState){
 const html=fs.readFileSync(path.join(root,'app/index.html'),'utf8');
 const keys=[...html.matchAll(/\sid="([^"]+)"/g)].map(x=>x[1]);
 class ClassList{constructor(xs=[]){this.set=new Set(xs)}add(s){this.set.add(s)}remove(s){this.set.delete(s)}contains(s){return this.set.has(s)}toggle(s,v){if(v===undefined)v=!this.contains(s);if(v)this.add(s);else this.remove(s);return v}}
 class El {
   constructor(id=''){this.id=id;this.style={};this.hidden=false;this.classList=new ClassList();this.dataset={};this.events={};this.children=[];this.value='';this.innerHTML='';this.textContent='';this.firstChild={textContent:''};this.checked=false;this.scrollTop=0;}
   addEventListener(type,fn){(this.events[type]||=[]).push(fn)}
   dispatch(type,ev={}){for(const fn of this.events[type]||[])fn({target:this,preventDefault(){},...ev})}
   appendChild(el){this.children.push(el)}
   replaceChildren(){this.children=[]}
   setAttribute(key,val){this[key]=val}
   focus(){}
   scrollTo(){}
   remove(){}
   click(){this.dispatch('click')}
   closest(){return this}
   querySelector(sel){return sel==='.is-selected'?chips.find(c=>c.classList.contains('is-selected')):null}
 }
 const els=new Map(keys.map(k=>[k,new El(k)]));
 const nav=['today','library','records'].map(page=>{const e=new El();e.dataset.page=page;return e});
 const chips=['all','P0','P1','P2','P3','cet6','saved','pending','known','weak'].map(level=>{const e=new El();e.dataset.level=level;if(level==='all')e.classList.add('is-selected');return e});
 for(const k of ['study-shell','detail-shell','finish-shell','rating-buttons','reveal-content'])els.get(k).classList.add('is-hidden');
 const local=new Map(initialState?[['wordworld_state_v1',JSON.stringify(initialState)]]:[]);
 const doc={
   getElementById:k=>{assert.ok(els.has(k),'missing ID in HTML: '+k);return els.get(k)},
   querySelectorAll:s=>s==='.nav-link'?nav:s==='.filter-chip'?chips:[],
   createElement:t=>new El(t),createDocumentFragment:()=>new El('fragment'),
   documentElement:{classList:new ClassList(),style:{}},
   addEventListener(type,fn){this.events||(this.events={});this.events[type]=fn},
   body:new El('body')
 };
 const localStorage={getItem:k=>local.get(k)||null,setItem:(k,v)=>local.set(k,String(v))};
 const win={WORD_WORLD_VOCAB:[],WORD_WORLD_META:null,StudyScheduler:null,scrollTo(){},addEventListener(){},Capacitor:null};
 const ctx=vm.createContext({window:win,document:doc,localStorage,Date,Intl,console,navigator:{vibrate(){}},setTimeout:fn=>{fn();return 1},clearTimeout(){},Blob,URL,TextEncoder,SpeechSynthesisUtterance:class {},confirm:()=>true});
 const js=f=>vm.runInContext(fs.readFileSync(path.join(root,f),'utf8'),ctx,{filename:f});
 js('app/data/vocabulary.js');js('app/data/exam1.js');js('app/js/content.js');js('app/js/srs-fallback.js');js('app/js/fsrs-engine.js');
 els.get('library-order').value='priority';els.get('search-words').value='';
 js('app/js/app.js');
 return {els,doc,win,local,nav,chips};
}
test('app boots and displays current vocabulary size in daily overview',()=>{
 const {els,win}=setup();
 assert.equal(win.WORD_WORLD_VOCAB.length,win.WORD_WORLD_META.sample?125:5530);
 assert.match(els.get('home-total').innerHTML,new RegExp(String(win.WORD_WORLD_VOCAB.length)));
 assert.equal(els.get('home-due').textContent,20);
 assert.equal(els.get('hero-unit').textContent,'今日新词');
 assert.equal(els.get('start-new').hidden,true);
 assert.ok(els.get('view-today').classList.contains('view-active'));
});
test('study flow: active recall -> reveal -> rating -> persisted review',()=>{
 const {els,local}=setup();
 els.get('start-new').dispatch('click');
 assert.equal(els.get('study-shell').classList.contains('is-hidden'),false);
 assert.ok(els.get('study-prompt').classList.contains('is-hidden')===false);
 assert.equal(els.get('rating-buttons').classList.contains('is-hidden'),true);
 els.get('reveal-answer').dispatch('click');
 assert.equal(els.get('reveal-content').classList.contains('is-hidden'),false);
 const current=els.get('study-word').textContent;
 const grade=new (class {closest(){return {dataset:{rating:'good'}}}})();
 els.get('rating-buttons').dispatch('click',{target:grade});
 const stored=JSON.parse(local.get('wordworld_state_v1'));
 assert.ok(stored.progress[current.toLowerCase()]);
 assert.equal(stored.progress[current.toLowerCase()].lastRating,'good');
 assert.ok(Date.parse(stored.progress[current.toLowerCase()].due)>Date.now());
 assert.equal(stored.daily[Object.keys(stored.daily)[0]].new,1);
});
test('library navigation, search and detail are independent from study',()=>{
 const {els,nav,win}=setup();
 nav[1].dispatch('click');
 assert.ok(els.get('view-library').classList.contains('view-active'));
 assert.match(els.get('library-count').textContent,new RegExp(String(win.WORD_WORLD_VOCAB.length)));
 els.get('search-words').value='abandon';els.get('search-words').dispatch('input');
 assert.equal(els.get('library-count').textContent,'1 词');
 els.get('word-list').dispatch('click',{target:{closest:()=>({dataset:{word:'abandon'}})}});
 assert.equal(els.get('detail-word').textContent,'abandon');
 assert.equal(els.get('detail-shell').classList.contains('is-hidden'),false);
 assert.equal(els.get('study-shell').classList.contains('is-hidden'),true);
 els.get('close-detail').dispatch('click');
 assert.equal(els.get('detail-shell').classList.contains('is-hidden'),true);
});
test('study screen labels ranking provenance accurately',()=>{
 const {els,win}=setup();
 els.get('start-new').dispatch('click');
 els.get('reveal-answer').dispatch('click');
 if(win.WORD_WORLD_META.sample){
   assert.equal(els.get('study-ranking').textContent,'示例词汇');
   assert.match(els.get('context-source').textContent,/自编例句/);
 }else{
   assert.match(els.get('study-ranking').textContent,/重要性 #[0-9]+ · 来源词频 #[0-9]+（[0-9,]+ 次）/);
   assert.equal(win.WORD_WORLD_VOCAB.length,5530);
 }
});
test('direct lookup -> bookmark -> recall -> completion -> return to home',()=>{
 const {els,nav,local}=setup();
 nav[1].dispatch('click');
 els.get('word-list').dispatch('click',{target:{closest:()=>({dataset:{word:'abandon'}})}});
 els.get('detail-bookmark').dispatch('click');
 let state=JSON.parse(local.get('wordworld_state_v1'));
 assert.equal(state.saved.abandon,true);
 els.get('detail-start').dispatch('click');
 assert.equal(els.get('detail-shell').classList.contains('is-hidden'),true);
 assert.equal(els.get('study-word').textContent,'abandon');
 els.get('reveal-answer').dispatch('click');
 els.get('rating-buttons').dispatch('click',{target:{closest:()=>({dataset:{rating:'easy'}})}});
 assert.equal(els.get('finish-shell').classList.contains('is-hidden'),false);
 assert.equal(els.get('finish-count').textContent,'1');
 els.get('finish-home').dispatch('click');
 assert.equal(els.get('finish-shell').classList.contains('is-hidden'),true);
 assert.equal(els.get('view-today').classList.contains('view-active'),true);
 state=JSON.parse(local.get('wordworld_state_v1'));
 assert.equal(state.progress.abandon.lastRating,'easy');
});
test('forgotten words recur once in the same session',()=>{
 const {els,nav,local}=setup();
 nav[1].dispatch('click');
 els.get('word-list').dispatch('click',{target:{closest:()=>({dataset:{word:'abandon'}})}});
 els.get('detail-start').dispatch('click');
 els.get('reveal-answer').dispatch('click');
 els.get('rating-buttons').dispatch('click',{target:{closest:()=>({dataset:{rating:'again'}})}});
 assert.equal(els.get('study-word').textContent,'abandon');
 assert.equal(els.get('study-index').textContent,'02 / 02');
 els.get('reveal-answer').dispatch('click');
 els.get('rating-buttons').dispatch('click',{target:{closest:()=>({dataset:{rating:'good'}})}});
 assert.equal(els.get('finish-shell').classList.contains('is-hidden'),false);
 assert.equal(els.get('finish-count').textContent,'2');
 const state=JSON.parse(local.get('wordworld_state_v1'));
 assert.equal(state.progress.abandon.reviews,2);
});

test('importance and frequency sorting are independent in the vocabulary browser',()=>{
 const {els,nav,win}=setup();
 if(win.WORD_WORLD_META.sample)return;
 nav[1].dispatch('click');
 const ranked=win.WORD_WORLD_VOCAB;
 assert.equal(els.get('word-list').children[0].children[0].dataset.word,ranked[0].word);
 els.get('library-order').value='frequency';
 els.get('library-order').dispatch('change');
 assert.equal(els.get('word-list').children[0].children[0].dataset.word,'the');
 assert.equal(ranked.filter(w=>w.priority.core).length,3050);
 assert.equal(ranked.filter(w=>w.word.toLowerCase()==='may').length,2);
 assert.ok(ranked.every(w=>w.word && w.meaning && w.phonetic));
});
test('case-distinct source entries retain independent progress',()=>{
 const {els,nav,local,win}=setup();
 if(win.WORD_WORLD_META.sample)return;
 nav[1].dispatch('click');
 for(const word of ['may','May']){
   els.get('word-list').dispatch('click',{target:{closest:()=>({dataset:{word}})}});
   els.get('detail-start').dispatch('click');
   assert.equal(els.get('study-word').textContent,word);
   els.get('reveal-answer').dispatch('click');
   els.get('rating-buttons').dispatch('click',{target:{closest:()=>({dataset:{rating:'easy'}})}});
   els.get('finish-home').dispatch('click');
 }
 const data=JSON.parse(local.get('wordworld_state_v1'));
 assert.ok(data.progress.may);
 assert.ok(data.progress.May);
});

test('new-word study order can switch from importance to source frequency',()=>{
 const {els,nav,local,win}=setup();
 if(win.WORD_WORLD_META.sample)return;
 nav[2].dispatch('click');
 els.get('study-order').value='frequency';
 els.get('study-order').dispatch('change');
 assert.equal(JSON.parse(local.get('wordworld_state_v1')).prefs.studyOrder,'frequency');
 els.get('start-new').dispatch('click');
 assert.equal(els.get('study-word').textContent,'the');
});

test('daily order switch persists and controls the next new-word session',()=>{
 const {els,local,win}=setup();
 if(win.WORD_WORLD_META.sample)return;
 els.get('today-study-order').value='frequency';
 els.get('today-study-order').dispatch('change');
 assert.equal(els.get('study-order').value,'frequency');
 assert.equal(JSON.parse(local.get('wordworld_state_v1')).prefs.studyOrder,'frequency');
 els.get('start-review').dispatch('click');
 assert.equal(els.get('study-word').textContent,'the');
});
test('dictionary details distinguish importance rank from source frequency rank',()=>{
 const {els,nav,win}=setup();
 if(win.WORD_WORLD_META.sample)return;
 nav[1].dispatch('click');
 els.get('word-list').dispatch('click',{target:{closest:()=>({dataset:{word:'the'}})}});
 const source=win.WORD_WORLD_VOCAB.find(w=>w.word==='the');
 assert.ok(els.get('detail-priority').textContent.includes(`重要性 #${source.priority.rank} · 来源词频 #${source.priority.frequencyRank}（${source.frequency.toLocaleString('en-US')} 次）`));
});

test('English I order controls the library and next new word independently',()=>{
 const {els,win,local}=setup();
 if(win.WORD_WORLD_META.sample)return;
 const rows=win.WORD_WORLD_EXAM1.rows, top=rows.find(r=>r[4]===1);
 assert.ok(top);
 els.get('library-order').value='exam1';
 els.get('library-order').dispatch('change');
 const row=els.get('word-list').children[0].children[0];
 assert.equal(row.dataset.word,top[0]);
 assert.match(row.innerHTML,/英语一估计词频 #1/);
 els.get('today-study-order').value='exam1';
 els.get('today-study-order').dispatch('change');
 assert.equal(els.get('study-order').value,'exam1');
 assert.equal(JSON.parse(local.get('wordworld_state_v1')).prefs.studyOrder,'exam1');
 els.get('start-review').click();
 assert.equal(els.get('study-word').textContent,top[0]);
});

test('known words are reversible, excluded from new study, and distinct from learned words',()=>{
 const {els,win,local,nav,chips}=setup();
 const word=win.WORD_WORLD_VOCAB[0].word;
 nav[1].click();
 els.get('word-list').dispatch('click',{target:{closest:()=>({dataset:{word}})}});
 els.get('detail-known').click();
 let state=JSON.parse(local.get('wordworld_state_v1'));
 assert.equal(state.known[word],true);
 assert.equal(Object.keys(state.progress).length,0);
 els.get('close-detail').click();
 const known=chips.find(c=>c.dataset.level==='known');
 els.get('level-filters').dispatch('click',{target:known});
 assert.equal(els.get('library-count').textContent,'1 词');
 els.get('word-list').dispatch('click',{target:{closest:()=>({dataset:{word}})}});
 els.get('detail-known').click();
 assert.equal(els.get('library-count').textContent,'0 词');
 state=JSON.parse(local.get('wordworld_state_v1'));
 assert.equal(Object.keys(state.known).length,0);
});
test('skipping a familiar new word replaces it without counting it as learned or reviewed',()=>{
 const {els,win,local}=setup();
 els.get('start-review').click();
 const first=els.get('study-word').textContent;
 els.get('reveal-answer').click();
 assert.equal(els.get('study-known').hidden,false);
 els.get('study-known').click();
 const state=JSON.parse(local.get('wordworld_state_v1'));
 assert.equal(state.known[first],true);
 assert.equal(Object.keys(state.progress).length,0);
 assert.equal(Object.values(state.daily)[0].new,0);
 assert.equal(Object.values(state.daily)[0].reviews,0);
 assert.ok(els.get('study-word').textContent!==first);
 const restored=setup(state);
 restored.els.get('start-review').click();
 assert.ok(restored.els.get('study-word').textContent!==first);
});
test('CET6 focus prioritizes overlapping words and persists separately from review state',()=>{
 const {els,win,local}=setup();
 if(win.WORD_WORLD_META.sample)return;
 els.get('study-focus').value='cet6';
 els.get('study-focus').dispatch('change');
 const state=JSON.parse(local.get('wordworld_state_v1'));
 assert.equal(state.prefs.focus,'cet6');
 assert.equal(state.prefs.studyOrder,'personal');
 els.get('start-review').click();
 const word=els.get('study-word').textContent;
 assert.ok(win.WORD_WORLD_VOCAB.find(w=>w.word===word).tags.includes('六级'));
});
test('old records load without known status and existing learned words cannot be excluded',()=>{
 const {els,local}=setup();
 els.get('start-review').click();
 const word=els.get('study-word').textContent;
 els.get('reveal-answer').click();
 els.get('rating-buttons').dispatch('click',{target:{closest:()=>({dataset:{rating:'good'}})}});
 const state=JSON.parse(local.get('wordworld_state_v1'));
 delete state.known;delete state.prefs.focus;
 const restored=setup(state);
 restored.nav[1].click();
 restored.els.get('word-list').dispatch('click',{target:{closest:()=>({dataset:{word}})}});
 assert.equal(restored.els.get('detail-known').hidden,true);
 restored.els.get('detail-known').click();
 assert.equal(restored.els.get('detail-known').hidden,true);
});

test('diagnostic samples 12 distinct words across the full priority range without writing review records',()=>{
 const {els,win,local}=setup();
 const ordered=[...win.WORD_WORLD_VOCAB].sort((a,b)=>(a.priority?.rank??99999)-(b.priority?.rank??99999)||a.word.localeCompare(b.word,'en'));
 const ranks=new Map(ordered.map((w,i)=>[w.word,Math.floor(i*4/ordered.length)]));
 els.get('start-diagnostic').click();
 const words=[],groups=new Set();
 for(let i=0;i<12;i++){
  const word=els.get('study-word').textContent;
  words.push(word);groups.add(ranks.get(word));
  els.get('reveal-answer').click();
  assert.equal(els.get('diagnostic-buttons').hidden,false);
  assert.equal(els.get('rating-buttons').classList.contains('is-hidden'),true);
  // A regular study rating cannot bypass the diagnostic workflow.
  els.get('rating-buttons').dispatch('click',{target:{closest:()=>({dataset:{rating:'easy'}})}});
  els.get('diagnostic-buttons').dispatch('click',{target:{closest:()=>({dataset:{diagnostic:i===0?'unknown':i===1?'partial':'accurate'}})}});
 }
 const state=JSON.parse(local.get('wordworld_state_v1'));
 assert.equal(new Set(words).size,12);
 assert.equal(groups.size,4);
 assert.equal(Object.keys(state.progress).length,0);
 assert.equal(Object.keys(state.diagnostic).length,12);
 assert.equal(Object.keys(state.known).length,10);
 assert.equal(Object.values(state.daily)[0].new,0);
 assert.equal(Object.values(state.daily)[0].reviews,0);
 assert.equal(state.prefs.studyOrder,'personal');
 assert.match(els.get('finish-summary').textContent,/不认识 1，部分认识 1，自评准确 10/);
 els.get('finish-home').click();
 els.get('start-diagnostic').click();
 assert.ok(!words.includes(els.get('study-word').textContent));
});
test('diagnostic weaknesses feed personal learning, then leave the pending queue after normal rating',()=>{
 const {els,local,nav,chips}=setup();
 els.get('start-diagnostic').click();
 const word=els.get('study-word').textContent;
 els.get('reveal-answer').click();
 els.get('diagnostic-buttons').dispatch('click',{target:{closest:()=>({dataset:{diagnostic:'unknown'}})}});
 els.get('leave-study').click();
 nav[1].click();
 els.get('level-filters').dispatch('click',{target:chips.find(c=>c.dataset.level==='weak')});
 assert.equal(els.get('library-count').textContent,'1 词');
 nav[0].click();
 els.get('start-review').click();
 assert.equal(els.get('study-word').textContent,word);
 els.get('reveal-answer').click();
 els.get('rating-buttons').dispatch('click',{target:{closest:()=>({dataset:{rating:'good'}})}});
 els.get('leave-study').click();
 nav[1].click();
 assert.equal(els.get('library-count').textContent,'0 词');
 const state=JSON.parse(local.get('wordworld_state_v1'));
 assert.equal(Object.keys(state.progress).length,1);
 assert.equal(Object.keys(state.diagnostic).length,1);
 assert.equal(Object.values(state.daily)[0].new,1);
});
test('a previously self-reported familiar word can be reclassified by diagnostic evidence',()=>{
 const base=setup(), ordered=[...base.win.WORD_WORLD_VOCAB].sort((a,b)=>(a.priority?.rank??99999)-(b.priority?.rank??99999)||a.word.localeCompare(b.word,'en'));
 base.els.get('start-diagnostic').click();
 const word=base.els.get('study-word').textContent;
 const state={schema:3,progress:{},saved:{},known:{[word]:true},prefs:{goal:20},daily:{}};
 const {els,local}=setup(state);
 els.get('start-diagnostic').click();
 assert.equal(els.get('study-word').textContent,word);
 els.get('reveal-answer').click();
 els.get('diagnostic-buttons').dispatch('click',{target:{closest:()=>({dataset:{diagnostic:'partial'}})}});
 const next=JSON.parse(local.get('wordworld_state_v1'));
 assert.equal(Object.keys(next.known).length,0);
 assert.equal(next.diagnostic[word],'partial');
});
test('older backups preserve their scheduled reviews and ignore invalid diagnostic records',()=>{
 const base=setup();
 base.els.get('start-review').click();
 const word=base.els.get('study-word').textContent;
 base.els.get('reveal-answer').click();
 base.els.get('rating-buttons').dispatch('click',{target:{closest:()=>({dataset:{rating:'good'}})}});
 const state=JSON.parse(base.local.get('wordworld_state_v1'));
 state.diagnostic={bogus:'unknown',[word]:'invalid'};
 const restored=setup(state);
 restored.els.get('start-diagnostic').click();
 assert.ok(restored.els.get('study-word').textContent!==word);
 restored.els.get('reveal-answer').click();
 restored.els.get('diagnostic-buttons').dispatch('click',{target:{closest:()=>({dataset:{diagnostic:'partial'}})}});
 const next=JSON.parse(restored.local.get('wordworld_state_v1'));
 assert.equal(Object.keys(next.progress).length,1);
 assert.equal(Object.keys(next.diagnostic).length,1);
});

test('content catalog stores overlapping word entries only once and retains legacy progress IDs',()=>{
 const {win}=setup();
 const catalog=win.WordWorldContent;
 assert.equal(catalog.allWords.length,win.WORD_WORLD_VOCAB.length);
 assert.equal(catalog.book('netem').words.length,catalog.allWords.length);
 const overlap=catalog.book('cet6-overlap').words;
 if(catalog.normalizeBook('cet6-overlap')==='cet6-overlap'){
  assert.ok(overlap.length<catalog.allWords.length);
  assert.ok(overlap.every(w=>w.tags.includes('六级')&&catalog.getWord(w.word)===w));
  assert.equal(catalog.book('cet6-overlap').complete,false);
 }
 assert.equal(catalog.wordKey('May'),'May');
 assert.equal(catalog.wordKey('may'),'may');
 assert.equal(catalog.normalizeBook('uninstalled'),'netem');
});
test('book switching changes new-word, browse and diagnostic scope and persists',()=>{
 const {els,win,local,nav}=setup();
 const catalog=win.WordWorldContent;
 if(catalog.normalizeBook('cet6-overlap')!=='cet6-overlap')return;
 const overlap=catalog.book('cet6-overlap').words;
 els.get('today-book').value='cet6-overlap';
 els.get('today-book').dispatch('change');
 assert.match(els.get('home-total').innerHTML,new RegExp(String(overlap.length)));
 assert.equal(els.get('settings-book').value,'cet6-overlap');
 nav[1].click();
 assert.equal(els.get('library-count').textContent,overlap.length+' 词');
 assert.equal(els.get('library-book').value,'cet6-overlap');
 nav[0].click();
 els.get('start-diagnostic').click();
 assert.ok(catalog.getWord(els.get('study-word').textContent).tags.includes('六级'));
 els.get('leave-study').click();
 els.get('start-review').click();
 assert.ok(catalog.getWord(els.get('study-word').textContent).tags.includes('六级'));
 const state=JSON.parse(local.get('wordworld_state_v1'));
 const restored=setup(state);
 assert.equal(restored.els.get('today-book').value,'cet6-overlap');
});
test('shared learning state survives book switching and global reviews include other books',()=>{
 const {els,win,local,nav}=setup();
 const catalog=win.WordWorldContent;
 if(catalog.normalizeBook('cet6-overlap')!=='cet6-overlap')return;
 const word=catalog.book('cet6-overlap').words[0].word;
 const other=catalog.allWords.find(w=>!w.tags?.includes('六级')).word;
 nav[1].click();
 els.get('word-list').dispatch('click',{target:{closest:()=>({dataset:{word}})}});
 els.get('detail-start').click();
 els.get('reveal-answer').click();
 els.get('rating-buttons').dispatch('click',{target:{closest:()=>({dataset:{rating:'good'}})}});
 els.get('finish-home').click();
 els.get('today-book').value='cet6-overlap';
 els.get('today-book').dispatch('change');
 assert.match(els.get('home-book-progress').textContent,/已学习 1 词/);
 const state=JSON.parse(local.get('wordworld_state_v1'));
 assert.equal(Object.keys(state.progress).length,1);
 // Use a genuine review record template, but set the nonmember's due date in the past.
 state.progress[catalog.wordKey(other)]={...state.progress[catalog.wordKey(word)],due:'2000-01-01T00:00:00.000Z'};
 const restored=setup(state);
 restored.els.get('start-review').click();
 assert.equal(restored.els.get('study-word').textContent,other);
 assert.equal(restored.els.get('study-mode-label').textContent,'到期复习');
});
test('old backups default to the original book without changing study state',()=>{
 const {els,local}=setup();
 els.get('start-review').click();
 els.get('reveal-answer').click();
 els.get('rating-buttons').dispatch('click',{target:{closest:()=>({dataset:{rating:'good'}})}});
 const state=JSON.parse(local.get('wordworld_state_v1'));
 delete state.prefs.book;
 const restored=setup(state);
 assert.equal(restored.els.get('today-book').value,'netem');
 restored.nav[2].click();
 assert.equal(restored.els.get('records-learned').textContent,1);
});
