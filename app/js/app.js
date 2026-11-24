(() => {
'use strict';
const VOCAB = (window.WORD_WORLD_VOCAB || []).filter(w => w && typeof w.word === 'string' && w.word.trim());
const vocabById = new Map(VOCAB.map(w => [w.word, w]));
const vocabByLower = new Map(VOCAB.map(w => [w.word.toLowerCase(), w]));
const wordKey = word => String(word||'')==='May'||String(word||'')==='March' ? String(word) : String(word||'').toLowerCase();
const STORAGE_KEY = 'wordworld_state_v1';
const todayKey = () => {const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
const $ = id => document.getElementById(id);
const getWord = id => vocabById.get(String(id||'')) || vocabByLower.get(String(id||'').toLowerCase());
const escapeHTML = str => String(str??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const rank = w => Number(w.priority?.rank ?? 99999);
const frequency = w => Number(w.frequency ?? w.priority?.mixedFreq ?? 0);
const priorityCompare = (a,b) => rank(a)-rank(b) || a.word.localeCompare(b.word,'en');
const frequencyCompare = (a,b) => frequency(b)-frequency(a) || (Number(a.priority?.frequencyRank??99999)-Number(b.priority?.frequencyRank??99999)) || a.word.localeCompare(b.word,'en');
// Keep source-frequency and English I statistics independent.
const examAsset=window.WORD_WORLD_EXAM1;
const examRows=new Map(Array.isArray(examAsset?.rows)?examAsset.rows.map(r=>[r[0],r]):[]);
const hasExam1=window.WORD_WORLD_META?.sample!==true && examAsset?.schema===1 &&
 examAsset.years?.length===16 && examRows.size===VOCAB.length && VOCAB.length===5530 &&
 VOCAB.every(w=>examRows.has(w.word));
const examRow=w=>hasExam1?examRows.get(w.word):null;
const examCompare=(a,b)=>(examRow(a)?.[4]??Infinity)-(examRow(b)?.[4]??Infinity)||priorityCompare(a,b);
function normalizeOrder(value){return value==='personal'||value==='frequency'||value==='exam1'&&hasExam1?value:'priority'}
function normalizeFocus(value){return ['cet6','exam1','balanced'].includes(value)?value:'balanced'}
function personalCompare(a,b){
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
 const known=Object.create(null);
 if(result.known&&typeof result.known==='object'&&!Array.isArray(result.known)){
  for(const w of VOCAB){const key=wordKey(w.word);if(Object.hasOwn(result.known,key)&&result.known[key]===true&&!Object.hasOwn(result.progress,key))known[key]=true}
 }
 result.known=known;
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
function defaults(){return {schema:3,progress:{},saved:{},known:Object.create(null),prefs:{goal:20,theme:'night',reduceMotion:false,studyOrder:'priority',focus:'balanced'},daily:{},createdAt:new Date().toISOString()}}
function persist(){ try{localStorage.setItem(STORAGE_KEY,JSON.stringify(state));return true}catch(err){toast('本地存储失败，请及时导出备份');return false} }
function daily(){if(!state.daily[todayKey()])state.daily[todayKey()]={new:0,reviews:0,success:0};return state.daily[todayKey()]}
function progressOf(word){const key=wordKey(word);return Object.hasOwn(state.progress,key)?state.progress[key]:null}
function isKnown(word){return Object.hasOwn(state.known,wordKey(word))&&state.known[wordKey(word)]===true&&!progressOf(word)}
function knownCount(){return VOCAB.filter(w=>isKnown(w.word)).length}
function dueWords(){const now=Date.now();return VOCAB.filter(w=>{const p=progressOf(w.word);return p && Date.parse(p.due)<=now}).sort((a,b)=>Date.parse(progressOf(a.word).due)-Date.parse(progressOf(b.word).due)||priorityCompare(a,b))}
function pendingNew(){return VOCAB.filter(w=>!progressOf(w.word)&&!isKnown(w.word)).sort(state.prefs.studyOrder==='personal'?personalCompare:state.prefs.studyOrder==='exam1'?examCompare:state.prefs.studyOrder==='frequency'?frequencyCompare:priorityCompare)}
function countStable(){return Object.values(state.progress).filter(p=>p && p.interval>=21*86_400_000).length}
function activeLearned(){return VOCAB.filter(w=>progressOf(w.word)).length}
function label(w){return w.priority?.level || '考研词'}
function hintRank(w){return Number.isInteger(w.priority?.rank) ? `排序 #${w.priority.rank}` : '待评级'}
function isSample(){return window.WORD_WORLD_META?.sample === true}
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
function renderHome(){
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
  $('home-total').innerHTML=`${VOCAB.length} <small>词</small>`;
  const percentage=Math.min(100,Math.round(done.new/Math.max(1,goal)*100));
  $('day-percent').textContent=percentage+'%';$('day-progress').style.width=percentage+'%';
  $('today-finished').textContent=`今日新学 ${done.new} 词 · 已复习 ${done.reviews} 次`;
  $('today-goal').textContent=`目标 ${goal} 词`;
 $('home-known').textContent=`已排除 ${knownCount()} 个自认熟悉词`;
}
function renderRecords(){
 $('records-learned').textContent=activeLearned();$('records-due').textContent=dueWords().length;
 $('records-known').textContent=knownCount();$('study-focus').value=state.prefs.focus;
 $('records-strong').textContent=countStable();$('records-saved').textContent=Object.keys(state.saved).length;
 $('new-goal').value=String(state.prefs.goal);$('study-order').value=state.prefs.studyOrder||'priority';$('study-theme').value=state.prefs.theme;$('reduce-motion').checked=!!state.prefs.reduceMotion;
}
function getLibraryResults(){
 const q=$('search-words').value.trim().toLowerCase();
 const active=$('level-filters').querySelector('.is-selected')?.dataset.level||'all';
 const order=$('library-order').value;
 let result=VOCAB.filter(w=>{
  if(active==='saved' && !isSaved(w.word))return false;
  if(active==='known' && !isKnown(w.word))return false;
  if(active==='pending' && (isKnown(w.word)||progressOf(w.word)))return false;
  if(active==='cet6' && !w.tags?.includes('六级'))return false;
  if(active!=='all' && !['saved','cet6','known','pending'].includes(active) && label(w)!==active)return false;
  if(q && !w.word.toLowerCase().includes(q) && !String(w.meaning||'').toLowerCase().includes(q) && !String(w.extraMeaning||'').toLowerCase().includes(q))return false;
  return true;
 });
 if(order==='personal')result.sort((a,b)=>Number(!!progressOf(a.word)||isKnown(a.word))-Number(!!progressOf(b.word)||isKnown(b.word))||personalCompare(a,b));
 else if(order==='exam1'&&hasExam1)result.sort(examCompare);
 else if(order==='frequency')result.sort(frequencyCompare);
  else if(order==='alpha')result.sort((a,b)=>a.word.localeCompare(b.word,'en'));
 else if(order==='unlearned')result.sort((a,b)=>Number(!!progressOf(a.word)||isKnown(a.word))-Number(!!progressOf(b.word)||isKnown(b.word))||priorityCompare(a,b));
 else result.sort(priorityCompare);
 return result;
}
function renderLibrary(reset=true){
 if(reset)visibleCount=48;
 libraryResults=getLibraryResults();$('library-count').textContent=`${libraryResults.length} 词`;
 const list=$('word-list');list.replaceChildren();
 if(!libraryResults.length){const msg=document.createElement('p');msg.className='empty-words';msg.textContent='没有找到匹配的单词。';list.appendChild(msg)}
 const frag=document.createDocumentFragment();
 for(const [i,w] of libraryResults.slice(0,visibleCount).entries()){
  const row=document.createElement('button');row.type='button';row.className='word-row';row.dataset.word=w.word;
  const learned=!!progressOf(w.word),known=isKnown(w.word);
  row.innerHTML=`<span class="word-index">${($('library-order').value==='exam1'&&hasExam1?String(examRow(w)?.[4]??'—'):String((($('library-order').value==='frequency'?w.priority?.frequencyRank:w.priority?.rank)??(i+1))).padStart(2,'0'))}</span><span class="word-description"><strong>${escapeHTML(w.word)}</strong><small>${escapeHTML(w.meaning||'暂无释义')}</small><small class="word-freq">${$('library-order').value==='exam1'&&hasExam1?escapeHTML(examSummary(w)):`来源词频 #${w.priority?.frequencyRank??'—'} · ${frequency(w).toLocaleString('en-US')} 次`}${w.priority?.core?' · 核心词表':''}</small></span><span class="word-status ${learned||known?'is-learned':''}">${learned?'已学习':known?'自认熟悉':escapeHTML(label(w))}</span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.65"><path d="m9 5 7 7-7 7"/></svg>`;
  frag.appendChild(row);
 }
 list.appendChild(frag);
 $('load-more').hidden=visibleCount>=libraryResults.length;
 const meta=window.WORD_WORLD_META||{};
 $('dataset-disclaimer').textContent=isSample() ? '当前仅包含演示词汇，暂无可靠的词频排名。' : `已收录 ${VOCAB.length.toLocaleString('en-US')} 个真实词条。综合重要性是启发式学习排序；来源词频基于四六级、考研、专四专八混合语料，非纯英语一词频。词义由开放数据提供，尚未逐项人工核校。${hasExam1?' 英语一词频统计 2010–2025 年完形、阅读 A 与翻译正文，含保守词形推断；未检出不等于不考。':''}`; 
}
function showDetail(word){
 const w=getWord(word);if(!w)return;
 currentDetail=w.word;const shell=$('detail-shell');shell.classList.remove('is-hidden');shell.setAttribute('aria-hidden','false');
 $('detail-word').textContent=w.word;$('detail-phonetic').textContent=w.phonetic||'点击发音';
 $('detail-priority').textContent=`${label(w)} · ${rankingText(w)}${w.tags?.includes('六级')?' · 六级重合':''}${w.priority?.core?' · 核心词表':''}`;
 $('detail-meaning').textContent=w.meaning||'暂无词义';$('detail-extra').textContent=w.extraMeaning?`补充义项：${w.extraMeaning}`:'';
 if(w.example){$('detail-context').hidden=false;$('detail-example').textContent=w.example;$('detail-example-zh').textContent=w.exampleZh||'';
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
 if(type==='review'){words=due;if(!words.length){toast('目前没有到期的单词');return}}
 else if(type==='direct'){words=[getWord(fromWord)].filter(Boolean)}
 else {const available=Math.max(0,goal-done.new);words=pendingNew().slice(0,available);if(!words.length){toast('今日新词已完成，可以浏览词库或复习');return}}
 session={mode:type,wordIds:words.map(w=>w.word),index:0,ratings:[],repeatCounts:{},skipped:0,revealed:false};
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
 $('study-mode-label').textContent=session.mode==='review'?'到期复习':session.mode==='direct'?'单词巩固':'新词学习';
 $('study-index').textContent=`${String(idx+1).padStart(2,'0')} / ${String(count).padStart(2,'0')}`;
 $('study-progress-fill').style.width=(idx/count*100)+'%';
 $('word-priority').textContent=isSample()?'示例词库':({P0:'考研核心',P1:'考研重点',P2:'考研基础',P3:'考研补充'}[label(w)]||'考研词汇');
 $('word-pos').textContent='MEMORY PRACTICE';
 $('study-word').textContent=w.word;$('study-phonetic').textContent=w.phonetic||'　';
 $('study-prompt').classList.remove('is-hidden');$('reveal-content').classList.add('is-hidden');
 $('reveal-answer').classList.remove('is-hidden');$('rating-buttons').classList.add('is-hidden');$('study-known').hidden=true;
 $('study-scroll').scrollTop=0;updateSaveButtons();
}
function reveal(){if(!session||session.revealed)return;session.revealed=true;
 const w=getWord(session.wordIds[session.index]);if(!w)return;
 haptic();$('study-prompt').classList.add('is-hidden');$('reveal-content').classList.remove('is-hidden');
 $('reveal-answer').classList.add('is-hidden');$('rating-buttons').classList.remove('is-hidden');$('study-known').hidden=!!progressOf(w.word)||isKnown(w.word);
 $('study-meaning').textContent=w.meaning||'暂无释义';$('study-extra-meaning').textContent=w.extraMeaning?`补充义项：${w.extraMeaning}`:'';
 $('study-ranking').textContent=isSample()?'示例词汇':rankingText(w);
 $('context-block').hidden=!w.example;
 if(w.example){$('context-caption').textContent=w.exampleType==='exam'?'EXAM CONTEXT / 真题语境':'CONTEXT / 语境例句';$('study-example').textContent=w.example;
 $('study-example-zh').textContent=w.exampleZh||'';$('context-source').textContent=w.exampleSource||'来源未核对'}
 $('study-scroll').scrollTo({top:0,behavior:state.prefs.reduceMotion?'instant':'smooth'});
}
function skipKnown(){
 if(!session||!session.revealed||clickBlock)return;
 const w=getWord(session.wordIds[session.index]);if(!w||progressOf(w.word)||isKnown(w.word))return;
 const key=wordKey(w.word);state.known[key]=true;session.skipped++;
 if(session.mode==='new'){
  const queued=new Set(session.wordIds);
  const replacement=pendingNew().find(candidate=>!queued.has(candidate.word));
  if(replacement)session.wordIds.push(replacement.word);
 }
 persist();session.index++;showSessionWord();
}
function recordRating(rating){if(!session||!session.revealed||clickBlock)return;
 const w=getWord(session.wordIds[session.index]);if(!w)return;
 clickBlock=true;const key=wordKey(w.word),prev=progressOf(w.word),wasNew=!prev,now=new Date();
 let result;try{result=window.StudyScheduler.review(prev,rating,now)}catch(err){console.error(err);toast('复习算法出现错误');clickBlock=false;return}
 delete state.known[key];
 state.progress[key]={...prev,...result,reviews:(prev?.reviews||0)+1,lastRating:rating};
 const record=daily();record.reviews++;if(rating==='good'||rating==='easy')record.success++;if(wasNew)record.new++;
 session.ratings.push(rating);
 if(rating==='again' && (session.repeatCounts[key]||0)<1){session.repeatCounts[key]=1;session.wordIds.push(w.word)}
 persist();haptic();
 const advance=()=>{if(!session){clickBlock=false;return}session.index++;clickBlock=false;showSessionWord()};
 if(state.prefs.reduceMotion)advance();else setTimeout(advance,170);
}
function completeSession(){
 if(!session)return;
 const total=session.ratings.length,success=session.ratings.filter(x=>x==='good'||x==='easy').length;
 $('finish-count').textContent=String(total);
 $('finish-rate').textContent=total?Math.round(success/total*100)+'%':'0%';
 $('finish-summary').textContent=`这次完成 ${total} 次记忆评价。${success} 次能够顺利回忆。${session.skipped?`另有 ${session.skipped} 个自认熟悉词已从新词计划排除。`:''}`;
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
function bind(){
 for(const id of ['today-study-order','study-order','library-order']){
  const option=$(id).querySelector('option[value="exam1"]');if(option)option.disabled=!hasExam1;
 }
 document.querySelectorAll('.nav-link').forEach(el=>el.addEventListener('click',()=>page(el.dataset.page)));
 $('header-search').addEventListener('click',()=>page('library',true));
 $('start-review').addEventListener('click',()=>{if(dueWords().length)startSession('review');else if(pendingNew().length && Number(state.prefs.goal)>daily().new)startSession('new');else page('library')});
 $('start-new').addEventListener('click',()=>startSession('new'));
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
   if(e.key==='Escape'){if(isAppActive()){leaveSession();return}if(!$('detail-shell').classList.contains('is-hidden'))hideDetail();return}
   const target=e.target;if(target?.tagName==='INPUT'||target?.tagName==='SELECT')return;
   if(isAppActive()){if(e.key===' '||e.key==='Enter'){if(!session?.revealed){e.preventDefault();reveal()}}else if(session?.revealed&&['1','2','3','4'].includes(e.key))recordRating(['again','hard','good','easy'][Number(e.key)-1])}
   else if(e.key==='/' && $('detail-shell').classList.contains('is-hidden')){e.preventDefault();page('library',true)}
 });
 document.addEventListener('visibilitychange',()=>{if(!document.hidden){if(activePage==='today')renderHome();else if(activePage==='records')renderRecords()}});
 window.addEventListener('popstate',()=>{if(isAppActive())leaveSession();else if(currentDetail)hideDetail();else page('today')});
 const capacitorApp=window.Capacitor?.Plugins?.App;
 if(capacitorApp?.addListener)capacitorApp.addListener('backButton',()=>{
   if(isAppActive() || !$('finish-shell').classList.contains('is-hidden'))leaveSession();
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
