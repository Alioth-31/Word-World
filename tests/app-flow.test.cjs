'use strict';
const assert = require('node:assert/strict');
const test = require('node:test');
const vm = require('node:vm');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname,'..');
function setup(){
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
 const chips=['all','P0','P1','P2','P3','cet6','saved'].map(level=>{const e=new El();e.dataset.level=level;if(level==='all')e.classList.add('is-selected');return e});
 for(const k of ['study-shell','detail-shell','finish-shell','rating-buttons','reveal-content'])els.get(k).classList.add('is-hidden');
 const local=new Map();
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
 js('app/data/vocabulary.js');js('app/js/srs-fallback.js');js('app/js/fsrs-engine.js');
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
   assert.match(els.get('study-ranking').textContent,/重要性 #[0-9]+ · 来源词频 [0-9,]+/);
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
