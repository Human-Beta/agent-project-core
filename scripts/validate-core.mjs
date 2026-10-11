import { readFile, readdir, stat } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildExport, validateFiles, sourceRoot, assertNoSymlinks, normalizeConfig } from './export-core.mjs';

export async function readTree(root) {
 const files=new Map();
 async function walk(dir) {
  await assertNoSymlinks(dir);
  for(const entry of await readdir(dir,{withFileTypes:true})) {
   const filename=path.join(dir,entry.name);
   if(entry.isSymbolicLink())throw new Error(`${filename}: symlink assets are not allowed`);
   if(entry.isDirectory())await walk(filename);
   else if(entry.isFile())files.set(path.relative(root,filename).split(path.sep).join('/'),await readFile(filename,'utf8'));
  }
 }
 await walk(root);return files;
}
export async function validateProjectDocuments(root,config) {
 for(const field of ['scope','architecture','reviewGuidance']) {
  const filename=path.join(root,config[field]);await assertNoSymlinks(filename);
  try {if(!(await stat(filename)).isFile())throw new Error('not a file');}
  catch(error) {throw new Error(`.agent-core/project.md: missing project ${field} document ${config[field]} (${error.message})`);}
 }
}
export async function validateExport(root,{projectDocuments=false}={}) {
 const files=await readTree(root);validateFiles(files);
 const manifest=JSON.parse(files.get('.agent-core/manifest.json'));
 const config=normalizeConfig(manifest.configuration);
 if(projectDocuments)await validateProjectDocuments(root,config);
 return files.size;
}
async function checkMarkdown(filename) {
 const text=await readFile(filename,'utf8');
 for(const match of text.matchAll(/\]\(([^)]+)\)/g)) {
  const ref=match[1];if(/^https:\/\//.test(ref))continue;
  const resolved=path.resolve(path.dirname(filename),ref);
  try {await stat(resolved);}catch {throw new Error(`${path.relative(sourceRoot,filename)}: missing reference ${ref} (${path.relative(sourceRoot,resolved)})`);}
 }
}
export async function validateSource() {
 const core=await readTree(path.join(sourceRoot,'core'));
 // project.md is materialized from explicit configuration, never handwritten canonical policy.
 core.set('project.md','# Generated project context\n');
 validateFiles(core);
 const config=JSON.parse(await readFile(path.join(sourceRoot,'docs/project-config.example.json'),'utf8'));
 for(const tools of [['codex'],['claude'],['codex','claude']])validateFiles(await buildExport({tools,config}));
 const handoffs=await readTree(path.join(sourceRoot,'evaluations/handoffs'));
 for(const [name,text] of handoffs) {
  const payload=JSON.parse(text);
  if(!payload.requirements || ['conclusion','selfAssessment','expectedFindings'].some(k=>Object.hasOwn(payload,k)))throw new Error(`${name}: handoff must contain requirements and raw evidence without conclusions`);
 }
 for(const filename of ['README.md','docs/usage.md'])await checkMarkdown(path.join(sourceRoot,filename));
}
async function main() {
 const args=process.argv.slice(2);
 if(!args.length) {await validateSource();console.log('Canonical content and all native profiles validated.');}
 else if(args[0]==='--export'&&args[1]&&args.slice(2).every(a=>a==='--project-documents')) {
  const count=await validateExport(path.resolve(args[1]),{projectDocuments:args.includes('--project-documents')});console.log(`Validated ${count} files; project documents ${args.includes('--project-documents')?'checked':'await template assembly'}.`);
 } else throw new Error('Usage: node scripts/validate-core.mjs [--export <directory> [--project-documents]]');
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main().catch(error=>{console.error(error.message);process.exitCode=1;});
