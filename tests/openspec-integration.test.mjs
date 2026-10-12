import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, realpath, readdir, readFile, rm } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { exportCore, sourceRoot } from '../scripts/export-core.mjs';
const config={scope:'docs/scope.md',architecture:'docs/architecture.md',reviewGuidance:'docs/review.md',verificationCommand:'make check'};
for(const tools of [['codex'],['claude'],['codex','claude']]) test(`pinned OpenSpec discovery and ownership: ${tools}`,async t=>{
 const temp=await realpath(await mkdtemp(path.join(os.tmpdir(),'core-openspec-')));t.after(()=>rm(temp,{recursive:true,force:true}));const out=path.join(temp,'project');
 await exportCore({output:out,tools,config});
 const customBefore={};const generatedBefore={};
 const init=()=>execFileSync('pnpm',['exec','openspec','init',out,'--tools',tools.join(','),'--profile','core','--no-animation'],{cwd:sourceRoot,stdio:'pipe',env:{...process.env,DO_NOT_TRACK:'1'}});
 init();
 for(const tool of tools) {
  const root=path.join(out,tool==='codex'?'.agents/skills':'.claude/skills');const entries=await readdir(root);
  for(const name of ['deliver-change','review-change','verify-change']) customBefore[path.join(root,name,'SKILL.md')]=await readFile(path.join(root,name,'SKILL.md'),'utf8');
  for(const name of ['openspec-propose','openspec-apply-change','openspec-archive-change','openspec-explore']) assert.ok(entries.includes(name),name);
  for(const name of entries.filter(n=>n.startsWith('openspec-'))) {
   const file=path.join(root,name,'SKILL.md');const text=await readFile(file,'utf8');assert.match(text,/license: MIT/);assert.match(text,/generatedBy: ['"]?1\.14\.1/);generatedBefore[file]=text;
  }
  if(tool==='codex') {const target=path.join(root,'.openspec-target');generatedBefore[target]=await readFile(target,'utf8');}
 }
 init();
 for(const [file,text] of Object.entries({...customBefore,...generatedBefore}))assert.equal(await readFile(file,'utf8'),text,file);
 const configText=await readFile(path.join(out,'openspec/config.yaml'),'utf8');assert.doesNotMatch(configText,/agent-project-core is a standalone/);
 for(const subdir of ['specs','changes'])assert.ok((await readdir(path.join(out,'openspec',subdir))).every(n=>n==='.gitkeep'||n==='archive'));
});
