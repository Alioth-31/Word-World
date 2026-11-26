'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.join(__dirname,'..'),read=p=>fs.readFileSync(path.join(root,p),'utf8');
test('app release version, assets and offline cache agree',()=>{
 const pkg=JSON.parse(read('package.json')),html=read('app/index.html'),sw=read('app/sw.js');
 assert.match(pkg.version,/^\d+\.\d+\.\d+(?:-(?:beta|rc)\.\d+)?$/);
 assert.ok(sw.includes('wordworld-'+pkg.version));
 const ids=[...html.matchAll(/\sid="([^"]+)"/g)].map(m=>m[1]);assert.equal(new Set(ids).size,ids.length);
 for(const m of html.matchAll(/<script src="([^"]+)" defer>|<link rel="stylesheet" href="([^"]+)">/g)){const asset=m[1]||m[2];assert.ok(fs.existsSync(path.join(root,'app',asset)),asset);assert.ok(sw.includes("'./"+asset+"'"),asset);}
 assert.ok(read('CHANGELOG.md').includes('## '+pkg.version));
});
