'use strict';
const fs=require('node:fs');const path=require('node:path');
const root=path.join(__dirname,'..');
const index=path.join(root,'app','index.html');
const out=path.join(root,'output','preview.html');
let html=fs.readFileSync(index,'utf8');
html=html.replace(/<link rel="stylesheet" href="([^"]+)">/g,(_,rel)=>'<style>\n'+fs.readFileSync(path.join(root,'app',rel),'utf8')+'\n</style>');
html=html.replace(/\s*<link rel="manifest" href="manifest.webmanifest">/,'');
html=html.replace(/\s*<link rel="icon" href="assets\/icon.svg" type="image\/svg\+xml">/,'');
const scripts=[];
html=html.replace(/\s*<script src="([^"]+)" defer><\/script>/g,(_,rel)=>{
 const source=fs.readFileSync(path.join(root,'app',rel),'utf8');
 scripts.push('<script>\n'+source.replace(/<\/script/gi,'<\\/script')+'\n</script>');
 return '';
});
html=html.replace('</body>',scripts.join('\n')+'\n</body>');
fs.mkdirSync(path.dirname(out),{recursive:true});fs.writeFileSync(out,html,'utf8');
console.log('独立 HTML 预览：',out,'字节',Buffer.byteLength(html));
