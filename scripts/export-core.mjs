import { readFile, lstat, readdir, mkdir, writeFile, unlink, rmdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createHash } from 'node:crypto';
import { parse as parseToml } from 'smol-toml';
import { parse as parseYaml } from 'yaml';

export const sourceRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const toolsSupported = ['codex', 'claude'];
const roles = ['coordinator', 'implementer', 'reviewer', 'qa', 'escalation'];
const skills = ['deliver-change', 'review-change', 'verify-change'];
const roleDescriptions = {
  implementer: 'Implement approved bounded scope and behavior tests.',
  reviewer: 'Independently review raw changes against approved requirements.',
  qa: 'Independently verify acceptance scenarios and failure paths.',
};
const json = value => JSON.stringify(value, null, 2) + '\n';
const hash = value => createHash('sha256').update(value).digest('hex');
const object = value => value !== null && typeof value === 'object' && !Array.isArray(value);
function keys(value, allowed, label) {
  if (!object(value)) throw new Error(`${label} must be an object`);
  for (const key of Object.keys(value)) if (!allowed.includes(key)) throw new Error(`${label}.${key}: unknown field`);
}
export function projectPath(value, label, allowReserved = false) {
  if (typeof value !== 'string' || !value || /[\\\x00-\x1f`<>#?\[\]()]/.test(value) || path.posix.isAbsolute(value) || /^[A-Za-z]:/.test(value) || value.split('/').some(p => !p || p === '.' || p === '..')) {
    throw new Error(`${label}: expected a contained repository-relative file path`);
  }
  if (!allowReserved && (/^(\.agent-core|\.agents|\.codex|\.claude)(\/|$)/.test(value) || ['AGENTS.md', 'CLAUDE.md'].includes(value))) throw new Error(`${label}: reserved generated path`);
  return value;
}
export function normalizeConfig(input) {
  keys(input, ['scope', 'architecture', 'reviewGuidance', 'verificationCommand', 'models'], 'config');
  const config = {};
  for (const field of ['scope', 'architecture', 'reviewGuidance']) config[field] = projectPath(input[field], `config.${field}`);
  if (typeof input.verificationCommand !== 'string' || !input.verificationCommand.trim() || /[\x00-\x1f`]/.test(input.verificationCommand)) throw new Error('config.verificationCommand: required nonempty single-line command without backticks');
  config.verificationCommand = input.verificationCommand.trim();
  keys(input.models ?? {}, toolsSupported, 'config.models');
  config.models = {};
  for (const tool of toolsSupported) {
    const overrides = input.models?.[tool] ?? {};
    keys(overrides, roles, `config.models.${tool}`);
    config.models[tool] = {};
    for (const role of roles) if (Object.hasOwn(overrides, role)) {
      const model = overrides[role];
      const valid = tool === 'codex' ? /^gpt-[a-zA-Z0-9.-]+$/ : /^(opus|sonnet|haiku|fable|claude-[a-zA-Z0-9.[\]-]+)$/;
      if (typeof model !== 'string' || !valid.test(model)) throw new Error(`config.models.${tool}.${role}: expected a native ${tool} model ID or supported alias`);
      config.models[tool][role] = model;
    }
  }
  return config;
}
async function statIfExists(p) {
  try { return await lstat(p); } catch (error) { if (error.code === 'ENOENT') return null; throw error; }
}
export async function assertNoSymlinks(p) {
  let cursor = path.parse(path.resolve(p)).root;
  for (const segment of path.resolve(p).slice(cursor.length).split(path.sep).filter(Boolean)) {
    cursor = path.join(cursor, segment);
    const st = await statIfExists(cursor);
    if (st?.isSymbolicLink()) throw new Error(`${cursor}: symlink paths are not allowed`);
  }
}
function contained(root, candidate) {
  const relative = path.relative(root, candidate);
  return relative === '' || (!relative.startsWith('..' + path.sep) && relative !== '..' && !path.isAbsolute(relative));
}
async function assets(root) {
  const map = new Map();
  async function walk(directory) {
    await assertNoSymlinks(directory);
    for (const entry of (await readdir(directory, { withFileTypes: true })).sort((a,b) => a.name.localeCompare(b.name))) {
      const p = path.join(directory, entry.name);
      if (entry.isSymbolicLink()) throw new Error(`${p}: canonical assets cannot be symlinks`);
      if (entry.isDirectory()) await walk(p);
      else if (entry.isFile()) map.set(path.relative(root, p).split(path.sep).join('/'), await readFile(p, 'utf8'));
      else throw new Error(`${p}: unsupported source asset`);
    }
  }
  await walk(path.join(root, 'core'));
  await walk(path.join(root, 'adapters'));
  return map;
}
function render(template, values) {
  const result = template.replace(/\{\{(\w+)\}\}/g, (_, key) => {
    if (!(key in values)) throw new Error(`Missing adapter template value: ${key}`);
    return values[key];
  });
  return result.endsWith('\n') ? result : result + '\n';
}
export async function buildExport({ tools, config, root = sourceRoot }) {
  if (!Array.isArray(tools) || !tools.length || tools.some(t => !toolsSupported.includes(t)) || new Set(tools).size !== tools.length) throw new Error('tools: select codex, claude, or codex,claude without duplicates');
  tools = toolsSupported.filter(t => tools.includes(t));
  config = normalizeConfig(config);
  const source = await assets(root);
  const version = JSON.parse(await readFile(path.join(root, 'package.json'), 'utf8')).version;
  const defaults = JSON.parse(source.get('adapters/model-profiles.json'));
  keys(defaults, toolsSupported, 'model profiles');
  const normalizedDefaults = normalizeConfig({ ...config, models: defaults }).models;
  for (const tool of toolsSupported) if (roles.some(role => !normalizedDefaults[tool][role])) throw new Error(`model profiles.${tool}: all roles require defaults`);
  const files = new Map();
  for (const [name, content] of source) if (/^core\/(guidance|roles)\//.test(name)) files.set('.agent-core/' + name.slice(5), content);
  files.set('.agent-core/project.md', `# Project configuration\n\nPaths are relative to the consuming repository root. The template/project supplies these documents before delivery.\n\n- Scope: \`${config.scope}\`\n- Architecture: \`${config.architecture}\`\n- Review guidance: \`${config.reviewGuidance}\`\n- Verification command: \`${config.verificationCommand}\`\n\nRead these documents before work. Report missing project context as a blocked capability. Export records the command and never executes it.\n`);
  const requestedModels = {};
  for (const tool of tools) {
    requestedModels[tool] = { ...defaults[tool], ...config.models[tool] };
    const native = tool === 'codex' ? '.agents' : '.claude';
    files.set(tool === 'codex' ? 'AGENTS.md' : 'CLAUDE.md', render(source.get(`adapters/${tool}/entrypoint.md`), { version, ...requestedModels[tool] }));
    for (const skill of skills) {
      const original = source.get(`core/skills/${skill}/SKILL.md`);
      if (!original) throw new Error(`Missing canonical skill: core/skills/${skill}/SKILL.md`);
      files.set(`${native}/skills/${skill}/SKILL.md`, original.replaceAll('../../guidance/', '../../../.agent-core/guidance/').replaceAll('../../roles/', '../../../.agent-core/roles/'));
    }
    for (const role of ['implementer', 'reviewer', 'qa']) {
      const instructions = source.get(`core/roles/${role}.md`).replaceAll('../guidance/', '../../.agent-core/guidance/');
      const values = { name: `core-${role}`, description: roleDescriptions[role], model: requestedModels[tool][role], instructions };
      const extension = tool === 'codex' ? 'toml' : 'md';
      if (tool === 'codex') for (const key of Object.keys(values)) values[key] = JSON.stringify(values[key]);
      else for (const key of ['name', 'description', 'model']) values[key] = JSON.stringify(values[key]);
      files.set(`.${tool}/agents/core-${role}.${extension}`, render(source.get(`adapters/${tool}/agent.${extension}`), values));
    }
  }
  const sourceIdentity = hash(json({version, assets: [...source].sort(([a],[b]) => a.localeCompare(b))}));
  files.set('.agent-core/manifest.json', json({ coreVersion: version, sourceIdentity, configurationIdentity: hash(json({ tools, config })), tools, configuration: config, requestedModels, runtimeModels: null, provenance: 'Generated by agent-project-core/scripts/export-core.mjs; regenerate from canonical core/ and adapters/.' }));
  validateFiles(files);
  return new Map([...files].sort(([a],[b]) => a.localeCompare(b)));
}
function frontmatter(text, filename) {
  const match = /^---\n([\s\S]*?)\n---\n/.exec(text);
  if (!match) throw new Error(`${filename}: missing YAML frontmatter`);
  const metadata = parseYaml(match[1]);
  if (!object(metadata)) throw new Error(`${filename}: frontmatter must be an object`);
  return metadata;
}
export function validateFiles(files) {
  for (const [name, content] of files) {
    projectPath(name, 'output path', true); // Validate syntax separately from reserved export roots below.
    if (name.endsWith('SKILL.md') || /^\.claude\/agents\//.test(name)) {
      const metadata = frontmatter(content, name);
      for (const field of ['name','description']) if (typeof metadata[field] !== 'string' || !metadata[field].trim()) throw new Error(`${name}: missing ${field}`);
      if (name.endsWith('SKILL.md') && metadata.name !== path.posix.basename(path.posix.dirname(name))) throw new Error(`${name}: skill name does not match directory`);
      if (name.startsWith('.claude/agents/') && (!metadata.model || /^gpt-/.test(metadata.model))) throw new Error(`${name}: invalid Claude model`);
    }
    if (name.endsWith('.toml')) {
      const metadata = parseToml(content);
      for (const field of ['name','description','model','developer_instructions']) if (typeof metadata[field] !== 'string' || !metadata[field].trim()) throw new Error(`${name}: missing ${field}`);
    }
    const text = name.endsWith('.toml') ? parseToml(content).developer_instructions : content;
    const refs = [...text.matchAll(/\]\(([^)]+)\)/g)].map(m => m[1]);
    if (name === 'CLAUDE.md') refs.push(...[...text.matchAll(/^@([^\s]+)$/gm)].map(m => m[1]));
    for (const ref of refs) {
      if (/^https:\/\//.test(ref)) continue;
      const resolved = path.posix.normalize(path.posix.join(path.posix.dirname(name), ref));
      if (!files.has(resolved)) throw new Error(`${name}: missing reference ${ref} (resolved ${resolved})`);
    }
  }
}
export async function exportCore({ output, tools, config, root = sourceRoot, write = writeFile }) {
  if (typeof output !== 'string' || !output.trim()) throw new Error('output: required empty destination');
  if (output.split(/[\\/]/).includes('..')) throw new Error('output: path traversal is not allowed');
  const destination = path.resolve(output);
  await assertNoSymlinks(destination);
  if (contained(root, destination)) throw new Error('output: must be outside the source checkout');
  const state = await statIfExists(destination);
  if (state && (!state.isDirectory() || (await readdir(destination)).length)) throw new Error(`${destination}: destination must be new or empty`);
  const files = await buildExport({tools,config,root});
  const createdDirectories = [];
  const createdFiles = [];
  async function ensure(directory) {
    const st = await statIfExists(directory);
    if (st) { if (!st.isDirectory() || st.isSymbolicLink()) throw new Error(`${directory}: expected real directory`); return; }
    await ensure(path.dirname(directory));
    await mkdir(directory);
    createdDirectories.push(directory);
  }
  try {
    await ensure(destination);
    // Recheck after rendering, before first write, so concurrent additions are preserved.
    if ((await readdir(destination)).length) throw new Error(`${destination}: destination changed during export`);
    for (const [relative, content] of files) {
      const target = path.join(destination, relative);
      await ensure(path.dirname(target));
      // Track ownership only after exclusive creation; failed writes can leave partial files.
      const { open } = await import('node:fs/promises');
      const handle = await open(target, 'wx');
      createdFiles.push(target);
      try { await write(handle, content, 'utf8'); } finally { await handle.close(); }
    }
  } catch (error) {
    for (const file of createdFiles.reverse()) await unlink(file).catch(() => {});
    for (const directory of createdDirectories.reverse()) await rmdir(directory).catch(() => {});
    throw error;
  }
  return { output: destination, fileCount: files.size };
}
async function main() {
  const args = process.argv.slice(2).filter(a => a !== '--');
  const options = {};
  for (let i=0;i<args.length;i+=2) {
    const key = args[i];
    if (!['--output','--tools','--config'].includes(key) || !args[i+1] || Object.hasOwn(options,key)) throw new Error('Usage: pnpm core:export -- --output <empty-directory> --tools codex,claude --config <project-config.json>');
    options[key] = args[i+1];
  }
  if (!options['--config']) throw new Error('config: required project configuration JSON file');
  const config = JSON.parse(await readFile(options['--config'], 'utf8'));
  const result = await exportCore({output:options['--output'],tools:options['--tools']?.split(','),config});
  console.log(`Exported ${result.fileCount} files to ${result.output}`);
}
if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) main().catch(error => { console.error(error.message); process.exitCode=1; });
