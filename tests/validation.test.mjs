import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, realpath, mkdir, writeFile, symlink, rm } from 'node:fs/promises';
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
