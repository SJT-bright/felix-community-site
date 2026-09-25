import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,readdir} from 'node:fs/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
import {collection} from '../public/portfolio/collection.js';
const root=new URL('../',import.meta.url);
test('all 34 archive slots have distinct nonempty image files',async()=>{
  assert.equal(Object.keys(collection).length,34);
  assert.equal(new Set(Object.values(collection).map(item=>item.src)).size,34);
  const app=await readFile(new URL('public/portfolio/app.js',root),'utf8');
  assert.match(app,/counts:\s*\{\s*a:\s*34\s*\}/);
  for(let n=1;n<=34;n++){
    const id=`a-${String(n).padStart(3,'0')}`;
    const item=collection[id];
    assert.ok(item?.src && item.w>0 && item.h>0,id);
    const image=await readFile(new URL(item.src,new URL('public/portfolio/',root)));
    assert.ok(image.length>1000,id);
  }
});
test('community edition restores lab and removes career sections from the page',async()=>{
  const app=await readFile(new URL('src/App.jsx',root),'utf8');
  assert.doesNotMatch(app,/CareerExperience|CareerContact|ProfileLanding|career-nav/);
  assert.ok(app.indexOf('<DriftWallGallery')<app.indexOf('<ProjectShowcase'));
  assert.match(app,/<LabGateway/);
  const main=await readFile(new URL('src/main.jsx',root),'utf8');
  assert.match(main,/<LabPage/);
  const html=await readFile(new URL('index.html',root),'utf8');
  assert.match(html,/AI 学习与共创/);assert.doesNotMatch(html,/求职|招聘/);
});
