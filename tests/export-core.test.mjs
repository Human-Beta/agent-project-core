import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, realpath, readFile, readdir, writeFile, mkdir, symlink, rm, cp } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { parse as toml } from 'smol-toml';
import { parse as yaml } from 'yaml';
import { buildExport, exportCore, validateFiles, sourceRoot, normalizeConfig } from '../scripts/export-core.mjs';
export const config = {scope:'docs/scope.md',architecture:'docs/architecture.md',reviewGuidance:'docs/review.md',verificationCommand:'make check'};
async function temporary(t) { const dir=await realpath(await mkdtemp(path.join(os.tmpdir(),'core-test-'))); t.after(()=>rm(dir,{recursive:true,force:true})); return dir; }
async function snapshot(root) {
  const result={};
  async function walk(dir) { for(const entry of await readdir(dir,{withFileTypes:true})) { const p=path.join(dir,entry.name); if(entry.isDirectory()) await walk(p); else result[path.relative(root,p)]=await readFile(p,'utf8'); } }
  await walk(root); return result;
}
for (const tools of [['codex'],['claude'],['codex','claude']]) test(`portable actual files: ${tools}`,async t=>{
  const dir=await temporary(t);const out=path.join(dir,'export');await exportCore({output:out,tools,config});
  const files=await snapshot(out);validateFiles(new Map(Object.entries(files)));
  assert.equal('AGENTS.md' in files,tools.includes('codex'));assert.equal('CLAUDE.md' in files,tools.includes('claude'));
  assert.equal(Object.keys(files).some(p=>p.startsWith('openspec/')),false);
  assert.equal(Object.keys(files).some(p=>p.includes('openspec-')||p.includes('.openspec-target')),false);
  assert.ok(files['.agent-core/project.md'].includes('make check'));
  assert.ok(Object.values(files).every(s=>!s.includes(sourceRoot)));
  const manifest=JSON.parse(files['.agent-core/manifest.json']);assert.equal(manifest.runtimeModels,null);
  for(const tool of tools) {
    assert.equal(manifest.requestedModels[tool].reviewer,tool==='codex'?'gpt-6.1-sol':'opus');
    for(const role of ['implementer','reviewer','qa']) {
      const name=`.${tool}/agents/core-${role}.${tool==='codex'?'toml':'md'}`;
      const meta=tool==='codex'?toml(files[name]):yaml(files[name].split('---')[1]);
      assert.equal(meta.model,manifest.requestedModels[tool][role]);
    }
    for(const skill of ['deliver-change','review-change','verify-change']) assert.ok(files[`${tool==='codex'?'.agents':'.claude'}/skills/${skill}/SKILL.md`]);
  }
});
test('native model overrides, alternate stack command, central recommendations',async()=>{
 const files=await buildExport({tools:['codex','claude'],config:{...config,verificationCommand:'cargo test',models:{codex:{coordinator:'gpt-6-sol',implementer:'gpt-6.1-sol'},claude:{coordinator:'haiku',qa:'claude-sonnet-5'}}}});
 assert.match(files.get('AGENTS.md'),/Select gpt-6-sol/);assert.match(files.get('CLAUDE.md'),/Select haiku/);
 assert.equal(toml(files.get('.codex/agents/core-implementer.toml')).model,'gpt-6.1-sol');
 assert.equal(yaml(files.get('.claude/agents/core-qa.md').split('---')[1]).model,'claude-sonnet-5');
 assert.match(files.get('.agent-core/project.md'),/cargo test/);
 for(const [name,text] of files) if(name.startsWith('.claude/')||name==='CLAUDE.md') assert.doesNotMatch(text,/gpt-/);
});
test('reproducible files and normalized input order',async t=>{
 const dir=await temporary(t);for(const name of ['one','two'])await exportCore({output:path.join(dir,name),tools:name==='one'?['codex','claude']:['claude','codex'],config});
 assert.deepEqual(await snapshot(path.join(dir,'one')),await snapshot(path.join(dir,'two')));
});
test('required inputs, unsupported profiles and hostile paths fail before writing',async t=>{
 const dir=await temporary(t);const out=path.join(dir,'absent');
 const invalid=[{}, {...config,scope:undefined},{...config,verificationCommand:' '},{...config,scope:'../escape.md'},{...config,architecture:'/etc/passwd'},{...config,reviewGuidance:'a\\b.md'},{...config,scope:'.agent-core/project.md'},{...config,models:{claude:{qa:'gpt-6-luna'}}},{...config,models:{codex:{qa:'sonnet'}}},{...config,models:{other:{}}},{...config,typo:1}];
 for(const item of invalid) await assert.rejects(exportCore({output:out,tools:['codex'],config:item}));
 for(const tools of [[],['other'],['codex','codex'],undefined])await assert.rejects(exportCore({output:out,tools,config}),/tools/);
 await assert.rejects(readdir(out),{code:'ENOENT'});
 await assert.rejects(exportCore({tools:['codex'],config}),/output/);
 await assert.rejects(exportCore({output:dir+'/nested/../out',tools:['codex'],config}),/traversal/);
 await assert.rejects(exportCore({output:path.join(sourceRoot,'core','output'),tools:['codex'],config}),/outside/);
});
test('nonempty destination and symlink escapes preserve existing files',async t=>{
 const dir=await temporary(t);const out=path.join(dir,'out');await mkdir(out);await writeFile(path.join(out,'keep'),'original');
 await assert.rejects(exportCore({output:out,tools:['codex'],config}),/new or empty/);assert.equal(await readFile(path.join(out,'keep'),'utf8'),'original');
 await symlink(out,path.join(dir,'link'));await assert.rejects(exportCore({output:path.join(dir,'link','new'),tools:['codex'],config}),/symlink/);
 await assert.rejects(exportCore({output:path.join(dir,'link'),tools:['codex'],config}),/symlink/);
 assert.deepEqual(await readdir(out),['keep']);
});
test('failed write cleans partial files and preserves preexisting directories',async t=>{
 const dir=await temporary(t);
 for(const existing of [false,true]) {
  const out=path.join(dir,existing?'existing':'new','out');if(existing)await mkdir(out,{recursive:true});let count=0;
  await assert.rejects(exportCore({output:out,tools:['codex'],config,write:async(handle,text)=>{await handle.writeFile(text);if(++count===3)throw new Error('injected write failure');}}),/injected/);
  if(existing)assert.deepEqual(await readdir(out),[]);else await assert.rejects(readdir(path.dirname(out)),{code:'ENOENT'});
 }
});
test('source copy is independent; history and maintainer integration excluded',async t=>{
 const dir=await temporary(t);const root=path.join(dir,'source');await mkdir(root);
 for(const folder of ['core','adapters'])await cp(path.join(sourceRoot,folder),path.join(root,folder),{recursive:true});await cp(path.join(sourceRoot,'package.json'),path.join(root,'package.json'));
 for(const folder of ['openspec/specs','openspec/changes/archive','.agents/skills/openspec-apply-change']) {await mkdir(path.join(root,folder),{recursive:true});await writeFile(path.join(root,folder,'sentinel'),'do not export');}
 const out=path.join(dir,'out');await exportCore({output:out,tools:['codex','claude'],config,root});await rm(root,{recursive:true});
 const files=await snapshot(out);validateFiles(new Map(Object.entries(files)));assert.ok(Object.values(files).every(v=>!v.includes('do not export')));
});
test('canonical symlink assets are rejected',async t=>{
 const dir=await temporary(t);const root=path.join(dir,'source');await mkdir(root);await cp(path.join(sourceRoot,'core'),path.join(root,'core'),{recursive:true});await cp(path.join(sourceRoot,'adapters'),path.join(root,'adapters'),{recursive:true});await cp(path.join(sourceRoot,'package.json'),path.join(root,'package.json'));
 await symlink(path.join(sourceRoot,'README.md'),path.join(root,'core','guidance','escape.md'));
 await assert.rejects(buildExport({tools:['codex'],config,root}),/symlink/);
});
test('broken references and malformed native metadata identify actionable paths',async()=>{
 const files=await buildExport({tools:['codex','claude'],config});files.delete('.agent-core/guidance/engineering.md');assert.throws(()=>validateFiles(files),/missing reference.*engineering.md/);
 const original=await buildExport({tools:['codex'],config});original.set('.codex/agents/core-qa.toml','name = [');assert.throws(()=>validateFiles(original));
 const skills=await buildExport({tools:['claude'],config});skills.set('.claude/skills/deliver-change/SKILL.md','---\nname: bad\n---\n');assert.throws(()=>validateFiles(skills),/missing description/);
});
test('CLI missing config leaves output untouched',async t=>{
 const dir=await temporary(t);assert.throws(()=>execFileSync(process.execPath,[path.join(sourceRoot,'scripts/export-core.mjs'),'--output',path.join(dir,'out'),'--tools','codex'],{stdio:'pipe'}),/config: required/);assert.deepEqual(await readdir(dir),[]);
});
