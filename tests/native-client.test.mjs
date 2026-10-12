import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtemp, realpath, writeFile, readFile, mkdir, chmod, rm } from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { sourceRoot } from '../scripts/export-core.mjs';
const exec = promisify(execFile);
test('native runner selects bundled client over stale PATH and honors explicit override', async t => {
  const temp = await realpath(await mkdtemp(path.join(os.tmpdir(), 'core-client-test-')));
  t.after(() => rm(temp, { recursive: true, force: true }));
  const oldBin = path.join(temp, 'bin');
  await mkdir(oldBin);
  const legacy = path.join(oldBin, 'codex');
  await writeFile(legacy, '#!/bin/sh\nexit 99\n');
  await chmod(legacy, 0o755);
  const bundled = path.join(temp, 'bundled-client');
  const explicit = path.join(temp, 'explicit-client');
  for (const client of [bundled, explicit]) {
    await writeFile(client, `#!${process.execPath}\nconst args = process.argv.slice(2);\nif (args.includes('--version')) console.log(${JSON.stringify(path.basename(client))});\nelse { require('node:fs').writeFileSync('test-evidence.txt',process.cwd()); if (!args.includes('gpt-6.1-sol')) process.exit(98); process.stdin.resume(); process.stdin.on('end', () => console.log(JSON.stringify({type:'test-client', modelExecuted:false}))); }\n`);
    await chmod(client, 0o755);
  }
  for (const useExplicit of [false, true]) {
    const output = path.join(temp, useExplicit ? 'explicit-evidence' : 'bundled-evidence');
    const args = [path.join(sourceRoot, 'evaluations/run-native.mjs'), '--tool', 'codex', '--case', useExplicit ? 'smoke' : 'case-03,case-04', '--output', output];
    if (useExplicit) args.push('--client', explicit);
    await exec(process.execPath, args, { cwd: sourceRoot, env: { ...process.env, CODEX_CLI_PATH: bundled, PATH: oldBin + path.delimiter + process.env.PATH }, timeout: 60000 });
    const caseNames = useExplicit ? ['smoke'] : ['case-03', 'case-04'];
    for (const caseName of caseNames) {
    const record = JSON.parse(await readFile(path.join(output, caseName + '.json'), 'utf8'));
    assert.equal(record.exitCode, 0);
    assert.equal(record.clientSelection, useExplicit ? 'explicit' : 'desktop-bundled');
    assert.equal(record.clientVersion, useExplicit ? 'explicit-client' : 'bundled-client');
    assert.equal(record.actualModels, null);
    assert.match(record.stdout, /"modelExecuted":false/);
    assert.equal(record.changedArtifacts['test-evidence.txt'],'<fixture>');
    }
  }
});

test('runtime evidence attributes only explicit native model events to known roles', async () => {
  const { observeRuntimeModels } = await import('../evaluations/run-native.mjs');
  const events = [
    {type:'system',subtype:'init',model:'claude-opus-5-5'},
    {type:'assistant',message:{model:'claude-opus-5-5',content:[{type:'tool_use',id:'qa-call',name:'Agent',input:{subagent_type:'core-qa'}}]}},
    {type:'assistant',parent_tool_use_id:'qa-call',message:{model:'claude-sonnet-5',content:[]}},
    {type:'assistant',parent_tool_use_id:'unknown-call',message:{model:'claude-haiku-4-5',content:[]}},
    {type:'error',message:'transport failed'},
  ].map(event => JSON.stringify(event)).join('\n');
  assert.deepEqual(observeRuntimeModels('claude', events), {coordinator:['claude-opus-5-5'],qa:['claude-sonnet-5']});
  assert.equal(observeRuntimeModels('codex', events), null);
  assert.equal(observeRuntimeModels('claude', '{"requestedModels":{"qa":"sonnet"}}'), null);
});

test('native timeout remains incomplete even when a client emits a success event', async t => {
  const temp = await realpath(await mkdtemp(path.join(os.tmpdir(), 'core-timeout-test-')));
  t.after(() => rm(temp, {recursive:true,force:true}));
  const client = path.join(temp, 'hanging-client');
  await writeFile(client, `#!${process.execPath}\nif(process.argv.includes('--version'))console.log('hanging-test-client');else {console.log(JSON.stringify({type:'turn.completed'}));setInterval(()=>{},60000);}\n`);
  await chmod(client, 0o755);
  const output = path.join(temp, 'evidence');
  await exec(process.execPath, [path.join(sourceRoot,'evaluations/run-native.mjs'),'--tool','codex','--case','smoke','--client',client,'--timeout-ms','1000','--output',output], {cwd:sourceRoot,timeout:60000});
  const record = JSON.parse(await readFile(path.join(output,'smoke.json'),'utf8'));
  assert.equal(record.timedOut,true);
  assert.equal(record.timeoutMs,1000);
  assert.notEqual(record.exitCode,0);
  assert.equal(record.actualModels,null);
});
