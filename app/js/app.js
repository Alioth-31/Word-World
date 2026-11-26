(() => {
'use strict';
const content=window.WordWorldContent;
const VOCAB=content.allWords;
const abilities=window.WordWorldAbilities;
const learning=window.WordWorldLearning,adaptive=window.WordWorldAdaptive;
let vocabularyUI=null,analysisUI=null,footballUI=null;
const {wordKey,getWord,hasExam1,examRow}=content;
const STORAGE_KEY = 'wordworld_state_v1';
const todayKey = () => {const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const $ = id => document.getElementById(id);
const escapeHTML = str => String(str??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rank = w => Number(w.priority?.rank ?? 99999);
const frequency = w => Number(w.frequency ?? w.priority?.mixedFreq ?? 0);
const priorityCompare = (a,b) => rank(a)-rank(b) || a.word.localeCompare(b.word,'en');
const frequencyCompare = (a,b) => frequency(b)-frequency(a) || (Number(a.priority?.frequencyRank??99999)-Number(b.priority?.frequencyRank??99999)) || a.word.localeCompare(b.word,'en');
// Keep source-frequency and English I statistics independent.
const examCompare=(a,b)=>(examRow(a)?.[4]??Infinity)-(examRow(b)?.[4]??Infinity)||priorityCompare(a,b);
function normalizeOrder(value){return value==='personal'||value==='frequency'||value==='exam1'&&hasExam1?value:'priority'}
function normalizeFocus(value){return ['cet6','exam1','balanced'].includes(value)?value:'balanced'}
function diagnosticResult(word){const key=wordKey(word);return Object.hasOwn(state.diagnostic,key)?state.diagnostic[key]:null}
function diagnosticNeed(w){const result=diagnosticResult(w.word);return result==='unknown'?2:result==='partial'?1:0}
function pendingDiagnostic(w){return !progressOf(w.word)&&!isKnown(w.word)&&diagnosticNeed(w)>0}
function diagnosticSample(){
 const bands=Array.from({length:4},()=>[]);
 const ordered=[...activeBook().words].sort(priorityCompare);
 ordered.forEach((w,i)=>{
  if(!progressOf(w.word)&&!diagnosticResult(w.word))bands[Math.min(3,Math.floor(i*4/ordered.length))].push(w);
 });
 const selected=[],used=new Set();
 for(const band of bands){
  const count=Math.min(3,band.length);
  for(let i=0;i<count;i++){
   const w=band[Math.floor((i+.5)*band.length/count)];
   selected.push(w);used.add(w.word);
  }
 }
 // Fill any short strata with still-unassessed entries; never repeat a word within a round.
 for(const band of bands)for(const w of band){
  if(selected.length===12)break;
  if(!used.has(w.word)){selected.push(w);used.add(w.word)}
 }
 return selected;
}
function personalCompare(a,b){
 const need=Number(pendingDiagnostic(b))*diagnosticNeed(b)-Number(pendingDiagnostic(a))*diagnosticNeed(a);
 if(need)return need;
 const focus=state.prefs.focus;
 if(focus==='cet6'){
  const overlap=Number(!!b.tags?.includes('六级'))-Number(!!a.tags?.includes('六级'));
  if(overlap)return overlap;
 }
 if(focus==='exam1'&&hasExam1){
  // Keep the original importance tiers; favor observed English I evidence within each 100-rank band.
  const band=w=>Math.floor((rank(w)-1)/100);
  return band(a)-band(b)||examCompare(a,b);
 }
 return priorityCompare(a,b);
}
function normalizeState(obj){
 const result={...defaults(),...obj,prefs:{...defaults().prefs,...obj.prefs}};
 result.prefs.studyOrder=normalizeOrder(result.prefs.studyOrder);
 result.prefs.focus=normalizeFocus(result.prefs.focus);
 result.prefs.book=content.normalizeBook(result.prefs.book);
 const known=Object.create(null);
 if(result.known&&typeof result.known==='object'&&!Array.isArray(result.known)){
  for(const w of VOCAB){const key=wordKey(w.word);if(Object.hasOwn(result.known,key)&&result.known[key]===true&&!Object.hasOwn(result.progress,key))known[key]=true}
 }
 result.known=known;
 const diagnostic=Object.create(null);
 if(result.diagnostic&&typeof result.diagnostic==='object'&&!Array.isArray(result.diagnostic)){
  for(const w of VOCAB){const key=wordKey(w.word);if(Object.hasOwn(result.diagnostic,key)&&['unknown','partial','accurate'].includes(result.diagnostic[key]))diagnostic[key]=result.diagnostic[key]}
 }
 result.diagnostic=diagnostic;
 result.abilities=abilities.normalize(result.abilities);
 result.football=window.WordWorldFootball.normalize(result.football);
 result.evidence=learning.normalizeEvidence(result.evidence);result.timings=adaptive.normalize(result.timings);
 result.prefs.budgetMinutes=learning.budgetMinutes(result.prefs.budgetMinutes);
 result.prefs.vocabularyScope=true;
 return result;
}
function examSummary(w){
 const r=examRow(w);if(!r)return '';
 if(r[4]===null)return '英语一 2010–2025：所统计正文未检出';
 return '英语一估计词频 #'+r[4]+' · '+(r[1]+r[2])+' 次（直接 '+r[1]+' / 词形推断 '+r[2]+'） · '+r[3]+'/16 年';
}
function rankingText(w){
 return '重要性 #'+(w.priority?.rank??'—')+' · 来源词频 #'+(w.priority?.frequencyRank??'—')+'（'+frequency(w).toLocaleString('en-US')+' 次）'+(hasExam1?' · '+examSummary(w):'');
}
const todayDate = todayKey();
let state = loadState();
state.prefs.studyOrder=normalizeOrder(state.prefs.studyOrder);
let activePage = 'today';
let session = null;
let abilitySession=null;
let currentDetail = null;
let libraryResults = [];
let visibleCount = 48;
let toastTimer = null;
let clickBlock = false;

function loadState(){
  try {const obj=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');
    if(obj && obj.schema===3 && obj.progress && typeof obj.progress==='object')return normalizeState(obj);
  } catch(err){console.warn('无法读取学习记录:',err)}
  return defaults();
}
function defaults(){return {schema:3,progress:{},saved:{},known:Object.create(null),diagnostic:Object.create(null),abilities:Object.create(null),evidence:[],timings:[],football:window.WordWorldFootball.normalize(null),prefs:{vocabularyScope:true,budgetMinutes:30,goal:20,theme:'night',reduceMotion:false,studyOrder:'priority',focus:'exam1',book:'netem'},daily:{},createdAt:new Date().toISOString()}}
function persist(){ try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));return true}catch(err){toast('本地存储失败，请及时导出备份');return false} }
function daily(){if(!state.daily[todayKey()])state.daily[todayKey()]={new:0,reviews:0,success:0};return state.daily[todayKey()]}
function progressOf(word){const key=wordKey(word);return Object.hasOwn(state.progress,key)?state.progress[key]:null}
function isKnown(word){return Object.hasOwn(state.known,wordKey(word))&&state.known[wordKey(word)]===true&&!progressOf(word)}
function activeBook(){return content.book(state.prefs.book)}
function knownCount(words=VOCAB){return words.filter(w=>isKnown(w.word)).length}
function bookProgress(){
 const words=activeBook().words;
 return {total:words.length,learned:words.filter(w=>progressOf(w.word)).length,known:knownCount(words)};
}
function renderBookControls(){
 const book=activeBook();
 for(const id of ['today-book','library-book','settings-book'])$(id).value=book.id;
 const progress=bookProgress();
 $('home-book-name').textContent=book.title;
 $('home-book-progress').textContent='本词书已学习 '+progress.learned+' 词 · 自认熟悉 '+progress.known+' 词';
 $('records-book-progress').textContent=book.title+'：已学习 '+progress.learned+' / '+progress.total+' 词 · 自认熟悉 '+progress.known+' 词';
}
function setBook(value){
 if(session||abilitySession)return;
 state.prefs.book=content.normalizeBook(value);
 persist();renderBookControls();renderHome();renderRecords();renderLibrary();
}
function dueWords(){const now=Date.now();return VOCAB.filter(w=>{const p=progressOf(w.word);return p && Date.parse(p.due)<=now}).sort((a,b)=>Date.parse(progressOf(a.word).due)-Date.parse(progressOf(b.word).due)||priorityCompare(a,b))}
function pendingNew(){return activeBook().words.filter(w=>!progressOf(w.word)&&!isKnown(w.word)).sort(state.prefs.studyOrder==='personal'?personalCompare:state.prefs.studyOrder==='exam1'?examCompare:state.prefs.studyOrder==='frequency'?frequencyCompare:priorityCompare)}
function countStable(){return Object.values(state.progress).filter(p=>p && p.interval>=21*86_400_000).length}
function activeLearned(){return VOCAB.filter(w=>progressOf(w.word)).length}
function label(w){return w.priority?.level || '考研词'}
function hintRank(w){return Number.isInteger(w.priority?.rank) ? `排序 #${w.priority.rank}` : '待评级'}
function isSample(){return content.metadata.sample===true}
function isSaved(word){return !!state.saved[wordKey(word)]}
function toggleSave(word){const id=wordKey(word);if(state.saved[id])delete state.saved[id];else state.saved[id]=true;persist();updateSaveButtons();if(activePage==='library')renderLibrary();toast(state.saved[id]?'已加入收藏':'已取消收藏')}
function updateSaveButtons(){if(session){$('study-bookmark').classList.toggle('is-saved',isSaved(session.wordIds[session.index]));$('study-bookmark').setAttribute('aria-pressed',isSaved(session.wordIds[session.index]))}if(currentDetail){$('detail-bookmark').classList.toggle('is-saved',isSaved(currentDetail));$('detail-bookmark').setAttribute('aria-pressed',isSaved(currentDetail))}}
function toast(text){const node=$('toast');node.textContent=text;node.classList.add('is-visible');clearTimeout(toastTimer);toastTimer=setTimeout(()=>node.classList.remove('is-visible'),2500)}
function haptic(){if(navigator.vibrate && !state.prefs.reduceMotion)try{navigator.vibrate(10)}catch{}}
function speak(word){if(!('speechSynthesis' in window)){toast('设备暂不支持系统语音合成');return}
  try{window.speechSynthesis.cancel();const utterance=new SpeechSynthesisUtterance(word);utterance.lang='en-US';utterance.rate=.86;utterance.pitch=1;window.speechSynthesis.speak(utterance)}catch{toast('发音不可用，请检查系统英语语音包')}
}
function animateControls(){document.documentElement.classList.toggle('reduce-motion',state.prefs.reduceMotion)}
function page(which,focus=false){
  if(!['today','library','records'].includes(which))return;
  activePage=which;
  for(const name of ['today','library','records'])$('view-'+name).classList.toggle('view-active',name===which);
  document.querySelectorAll('.nav-link').forEach(x=>{x.classList.toggle('is-active',x.dataset.page===which);x.setAttribute('aria-current',x.dataset.page===which?'page':'false')});
  if(which==='today')renderHome();if(which==='library'){renderLibrary();if(focus)$('search-words').focus()}if(which==='records')renderRecords();
  window.scrollTo(0,0);$('app-frame').scrollTop=0;
}
const vocabularyBridge=window.WordWorldVocabularyBridge({lesson:window.WordWorldLesson,learning,adaptive,content,abilities,readState:()=>state,day:todayKey,now:()=>new Date(),priority:id=>{const w=getWord(id);return w?window.WordWorldExamPriority.score(w,examRow):1},scheduler:()=>window.StudyScheduler,save:persist,beforeLearning:()=>footballUI?.begin(),footballEvent:e=>footballUI?.event(e)});
const examPriority=window.WordWorldExamPriority,examInfo=w=>examPriority.info(w,examRow),examSense=id=>Object.hasOwn(window.WordWorldExamSenses,id)?window.WordWorldExamSenses[id]:null;
function vocabularyPlan(onlyReview=false){return vocabularyBridge.plan({fresh:examPriority.order(pendingNew(),examRow,{weak:w=>diagnosticNeed(w)}),onlyReview});}
function renderVocabularyHome(){
 footballUI?.refresh();
 const plan=vocabularyPlan(),count=dueWords().length+abilities.bank.filter(i=>state.abilities[i.id]&&Date.parse(state.abilities[i.id].memory.due)<=Date.now()).length;
 $('vocab-new').textContent=daily().new+'/'+state.prefs.goal;$('vocab-due').textContent=count;
 $('vocab-hero-title').textContent=plan.tasks.length?(plan.reviewCount&&!plan.newCount?'先复习旧词':'学习一小组单词'):'今日建议已完成';
 $('vocab-hero-detail').textContent=plan.tasks.length?[plan.newCount?plan.newCount+' 个新词':'',plan.reviewCount?plan.reviewCount+' 项复习':'',plan.tasks.some(t=>t.kind==='skill'&&!t.due)?'巩固词汇用法':''].filter(Boolean).join(' · '):'可以浏览词库，或调整每日目标。';
 $('vocab-start').disabled=!plan.tasks.length;$('vocab-review').disabled=!count;
 const queue=$('vocab-queue');queue.replaceChildren();for(const t of plan.tasks.slice(0,4)){const w=getWord(t.word);if(!w)continue;const el=document.createElement('div');el.className='ww-queue-row';el.textContent=w.word+'  ·  '+(t.kind==='skill'?'用法巩固':examInfo(w).tier+' · '+examPriority.summary(w,examRow));queue.appendChild(el)}
 const core=VOCAB.filter(w=>w.priority?.level==='P0'),learned=core.filter(w=>progressOf(w.word)).length;$('vocab-core-count').textContent=learned+'/'+core.length;$('vocab-core-bar').style.width=(core.length?100*learned/core.length:0)+'%';$('vocab-core-note').textContent='已开始学习的核心词；不等于全部掌握。';
}
function renderHome(){
 renderVocabularyHome();
 renderBookControls();renderAbilitySummary();
  $('today-study-order').value=normalizeOrder(state.prefs.studyOrder);
  const due=dueWords().length;const done=daily();const goal=Number(state.prefs.goal)||20;
  const newAvailable=Math.max(0,goal-done.new),newTotal=Math.min(newAvailable,pendingNew().length);
  const date=new Intl.DateTimeFormat('zh-CN',{month:'numeric',day:'numeric',weekday:'long'}).format(new Date());
  $('today-date').textContent=date;
  // A single primary task: due reviews take precedence; otherwise show new vocabulary.
  const mode=due ? 'review' : newTotal ? 'new' : 'done';
  $('home-due').textContent=mode==='review' ? due : newTotal;
  $('hero-unit').textContent=mode==='review'?'待复习词汇':mode==='new'?'今日新词':'今日任务已完成';
  $('hero-label').firstChild.textContent=mode==='review'?'到期复习':mode==='new'?'今日计划':'学习完成';
  $('home-review-progress').textContent=`${done.reviews} 次已复习`;
  $('hero-descr').textContent=mode==='review'?'先完成到期复习，再认识新的词。':mode==='new'?(state.prefs.studyOrder==='personal'?'根据学习目标与个人词汇状态安排新词。':state.prefs.studyOrder==='exam1'?'当前没有到期复习，从英语一正文高频词开始。':state.prefs.studyOrder==='frequency'?'当前没有到期复习，从来源高频词开始。':'当前没有到期复习，从综合重要性较高的词开始。'):'今天的任务已经完成。可以继续浏览词库。';
  $('start-review').firstChild.textContent=mode==='review'?'开始今日复习 ':mode==='new'?'开始新词学习 ':'浏览全部词库 ';
  $('start-new').hidden=mode!=='review';
  $('home-new').innerHTML=`${newTotal} <small>词</small>`;
  $('home-total').innerHTML=`${activeBook().words.length} <small>词</small>`;
  const percentage=Math.min(100,Math.round(done.new/Math.max(1,goal)*100));
  $('day-percent').textContent=percentage+'%';$('day-progress').style.width=percentage+'%';
  $('today-finished').textContent=`今日新学 ${done.new} 词 · 已复习 ${done.reviews} 次`;
  $('today-goal').textContent=`目标 ${goal} 词`;
 $('home-known').textContent=`本词书已排除 ${knownCount(activeBook().words)} 个自认熟悉词`;
 const assessed=activeBook().words.filter(w=>diagnosticResult(w.word)).length,weak=activeBook().words.filter(pendingDiagnostic).length;
 $('home-diagnostic').textContent=`已诊断 ${assessed} 词 · ${weak} 个薄弱词待学`;
 $('start-diagnostic').disabled=!activeBook().words.some(w=>!progressOf(w.word)&&!diagnosticResult(w.word));
}
function renderRecords(){
 $('vocab-budget').value=String(state.prefs.budgetMinutes);
 analysisUI?.render();
 renderBookControls();renderAbilitySummary();
 $('records-learned').textContent=activeLearned();$('records-due').textContent=dueWords().length;
 $('records-known').textContent=knownCount();$('records-diagnostic').textContent=Object.keys(state.diagnostic).length;$('records-weak').textContent=VOCAB.filter(pendingDiagnostic).length;$('study-focus').value=state.prefs.focus;
 $('records-strong').textContent=countStable();$('records-saved').textContent=Object.keys(state.saved).length;
 $('new-goal').value=String(state.prefs.goal);$('study-order').value=state.prefs.studyOrder||'priority';$('study-theme').value=state.prefs.theme;$('reduce-motion').checked=!!state.prefs.reduceMotion;
}
function getLibraryResults(){
 const q=$('search-words').value.trim().toLowerCase();
 const active=$('level-filters').querySelector('.is-selected')?.dataset.level||'all';
 const order=$('library-order').value;
 let result=activeBook().words.filter(w=>{
  if(active==='saved' && !isSaved(w.word))return false;
  if(active==='known' && !isKnown(w.word))return false;
  if(active==='weak' && !pendingDiagnostic(w))return false;
  if(active==='polysemy' && examSense(w.word)?.kind!=='polysemy')return false;
  if(active==='pending' && (isKnown(w.word)||progressOf(w.word)))return false;
  if(active==='cet6' && !w.tags?.includes('六级'))return false;
  if(active!=='all' && !['saved','cet6','known','pending','weak','polysemy'].includes(active) && label(w)!==active)return false;
  if(q && !w.word.toLowerCase().includes(q) && !String(w.meaning||'').toLowerCase().includes(q) && !String(w.extraMeaning||'').toLowerCase().includes(q) && !String(examSense(w.word)?.focus||'').toLowerCase().includes(q) && !String(examSense(w.word)?.phrase||'').toLowerCase().includes(q) && !(examSense(w.word)?.additional||[]).some(a=>[a.meaning,a.phrase].some(t=>t.toLowerCase().includes(q))))return false;
  return true;
 });
 if(order==='personal')result=examPriority.order(result,examRow,{weak:w=>diagnosticNeed(w)});
 else if(order==='exam1'&&hasExam1)result.sort(examCompare);
 else if(order==='frequency')result.sort(frequencyCompare);
  else if(order==='alpha')result.sort((a,b)=>a.word.localeCompare(b.word,'en'));
 else if(order==='unlearned')result.sort((a,b)=>Number(!!progressOf(a.word)||isKnown(a.word))-Number(!!progressOf(b.word)||isKnown(b.word))||priorityCompare(a,b));
 else result.sort(priorityCompare);
 return result;
}
function renderLibrary(reset=true){
 renderBookControls();
 if(reset)visibleCount=48;
 libraryResults=getLibraryResults();$('library-count').textContent=`${libraryResults.length} 词`;
 const list=$('word-list');list.replaceChildren();
 if(!libraryResults.length){const msg=document.createElement('p');msg.className='empty-words';msg.textContent='没有找到匹配的单词。';list.appendChild(msg)}
 const frag=document.createDocumentFragment();
 for(const [i,w] of libraryResults.slice(0,visibleCount).entries()){
  const row=document.createElement('button');row.type='button';row.className='word-row';row.dataset.word=w.word;
  const learned=!!progressOf(w.word),known=isKnown(w.word);
  row.innerHTML=`<span class="word-index">${($('library-order').value==='exam1'&&hasExam1?String(examRow(w)?.[4]??'—'):String((($('library-order').value==='frequency'?w.priority?.frequencyRank:w.priority?.rank)??(i+1))).padStart(2,'0'))}</span><span class="word-description"><strong>${escapeHTML(w.word)}</strong><small>${escapeHTML(w.meaning||'暂无释义')}</small><small class="word-freq">${$('library-order').value==='frequency'?`混合来源词频 #${w.priority?.frequencyRank??'—'} · ${frequency(w).toLocaleString('en-US')} 次`:escapeHTML(($('library-order').value==='exam1'&&examInfo(w).exam?.rank!=null?'英语一估计词频 #'+examInfo(w).exam.rank+' · ':'')+examPriority.summary(w,examRow))} · ${escapeHTML(examInfo(w).tier)}${examSense(w.word)?.kind==='polysemy'?' · 熟词僻义':''}${w.priority?.core?' · 核心词表':''}</small></span><span class="word-status ${learned||known?'is-learned':''}">${learned?'已学习':known?'自认熟悉':escapeHTML(label(w))}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65"><path d="m9 5 7 7-7 7"/></svg>`;
  frag.appendChild(row);
 }
 list.appendChild(frag);
 $('load-more').hidden=visibleCount>=libraryResults.length;
 const meta=content.metadata;
 $('dataset-disclaimer').textContent=isSample() ? '当前仅包含演示词汇，暂无可靠的词频排名。' : `当前词书：${activeBook().title}（${activeBook().words.length.toLocaleString('en-US')} 词）。${activeBook().complete?'':'仅为现有考研词库中带六级标签的重合词，并非完整六级词表。'} 统一词库收录 ${VOCAB.length.toLocaleString('en-US')} 个词条。综合重要性是启发式学习排序；来源词频基于四六级、考研、专四专八混合语料，非纯英语一词频。词义由开放数据提供，尚未逐项人工核校。${hasExam1?' 英语一词频统计 2010–2025 年完形、阅读 A 与翻译正文，含保守词形推断；未检出不等于不考。':''}`; 
}
function showDetail(word){
 const w=getWord(word);if(!w)return;
 currentDetail=w.word;const shell=$('detail-shell');shell.classList.remove('is-hidden');shell.setAttribute('aria-hidden','false');
 $('detail-word').textContent=w.word;$('detail-phonetic').textContent=w.phonetic||'点击发音';
 $('detail-priority').textContent=examInfo(w).tier;
 $('detail-meaning').textContent=w.meaning||'暂无词义';const f=examSense(w.word),meta=examInfo(w);$('detail-extra').textContent=[w.extraMeaning,...(f?.additional||[]).map(a=>a.meaning+' · '+a.phrase+'\n'+a.example+'\n'+a.translation)].filter(Boolean).join('\n\n');$('detail-extra-fold').hidden=!$('detail-extra').textContent;$('detail-extra-fold').open=false;$('detail-focus').hidden=!f;$('detail-focus-label').textContent=f?.kind==='polysemy'?'熟词僻义':'重点搭配';$('detail-focus-meaning').textContent=f?.focus||'';$('detail-focus-phrase').textContent=f?.phrase||'';$('detail-focus-contrast').textContent=f?'常见义：'+f.base+'。'+f.contrast:'';$('detail-focus-more').open=false;$('detail-data-fold').open=false;$('detail-data-summary').textContent=meta.tier+' · 综合重要性 #'+(meta.importance??'—')+' · '+examPriority.summary(w,examRow)+(meta.sourceRank?' · 混合来源词频 #'+meta.sourceRank+'（'+Number(meta.sourceCount||0).toLocaleString('en-US')+' 次）':'');
 if(f){$('detail-context').hidden=false;$('detail-example').textContent=f.example;$('detail-example-zh').textContent=f.translation;$('detail-context-label').textContent='学习例句';$('detail-example-source').textContent='原创学习例句 · 非真题';}else if(w.example){$('detail-context').hidden=false;$('detail-example').textContent=w.example;$('detail-example-zh').textContent=w.exampleZh||'';
  $('detail-context-label').textContent=w.exampleType==='exam'?'真题语境 / EXAM CONTEXT':'例句 / CONTEXT';
  $('detail-example-source').textContent=w.exampleSource||'例句来源待核对';
 }else $('detail-context').hidden=true;
 $('detail-evidence').textContent=w.priority?.basis || (isSample()?'本词条为示例数据，不表示经真题核实的重点义项。':'释义与排序来自公开词汇资料，重要义项仍需结合真题校对。');
 renderKnownDetail(w);$('detail-scroller')?.scrollTo(0,0);updateSaveButtons();
}
function renderKnownDetail(w){
 const button=$('detail-known');
 button.hidden=!!progressOf(w.word);
 button.textContent=isKnown(w.word)?'恢复至新词计划':'已认识，暂不安排';
 button.setAttribute('aria-pressed',String(isKnown(w.word)));
 $('detail-known-note').textContent=progressOf(w.word)?'此词已有复习记录，按记忆调度继续复习。':isKnown(w.word)?'自认熟悉，未纳入记忆稳定统计。可随时恢复学习。':'如果已经认识此词，可暂时从新词计划排除。';
}
function toggleKnownDetail(){
 const w=getWord(currentDetail);if(!w||progressOf(w.word))return;
 const key=wordKey(w.word);
 if(isKnown(w.word))delete state.known[key];else state.known[key]=true;
 persist();renderKnownDetail(w);if(activePage==='library')renderLibrary();else if(activePage==='records')renderRecords();else renderHome();
}
function hideDetail(){currentDetail=null;$('detail-shell').classList.add('is-hidden');$('detail-shell').setAttribute('aria-hidden','true')}
function startSession(type,fromWord){
 if(!VOCAB.length){toast('当前词库为空');return}
 const due=dueWords();const done=daily();const goal=Number(state.prefs.goal)||20;
 let words=[];
 if(type==='diagnostic'){words=diagnosticSample();if(!words.length){toast('当前没有尚未诊断的未学习词');return}}
 else if(type==='review'){words=due;if(!words.length){toast('目前没有到期的单词');return}}
 else if(type==='direct'){words=[getWord(fromWord)].filter(Boolean)}
 else {const available=Math.max(0,goal-done.new);words=pendingNew().slice(0,available);if(!words.length){toast('今日新词已完成，可以浏览词库或复习');return}}
 session={mode:type,wordIds:words.map(w=>w.word),index:0,ratings:[],repeatCounts:{},skipped:0,diagnosticResults:[],revealed:false};
 hideDetail();$('finish-shell').classList.add('is-hidden');$('study-shell').classList.remove('is-hidden');$('study-shell').setAttribute('aria-hidden','false');
 $('study-shell').dataset.studyTheme=state.prefs.theme;
 document.documentElement.style.overflow='hidden';
 showSessionWord();
}
function showSessionWord(){
 if(!session)return;
 if(session.index>=session.wordIds.length){completeSession();return}
 const w=getWord(session.wordIds[session.index]);if(!w){session.index++;showSessionWord();return}
 session.revealed=false;const count=session.wordIds.length,idx=session.index;
 $('study-mode-label').textContent=session.mode==='diagnostic'?'词汇自测':session.mode==='review'?'到期复习':session.mode==='direct'?'单词巩固':'新词学习';
 $('study-index').textContent=`${String(idx+1).padStart(2,'0')} / ${String(count).padStart(2,'0')}`;
 $('study-progress-fill').style.width=(idx/count*100)+'%';
 $('word-priority').textContent=isSample()?'示例词库':({P0:'考研核心',P1:'考研重点',P2:'考研基础',P3:'考研补充'}[label(w)]||'考研词汇');
 $('word-pos').textContent='MEMORY PRACTICE';
 $('study-word').textContent=w.word;$('study-phonetic').textContent=w.phonetic||'　';
 $('study-prompt').classList.remove('is-hidden');$('reveal-content').classList.add('is-hidden');
 $('reveal-answer').classList.remove('is-hidden');$('rating-buttons').classList.add('is-hidden');$('study-known').hidden=true;$('diagnostic-buttons').hidden=true;
 $('study-scroll').scrollTop=0;updateSaveButtons();
}
function reveal(){if(!session||session.revealed)return;session.revealed=true;
 const w=getWord(session.wordIds[session.index]);if(!w)return;
 haptic();$('study-prompt').classList.add('is-hidden');$('reveal-content').classList.remove('is-hidden');
 $('reveal-answer').classList.add('is-hidden');$('rating-buttons').classList.toggle('is-hidden',session.mode==='diagnostic');$('diagnostic-buttons').hidden=session.mode!=='diagnostic';$('study-known').hidden=session.mode==='diagnostic'||!!progressOf(w.word)||isKnown(w.word);
 $('study-meaning').textContent=w.meaning||'暂无释义';$('study-extra-meaning').textContent=w.extraMeaning?`补充义项：${w.extraMeaning}`:'';
 $('study-ranking').textContent=isSample()?'示例词汇':rankingText(w);
 $('context-block').hidden=!w.example;
 if(w.example){$('context-caption').textContent=w.exampleType==='exam'?'EXAM CONTEXT / 真题语境':'CONTEXT / 语境例句';$('study-example').textContent=w.example;
 $('study-example-zh').textContent=w.exampleZh||'';$('context-source').textContent=w.exampleSource||'来源未核对'}
 $('study-scroll').scrollTo({top:0,behavior:state.prefs.reduceMotion?'instant':'smooth'});
}
function recordDiagnostic(result){
 if(!session||session.mode!=='diagnostic'||!session.revealed||clickBlock||!['unknown','partial','accurate'].includes(result))return;
 const w=getWord(session.wordIds[session.index]);if(!w||progressOf(w.word))return;
 const key=wordKey(w.word);state.diagnostic[key]=result;
 if(result==='accurate')state.known[key]=true;else delete state.known[key];
 state.prefs.studyOrder='personal';session.diagnosticResults.push(result);
 persist();haptic();session.index++;showSessionWord();
}
function skipKnown(){
 if(!session||session.mode==='diagnostic'||!session.revealed||clickBlock)return;
 const w=getWord(session.wordIds[session.index]);if(!w||progressOf(w.word)||isKnown(w.word))return;
 const key=wordKey(w.word);state.known[key]=true;session.skipped++;
 if(session.mode==='new'){
  const queued=new Set(session.wordIds);
  const replacement=pendingNew().find(candidate=>!queued.has(candidate.word));
  if(replacement)session.wordIds.push(replacement.word);
 }
 persist();session.index++;showSessionWord();
}
function recordRating(rating){if(!session||session.mode==='diagnostic'||!session.revealed||clickBlock)return;
 const w=getWord(session.wordIds[session.index]);if(!w)return;
 clickBlock=true;const key=wordKey(w.word),prev=progressOf(w.word),wasNew=!prev,now=new Date();
 if(session.wordIds.slice(0,session.index).includes(w.word)){session.ratings.push(rating);persist();session.index++;clickBlock=false;showSessionWord();return;}
 footballUI?.begin();let result;try{result=window.StudyScheduler.review(prev,rating,now)}catch(err){console.error(err);toast('复习算法出现错误');clickBlock=false;return}
 delete state.known[key];
 state.progress[key]={...prev,...result,reviews:(prev?.reviews||0)+1,lastRating:rating};
 const record=daily();record.reviews++;if(rating==='good'||rating==='easy')record.success++;if(wasNew)record.new++;
 learning.appendEvidence(state.evidence,{kind:'word',id:key,day:todayKey(),at:now.toISOString(),result:rating,delayed:!!prev&&learning.delayed(prev,now),gapMs:learning.gap(prev,now),assisted:false});footballUI?.event({kind:'word',id:'word:'+key,fresh:wasNew,verified:true});session.ratings.push(rating);
 if(rating==='again' && (session.repeatCounts[key]||0)<1){session.repeatCounts[key]=1;session.wordIds.push(w.word)}
 persist();haptic();
 const advance=()=>{if(!session){clickBlock=false;return}session.index++;clickBlock=false;showSessionWord()};
 if(state.prefs.reduceMotion)advance();else setTimeout(advance,170);
}
function completeSession(){
 if(!session)return;
 const diagnostic=session.mode==='diagnostic';
 const total=diagnostic?session.diagnosticResults.length:session.ratings.length,success=diagnostic?session.diagnosticResults.filter(x=>x==='accurate').length:session.ratings.filter(x=>x==='good'||x==='easy').length;
 $('finish-count').textContent=String(total);$('finish-rate-label').textContent=diagnostic?'本轮自评准确回忆比例':'本次回忆成功率';
 $('finish-rate').textContent=total?Math.round(success/total*100)+'%':'0%';
 $('finish-summary').textContent=`这次完成 ${total} 次记忆评价。${success} 次能够顺利回忆。${session.skipped?`另有 ${session.skipped} 个自认熟悉词已从新词计划排除。`:''}`;
 if(diagnostic){const unknown=session.diagnosticResults.filter(x=>x==='unknown').length,partial=session.diagnosticResults.filter(x=>x==='partial').length;
  $('finish-summary').textContent=`本轮自测 ${total} 词：不认识 ${unknown}，部分认识 ${partial}，自评准确 ${success}。薄弱词已进入个性化新词计划；自评准确词暂不安排。本轮结果不代表全部词汇掌握率。`;
 }
 $('study-shell').classList.add('is-hidden');$('study-shell').setAttribute('aria-hidden','true');
 $('finish-shell').classList.remove('is-hidden');$('finish-shell').setAttribute('aria-hidden','false');session=null;
}
function leaveSession(){session=null;$('study-shell').classList.add('is-hidden');$('study-shell').setAttribute('aria-hidden','true');$('finish-shell').classList.add('is-hidden');$('finish-shell').setAttribute('aria-hidden','true');document.documentElement.style.overflow='';page('today')}
function isAppActive(){return !$('study-shell').classList.contains('is-hidden')}
function exportBackup(){
 const json=JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2);
 const filename=`word-world-backup-${todayKey()}.json`;
 const capacitor=window.Capacitor, plugins=capacitor?.Plugins||{};
 const fallback=()=>{const blob=new Blob([json],{type:'application/json;charset=utf-8'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=filename;document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);toast('备份文件已生成')};
 if(capacitor?.isNativePlatform?.() && plugins.Filesystem && plugins.Share){
  (async()=>{try{
    const bytes=new TextEncoder().encode(json);let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
    await plugins.Filesystem.writeFile({path:filename,data:btoa(binary),directory:'CACHE'});
    const uri=await plugins.Filesystem.getUri({path:filename,directory:'CACHE'});
    await plugins.Share.share({title:'Word World 学习记录备份',files:[uri.uri],dialogTitle:'保存学习记录'});
  }catch(err){console.error(err);toast('安卓分享不可用，请检查系统文件权限')}})();
 }else fallback();
}
async function importBackup(file){if(!file)return;
 try{const obj=JSON.parse(await file.text());if(!obj||obj.schema!==3||!obj.progress||typeof obj.progress!=='object'||!obj.prefs){toast('备份文件格式不兼容');return}
  if(Object.keys(obj.progress).length>30000){toast('备份内容超出预期范围');return}
  if(!confirm('导入备份会替换本设备现有的学习记录。确定继续吗？'))return;
  state=normalizeState(obj);persist();renderRecords();renderHome();renderLibrary();toast('学习记录已导入');
 }catch(err){console.error(err);toast('备份文件读取失败')}finally{$('backup-file').value=''}
}
function setStudyOrder(value){
 state.prefs.studyOrder=normalizeOrder(value);
 $('today-study-order').value=state.prefs.studyOrder;
 $('study-order').value=state.prefs.studyOrder;
 persist();renderHome();
}
function renderAbilitySummary(){
 const stats=abilities.summary(state.abilities,activeBook().words,new Date());
 const due=stats.reduce((sum,s)=>sum+s.due,0),total=stats.reduce((sum,s)=>sum+s.total,0),seen=stats.reduce((sum,s)=>sum+s.seen,0);
 $('home-ability-summary').textContent='本词书试点题库：'+seen+'/'+total+' 项已测 · '+due+' 项待复习';
 $('start-ability').disabled=!abilities.queue(state.abilities,activeBook().words,new Date()).length;
 const list=$('ability-stats');list.replaceChildren();
 for(const s of stats){
  const p=document.createElement('p');p.textContent=s.label+'：首次答对 '+s.firstCorrect+'/'+s.seen+' 项 · 题库 '+s.total+' 项 · 待巩固 '+s.weak+' 项 · 到期 '+s.due+' 项';list.appendChild(p);
 }
 const global=abilities.summary(state.abilities,VOCAB,new Date()).reduce((sum,s)=>sum+s.due,0);
 $('start-ability-review').disabled=global===0;
 $('ability-global-due').textContent='全部词书能力复习：'+global+' 项到期';
}
function startAbility(globalReview=false){
 if(session||abilitySession)return;
 const now=new Date();
 const items=abilities.queue(state.abilities,globalReview?VOCAB:activeBook().words,now);
 const queue=globalReview?items.filter(item=>state.abilities[item.id]&&Date.parse(state.abilities[item.id].memory.due)<=now.getTime()):items;
 if(!queue.length){toast('当前没有可安排的能力任务');return}
 abilitySession={queue,index:0,answered:false,correct:0};
 hideDetail();$('ability-shell').classList.remove('is-hidden');$('ability-shell').setAttribute('aria-hidden','false');
 document.documentElement.style.overflow='hidden';showAbility();
}
function showAbility(){
 const s=abilitySession;if(!s)return;
 const item=s.queue[s.index];
 if(!item){
  $('ability-progress').textContent='训练完成';
  $('ability-prompt').textContent='本轮答对 '+s.correct+'/'+s.queue.length+' 项';
  $('ability-target').textContent='已更新独立能力记忆计划；答错项目将按记忆调度再次出现。';
  $('ability-options').replaceChildren();$('ability-form').hidden=true;$('ability-next').hidden=true;
  $('ability-feedback').textContent='';$('ability-close').textContent='返回学习首页';return;
 }
 s.answered=false;
 const q=abilities.variant(item,state.abilities[item.id]);
 $('ability-progress').textContent=abilities.labels[item.skill]+' · '+(s.index+1)+'/'+s.queue.length;
 $('ability-prompt').textContent=q.prompt;$('ability-target').textContent=q.target?'判断划定词语：'+q.target:q.options?'选择恰当搭配':'输入英文单词';
 $('ability-feedback').textContent='';$('ability-next').hidden=true;$('ability-close').textContent='退出训练';
 const list=$('ability-options');list.replaceChildren();
 $('ability-form').hidden=!!q.options;$('ability-input').value='';$('ability-input').disabled=false;$('ability-submit').disabled=false;
 if(q.options)q.options.forEach((option,i)=>{const button=document.createElement('button');button.type='button';button.className='ability-option';button.textContent=option;button.addEventListener('click',()=>answerAbility(i));list.appendChild(button)});
}
function answerAbility(response){
 const s=abilitySession;if(!s||s.answered||s.index>=s.queue.length)return;
 const item=s.queue[s.index],previous=state.abilities[item.id],q=abilities.variant(item,previous);
 if(!q.options&&(typeof response!=='string'||!response.trim()))return;
 const at=new Date();footballUI?.begin();const result=abilities.record(item,previous,response,at,window.StudyScheduler);learning.appendEvidence(state.evidence,learning.abilityEvent(item,previous,result,at,todayKey()));footballUI?.event({kind:'skill',id:'skill:'+item.id,fresh:!previous,verified:true});
 s.answered=true;if(result.lastCorrect)s.correct++;
 state.abilities[item.id]=result;
 // No change to ordinary word review data, familiar flags, or new-word quota.
 persist();$('ability-feedback').textContent=(result.lastCorrect?'回答正确。':'正确答案：'+(q.options?q.options[q.correct]:q.answer)+'。')+item.explanation;
 for(const button of $('ability-options').children)button.disabled=true;
 $('ability-input').disabled=true;$('ability-submit').disabled=true;$('ability-next').hidden=false;
}
function nextAbility(){if(!abilitySession?.answered)return;abilitySession.index++;showAbility()}
function closeAbility(){
 abilitySession=null;$('ability-shell').classList.add('is-hidden');$('ability-shell').setAttribute('aria-hidden','true');document.documentElement.style.overflow='';page('today');
}
function bind(){
 footballUI=window.WordWorldFootballUI.mount({read:()=>state.football,evidence:()=>state.evidence,analysis:()=>window.WordWorldStudyAnalysis.summarize({words:VOCAB,bank:abilities.bank,state,key:wordKey,exam:w=>examInfo(w).exam,isPolysemy:id=>examSense(id)?.kind==='polysemy',today:todayKey()}),rosterData:()=>({words:VOCAB,state,key:wordKey}),openWord:id=>{page('library');showDetail(id)},scope:'考研词库',focusReview:tasks=>vocabularyUI.start(tasks),day:todayKey,plan:()=>vocabularyBridge.matchPlan(examPriority.order(pendingNew(),examRow,{weak:w=>diagnosticNeed(w)})),save:persist,study:()=>{page('today');vocabularyUI.start(vocabularyPlan().tasks,true)}});
 vocabularyUI=window.WordWorldLessonUI.mount({...vocabularyBridge,onStart:footballUI.startLesson,matchFeedback:footballUI.feedback,word:getWord,examInfo,sense:examSense,speak,nextTasks:()=>vocabularyPlan().tasks,onClose:()=>page('today')});
 analysisUI=window.WordWorldStudyAnalysisUI.mount({read:()=>({words:VOCAB,bank:abilities.bank,state,key:wordKey,exam:w=>examInfo(w).exam,isPolysemy:id=>examSense(id)?.kind==='polysemy',today:todayKey()}),scope:'考研词库',open:id=>{page('library');showDetail(id)},study:()=>{page('today');vocabularyUI.start(vocabularyPlan().tasks,true)},review:()=>{page('today');vocabularyUI.start(vocabularyPlan(true).tasks)},focusReview:tasks=>vocabularyUI.start(tasks)});
 $('vocab-start').addEventListener('click',()=>vocabularyUI.start(vocabularyPlan().tasks,true));
 $('vocab-review').addEventListener('click',()=>vocabularyUI.start(vocabularyPlan(true).tasks));
 $('vocab-browse').addEventListener('click',()=>page('library',true));
 $('vocab-budget').addEventListener('change',e=>{state.prefs.budgetMinutes=learning.budgetMinutes(e.target.value);persist();renderHome()});
 $('start-ability').addEventListener('click',()=>startAbility());
 $('start-ability-review').addEventListener('click',()=>startAbility(true));
 $('ability-form').addEventListener('submit',e=>{e.preventDefault();answerAbility($('ability-input').value)});
 $('ability-next').addEventListener('click',nextAbility);
 $('ability-close').addEventListener('click',closeAbility);
 const available=content.listBooks();
 for(const id of ['today-book','library-book','settings-book']){
  const node=$(id);
  const overlap=node.querySelector('option[value="cet6-overlap"]');
  if(overlap)overlap.disabled=!available.find(b=>b.id==='cet6-overlap').count;
  node.addEventListener('change',e=>setBook(e.target.value));
 }
 for(const id of ['today-study-order','study-order','library-order']){
  const option=$(id).querySelector('option[value="exam1"]');if(option)option.disabled=!hasExam1;
 }
 document.querySelectorAll('.nav-link').forEach(el=>el.addEventListener('click',()=>page(el.dataset.page)));
 $('header-search').addEventListener('click',()=>page('library',true));
 $('start-review').addEventListener('click',()=>{if(dueWords().length)startSession('review');else if(pendingNew().length && Number(state.prefs.goal)>daily().new)startSession('new');else page('library')});
 $('start-new').addEventListener('click',()=>startSession('new'));
 $('start-diagnostic').addEventListener('click',()=>startSession('diagnostic'));
 $('diagnostic-buttons').addEventListener('click',e=>{const node=e.target.closest('[data-diagnostic]');if(node)recordDiagnostic(node.dataset.diagnostic)});
 $('browse-words').addEventListener('click',()=>page('library'));
 $('level-filters').addEventListener('click',e=>{const el=e.target.closest('button[data-level]');if(!el)return;document.querySelectorAll('.filter-chip').forEach(c=>c.classList.toggle('is-selected',c===el));renderLibrary()});
 $('search-words').addEventListener('input',()=>renderLibrary());
 $('library-order').addEventListener('change',()=>renderLibrary());
 $('load-more').addEventListener('click',()=>{visibleCount+=48;renderLibrary(false)});
 $('word-list').addEventListener('click',e=>{const el=e.target.closest('button[data-word]');if(el)showDetail(el.dataset.word)});
 $('close-detail').addEventListener('click',hideDetail);
 $('detail-bookmark').addEventListener('click',()=>currentDetail&&toggleSave(currentDetail));
 $('detail-speak').addEventListener('click',()=>currentDetail&&speak(currentDetail));
 $('detail-known').addEventListener('click',toggleKnownDetail);
 $('detail-start').addEventListener('click',()=>currentDetail&&startSession('direct',currentDetail));
 $('study-bookmark').addEventListener('click',()=>session&&toggleSave(session.wordIds[session.index]));
 $('leave-study').addEventListener('click',leaveSession);
 $('study-known').addEventListener('click',skipKnown);
 $('reveal-answer').addEventListener('click',reveal);
 $('study-speak').addEventListener('click',()=>session&&speak(session.wordIds[session.index]));
 $('rating-buttons').addEventListener('click',e=>{const node=e.target.closest('[data-rating]');if(node)recordRating(node.dataset.rating)});
 $('finish-home').addEventListener('click',leaveSession);
 $('new-goal').addEventListener('change',e=>{state.prefs.goal=Number(e.target.value);persist();renderHome()});
 $('study-focus').addEventListener('change',e=>{state.prefs.focus=normalizeFocus(e.target.value);setStudyOrder('personal')});
 $('study-order').addEventListener('change',e=>setStudyOrder(e.target.value));
 $('today-study-order').addEventListener('change',e=>setStudyOrder(e.target.value));
 $('study-theme').addEventListener('change',e=>{state.prefs.theme=e.target.value;persist()});
 $('reduce-motion').addEventListener('change',e=>{state.prefs.reduceMotion=e.target.checked;persist();animateControls()});
 $('export-backup').addEventListener('click',exportBackup);
 $('import-backup').addEventListener('click',()=>$('backup-file').click());
 $('backup-file').addEventListener('change',e=>importBackup(e.target.files?.[0]));
 window.addEventListener('keydown',e=>{
   if(e.key==='Escape'){if(vocabularyUI?.isOpen()){vocabularyUI.close();return}if(abilitySession){closeAbility();return}if(isAppActive()){leaveSession();return}if(!$('detail-shell').classList.contains('is-hidden'))hideDetail();return}
   if(abilitySession||vocabularyUI?.isOpen())return;
   const target=e.target;if(target?.tagName==='INPUT'||target?.tagName==='SELECT')return;
   if(isAppActive()){if(e.key===' '||e.key==='Enter'){if(!session?.revealed){e.preventDefault();reveal()}}else if(session?.revealed&&['1','2','3','4'].includes(e.key))recordRating(['again','hard','good','easy'][Number(e.key)-1])}
   else if(e.key==='/' && $('detail-shell').classList.contains('is-hidden')){e.preventDefault();page('library',true)}
 });
 document.addEventListener('visibilitychange',()=>{if(document.hidden)vocabularyUI?.interrupt();if(!document.hidden){if(activePage==='today')renderHome();else if(activePage==='records')renderRecords()}});
 window.addEventListener('popstate',()=>{if(vocabularyUI?.isOpen())vocabularyUI.close();else if(abilitySession)closeAbility();else if(isAppActive())leaveSession();else if(currentDetail)hideDetail();else page('today')});
 const capacitorApp=window.Capacitor?.Plugins?.App;
 if(capacitorApp?.addListener)capacitorApp.addListener('backButton',()=>{
   if(vocabularyUI?.isOpen())vocabularyUI.close();
   else if(abilitySession)closeAbility();
   else if(isAppActive() || !$('finish-shell').classList.contains('is-hidden'))leaveSession();
   else if(currentDetail)hideDetail();
   else if(activePage!=='today')page('today');
   else capacitorApp.minimizeApp?.();
 });
}
function init(){
 animateControls();bind();page('today');
 if('serviceWorker' in navigator && ['https:','http:'].includes(location.protocol) && !window.Capacitor?.isNativePlatform?.())navigator.serviceWorker.register('./sw.js').catch(e=>console.warn('离线缓存注册失败',e));
 if(isSample())console.info('[Word World] 正在使用演示词库；运行 npm run data 后生成考研完整词库。');
}
init();
})();
