(() => {
'use strict';

// The bundled assets are one content source. Consumers work with the catalog,
// not the asset globals; future installed packs can use the same interface.
function createCatalog(vocabulary, metadata, examAsset){
 const words=(Array.isArray(vocabulary)?vocabulary:[]).filter(w=>w&&typeof w.word==='string'&&w.word.trim());
 const byId=new Map(),byLower=new Map(),keys=new Set();
 for(const w of words){
  if(byId.has(w.word))throw Error('Duplicate vocabulary ID: '+w.word);
  byId.set(w.word,w);
  const lower=w.word.toLowerCase();
  if(!byLower.has(lower)||w.word===lower)byLower.set(lower,w);
  // Preserve the schema-3 progress keys already used by existing installations.
  const key=w.word==='May'||w.word==='March'?w.word:lower;
  if(keys.has(key))throw Error('Duplicate progress key: '+key);
  keys.add(key);
 }
 const metadataValue=metadata||{};
 const examRows=new Map(Array.isArray(examAsset?.rows)?examAsset.rows.map(r=>[r[0],r]):[]);
 const hasExam1=metadataValue.sample!==true && examAsset?.schema===1 &&
  examAsset.years?.length===16 && examRows.size===words.length && words.length===5530 &&
  words.every(w=>examRows.has(w.word));
 const overlap=words.filter(w=>w.tags?.includes('六级'));
 const books=new Map([
  ['netem',{id:'netem',title:metadataValue.sample?'演示词书':'考研词书',complete:!metadataValue.sample,words}],
  ['cet6-overlap',{id:'cet6-overlap',title:'六级重合词书',complete:false,words:overlap}]
 ]);
 function normalizeBook(value){
  return books.has(value)&&books.get(value).words.length?value:'netem';
 }
 function book(value){return books.get(normalizeBook(value))}
 function wordKey(value){const id=String(value||'');return id==='May'||id==='March'?id:id.toLowerCase()}
 function getWord(value){const id=String(value||'');return byId.get(id)||byLower.get(id.toLowerCase())}
 return {
  metadata:metadataValue,allWords:words,hasExam1,wordKey,getWord,normalizeBook,book,
  listBooks:()=>[...books.values()].map(b=>({id:b.id,title:b.title,complete:b.complete,count:b.words.length})),
  examRow:w=>hasExam1?examRows.get(w.word):null
 };
}
window.WordWorldContent=createCatalog(window.WORD_WORLD_VOCAB,window.WORD_WORLD_META,window.WORD_WORLD_EXAM1);
})();
