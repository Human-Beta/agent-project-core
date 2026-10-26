import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, realpath, mkdir, readFile, writeFile, symlink, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { exportCore } from '../scripts/export-core.mjs';
import { validateExport } from '../scripts/validate-core.mjs';
test('assembly validation requires actual contained project documents',async t=>{
 const dir=await realpath(await mkdtemp(path.join(os.tmpdir(),'core-validation-')));t.after(()=>rm(dir,{recursive:true,force:true}));const out=path.join(dir,'out');
 const config={scope:'docs/scope.md',architecture:'docs/architecture.md',reviewGuidance:'docs/review.md',verificationCommand:'make check'};
 await exportCore({output:out,tools:['codex'],config});await validateExport(out);
 await assert.rejects(validateExport(out,{projectDocuments:true}),/missing project scope document docs\/scope.md/);
 await mkdir(path.join(out,'docs'));for(const file of ['scope.md','architecture.md','review.md'])await writeFile(path.join(out,'docs',file),'# Project context\n');
 await validateExport(out,{projectDocuments:true});
 await rm(path.join(out,'docs','scope.md'));await symlink(path.join(dir,'outside.md'),path.join(out,'docs','scope.md'));await writeFile(path.join(dir,'outside.md'),'outside');
 await assert.rejects(validateExport(out,{projectDocuments:true}),/symlink/);
});
test('assembly validation ignores application files and unrelated integrations',async t=>{
 const dir=await realpath(await mkdtemp(path.join(os.tmpdir(),'core-validation-')));t.after(()=>rm(dir,{recursive:true,force:true}));
 const config={scope:'docs/scope.md',architecture:'docs/architecture.md',reviewGuidance:'docs/review.md',verificationCommand:'cargo test'};
 for(const tools of [['codex'],['claude'],['codex','claude']]) {
  const out=path.join(dir,tools.join('-'));await exportCore({output:out,tools,config});const count=await validateExport(out);
  await mkdir(path.join(out,'docs'));for(const file of ['scope.md','architecture.md','review.md'])await writeFile(path.join(out,'docs',file),'# Project context\n\n[Section](#section)\n');
  await writeFile(path.join(out,'Cargo.toml'),'[package]\nname = "example"\nversion = "0.1.0"\n');
  assert.equal(await validateExport(out,{projectDocuments:true}),count);
  await mkdir(path.join(out,'.agents','skills','openspec-propose'),{recursive:true});
  await writeFile(path.join(out,'.agents','skills','openspec-propose','SKILL.md'),'---\nname: openspec-propose\ndescription: Upstream integration\n---\n[External](https://example.com)\n[Section](#section)\n');
  await symlink(dir,path.join(out,'node_modules'));
  assert.equal(await validateExport(out,{projectDocuments:true}),count);
 }
});
test('assembly validation still rejects damaged or missing generated agents',async t=>{
 const dir=await realpath(await mkdtemp(path.join(os.tmpdir(),'core-validation-')));t.after(()=>rm(dir,{recursive:true,force:true}));const out=path.join(dir,'out');
 const config={scope:'docs/scope.md',architecture:'docs/architecture.md',reviewGuidance:'docs/review.md',verificationCommand:'make check'};
 await exportCore({output:out,tools:['codex'],config});
 const agent=path.join(out,'.codex','agents','core-qa.toml');await writeFile(agent,'name = "core-qa"\n');
 await assert.rejects(validateExport(out),/core-qa\.toml: missing description/);
 await rm(agent);await assert.rejects(validateExport(out),/core-qa\.toml/);
 const outside=path.join(dir,'agent.toml');await writeFile(outside,'name = "core-qa"\n');await symlink(outside,agent);
 await assert.rejects(validateExport(out),/symlink/);
});
test('assembly validation rejects invalid Claude agent identity and model types',async t=>{
 const dir=await realpath(await mkdtemp(path.join(os.tmpdir(),'core-validation-')));t.after(()=>rm(dir,{recursive:true,force:true}));const out=path.join(dir,'out');
 const config={scope:'docs/scope.md',architecture:'docs/architecture.md',reviewGuidance:'docs/review.md',verificationCommand:'make check'};
 await exportCore({output:out,tools:['claude'],config});const agent=path.join(out,'.claude','agents','core-qa.md');const original=await readFile(agent,'utf8');
 for(const name of ['-qa','core-reviewer']) {
  await writeFile(agent,original.replace('name: "core-qa"',`name: "${name}"`));
  await assert.rejects(validateExport(out),/core-qa\.md:.*name/);
 }
 for(const model of ['true','42','[]','{}','"gpt-6-luna"','"not-a-native-model"']) {
  await writeFile(agent,original.replace('model: "sonnet"',`model: ${model}`));
  await assert.rejects(validateExport(out),/core-qa\.md: invalid Claude model/);
 }
 await writeFile(agent,original.replace('model: "sonnet"','model: "claude-sonnet-5"'));await validateExport(out);
});
