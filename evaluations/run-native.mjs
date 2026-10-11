import { spawn } from 'node:child_process';
import { mkdir, mkdtemp, realpath, readFile, writeFile, rm, readdir } from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { exportCore, sourceRoot } from '../scripts/export-core.mjs';
const here=path.dirname(fileURLToPath(import.meta.url));
const config={scope:'docs/scope.md',architecture:'docs/architecture.md',reviewGuidance:'docs/review.md',verificationCommand:'node --test'};
function run(command,args,{cwd,input,timeout=120000}={}) {
 return new Promise(resolve=>{
  const child=spawn(command,args,{cwd,detached:true,env:{...process.env,DO_NOT_TRACK:'1'},stdio:['pipe','pipe','pipe']});let stdout='',stderr='',timedOut=false;
  const timer=setTimeout(()=>{timedOut=true;try{process.kill(-child.pid,'SIGTERM');}catch{}},timeout);
  child.stdout.on('data',d=>stdout+=d);child.stderr.on('data',d=>stderr+=d);
  child.on('error',error=>{clearTimeout(timer);resolve({exitCode:null,stdout,stderr:stderr+error.message,timedOut});});
  child.on('close',code=>{clearTimeout(timer);resolve({exitCode:code,stdout,stderr,timedOut});});child.stdin.end(input??'');
 });
}
async function files(root) {
 const result={};
 async function walk(dir) {for(const entry of await readdir(dir,{withFileTypes:true})) {if(['.git','node_modules'].includes(entry.name))continue;const filename=path.join(dir,entry.name);if(entry.isDirectory())await walk(filename);else if(entry.isFile())result[path.relative(root,filename)]=await readFile(filename,'utf8');}}
 await walk(root);return result;
}
async function main() {
 const args=process.argv.slice(2);const options={};
 for(let i=0;i<args.length;i+=2){if(!['--tool','--output','--case'].includes(args[i])||!args[i+1])throw new Error('Usage: node evaluations/run-native.mjs --tool codex|claude --output <new-directory> [--case case-01|smoke]');options[args[i]]=args[i+1];}
 const tool=options['--tool'];if(!['codex','claude'].includes(tool)||!options['--output'])throw new Error('tool and output are required');
 const output=path.resolve(options['--output']);await mkdir(output); // Never overwrite an earlier evidence run.
 const version=await run(tool,['--version'],{cwd:sourceRoot,timeout:15000});
 if(tool==='claude') {
  const auth=await run('claude',['auth','status'],{cwd:sourceRoot,timeout:15000});
  let loggedIn=false;try{loggedIn=JSON.parse(auth.stdout).loggedIn===true;}catch{}
  if(!loggedIn){await writeFile(path.join(output,'access.json'),JSON.stringify({tool,clientVersion:version.stdout.trim(),status:'incomplete',reason:'Native Claude authentication unavailable; no behavioral sessions executed.',requestedModels:{coordinator:'opus',implementer:'sonnet',reviewer:'opus',qa:'sonnet'},actualModels:null},null,2)+'\n');console.log('Native Claude authentication unavailable; gate incomplete.');return;}
 }
 const selected=options['--case']?[options['--case']]:[...Array.from({length:9},(_,i)=>`case-${String(i+1).padStart(2,'0')}`),'smoke'];
 for(const id of selected) {
  if(id!=='smoke'&&!/^case-0[1-9]$/.test(id))throw new Error(`Unknown case: ${id}`);
  const temp=await realpath(await mkdtemp(path.join(os.tmpdir(),'core-native-')));const workspace=path.join(temp,'project');
  try {
   await exportCore({output:workspace,tools:[tool],config});
   const fixture=JSON.parse(await readFile(path.join(here,'cases',id==='smoke'?'case-07':id,'input.json'),'utf8'));
   for(const [name,text] of Object.entries(fixture.files)){const filename=path.join(workspace,name);await mkdir(path.dirname(filename),{recursive:true});await writeFile(filename,text);}
   const install=await run('pnpm',['add','-D','-E','@fission-ai/openspec@1.14.1','--offline'],{cwd:workspace,timeout:30000});if(install.exitCode!==0)throw new Error('Fixture pinned CLI install failed: '+install.stderr);
   const init=await run('pnpm',['exec','openspec','init','--tools',tool,'--profile','core','--no-animation'],{cwd:workspace,timeout:15000});if(init.exitCode!==0)throw new Error(init.stderr);
   const baseline=await files(workspace);
   const manifest=JSON.parse(baseline['.agent-core/manifest.json']);
   const request=id==='smoke'?'List the discovered deliver-change, review-change, and verify-change skills. Use separate native core-reviewer and core-qa agents to inspect raw requirements and eligibility.mjs plus eligibility.test.mjs. Requirements: 18 is eligible; 17 is ineligible; negative input must be rejected. Pass raw artifacts without implementation conclusions. Report actual delegation identity, findings, command outcomes, and runtime model visibility. Do not edit product files.':fixture.request;
   const prompt='Work only in this isolated fixture. Do not deploy, publish a PR, message anyone, modify global settings, or access unrelated projects. Follow the exported core guidance and installed skills. Do not read evaluation rubrics or prior evidence.\n\n'+request;
   let nativeArgs;
   if(tool==='codex')nativeArgs=['exec','--ignore-user-config','--ephemeral','--skip-git-repo-check','--json','-m',manifest.requestedModels.codex.coordinator,'-s','workspace-write','-C',workspace];
   else nativeArgs=['-p','--model',manifest.requestedModels.claude.coordinator,'--output-format','stream-json','--verbose','--no-session-persistence','--setting-sources','project','--strict-mcp-config','--mcp-config','{"mcpServers":{}}','--permission-mode','acceptEdits'];
   if(id==='case-09') {
    if(tool==='codex')nativeArgs.push('-c','features.multi_agent=false');
    else nativeArgs.push('--disallowedTools','Agent,Task');
   }
   console.log(`Running ${tool} ${id}`);
   const result=await run(tool,nativeArgs,{cwd:workspace,input:prompt});
   const after=await files(workspace);
   const changed={};for(const [name,text] of Object.entries(after))if(text!==baseline[name])changed[name]=text;
   const scrub=text=>text.replaceAll(workspace,'<fixture>').replaceAll(temp,'<temporary>').replaceAll(sourceRoot,'<core-source>').replaceAll(os.homedir(),'<user-home>');
   const record={tool,case:id,clientVersion:version.stdout.trim(),requestedModels:manifest.requestedModels[tool],actualModels:null,resolutionLimitation:'Requested configuration is recorded. Inspect native events for observable runtime resolution; the runner does not infer it.',exitCode:result.exitCode,timedOut:result.timedOut,stdout:scrub(result.stdout),stderr:scrub(result.stderr),changedArtifacts:changed};
   await writeFile(path.join(output,id+'.json'),JSON.stringify(record,null,2)+'\n');console.log(`Recorded ${id}: exit ${result.exitCode}, timeout ${result.timedOut}`);
   if(result.exitCode!==0||result.timedOut){console.log('Native execution failed; remaining cases stay incomplete.');break;}
  } finally {await rm(temp,{recursive:true,force:true});}
 }
}
main().catch(error=>{console.error(error.message);process.exitCode=1;});
