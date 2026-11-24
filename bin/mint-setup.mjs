#!/usr/bin/env node
import { spawnSync } from 'node:child_process';
import { mkdir, readFile, readdir, realpath, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { parseArgs } from 'node:util';
import { parse as parseToml } from 'smol-toml';

const clients = {
  codex: {
    name: 'Codex',
    skills: '.agents/skills',
    config: '.codex/config.toml',
    signIn: 'Open Codex in this project and trust it, then run `codex mcp login mint`.',
  },
  'claude-code': {
    name: 'Claude Code',
    skills: '.claude/skills',
    config: '.mcp.json',
    signIn: 'Open Claude Code in this project, approve the mint server, then run `claude mcp login mint`.',
  },
  cursor: {
    name: 'Cursor',
    skills: '.agents/skills',
    config: '.cursor/mcp.json',
    signIn: 'Open this project in Cursor, enable mint under Settings → Tools & MCPs, and sign in when prompted.',
  },
};
const agentNames = Object.keys(clients);
const threejsSkills = {
  cli: 'skills@1.9.0',
  source: 'mintdotgg/mint-threejs-skills',
  skill: 'mint-threejs-skills',
  minimumNode: [22, 20],
};
const bundledServer = JSON.parse(
  await readFile(new URL('../.mcp.json', import.meta.url), 'utf8'),
).mcpServers.mint;
const bundledSkills = new URL('../skills/', import.meta.url);

async function readOptional(path) {
  try {
    return await readFile(path, 'utf8');
  } catch (error) {
    if (error.code === 'ENOENT') return undefined;
    throw error;
  }
}

function isObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

function readConfig(path, parse, source) {
  try {
    return parse(source);
  } catch {
    throw new Error(`Could not update ${path}. Check its syntax and run setup again.`);
  }
}

function configUpdate(path, source = '') {
  const codex = path.endsWith('.toml');
  const parent = codex ? 'mcp_servers' : 'mcpServers';
  const parse = codex ? parseToml : JSON.parse;
  const config = readConfig(path, parse, source.trim() ? source : codex ? '' : '{}');

  if (!isObject(config) || (Object.hasOwn(config, parent) && !isObject(config[parent]))) {
    throw new Error(`Expected ${parent} to be an object in ${path}.`);
  }

  const servers = config[parent] ?? {};
  if (Object.hasOwn(servers, 'mint')) {
    const mint = servers.mint;
    if (mint?.url === bundledServer.url && !Object.hasOwn(mint, 'command') &&
        (mint.type === undefined || mint.type === bundledServer.type)) {
      return undefined;
    }
    throw new Error(`A different Mint server already exists in ${path}. Review that entry and run setup again.`);
  }

  if (codex) {
    const section = `[mcp_servers.mint]\nurl = ${JSON.stringify(bundledServer.url)}\n`;
    const separator = !source ? '' : source.endsWith('\n') ? '\n' : '\n\n';
    const updated = source + separator + section;
    readConfig(path, parse, updated);
    return updated;
  }

  config[parent] = { ...servers, mint: bundledServer };
  return JSON.stringify(config, null, 2) + '\n';
}

function selectedAgents(values) {
  const requested = values.length ? values : ['all'];
  const agents = new Set();
  if (requested.some((value) => !value.trim() || !value.split(',').some((part) => part.trim()))) {
    throw new Error(`Empty --agent value. Choose ${agentNames.join(', ')}, or all.`);
  }
  for (const value of requested) {
    for (const agent of value.split(',').map((part) => part.trim()).filter(Boolean)) {
      if (agent === 'all') {
        agentNames.forEach((name) => agents.add(name));
      } else if (Object.hasOwn(clients, agent)) {
        agents.add(agent);
      } else {
        throw new Error(`Unknown agent "${agent}". Choose ${agentNames.join(', ')}, or all.`);
      }
    }
  }
  return agentNames.filter((name) => agents.has(name));
}

function checkThreejsNode() {
  const [major, minor] = process.versions.node.split('.').map(Number);
  const [needMajor, needMinor] = threejsSkills.minimumNode;
  if (major < needMajor || (major === needMajor && minor < needMinor)) {
    throw new Error(
      `Mint Three.js Skills needs Node.js ${needMajor}.${needMinor} or later; this is ${process.versions.node}. ` +
      'Upgrade Node.js, or add --skip-threejs to install only Mint MCP and the Mint skills.',
    );
  }
}

function installThreejsSkills(agents) {
  const windows = process.platform === 'win32';
  const args = [
    '--yes', `--package=${threejsSkills.cli}`, '--', 'skills', 'add', threejsSkills.source,
    '--skill', threejsSkills.skill, '-a', ...agents, '-y',
  ];
  // The outer npx run passes its own package through npm_config_* variables.
  const env = Object.fromEntries(
    Object.entries(process.env).filter(([key]) => !/^npm_config_(package|yes|call)$/i.test(key)),
  );
  console.log(`Installing Mint Three.js Skills with ${threejsSkills.cli}…`);
  // Windows needs the shell to run npx.cmd; pass one command string there.
  const result = windows
    ? spawnSync(['npx', ...args].join(' '), { env, stdio: 'inherit', shell: true })
    : spawnSync('npx', args, { env, stdio: 'inherit' });
  if (result.error || result.status !== 0) {
    const reason = result.error?.message ??
      (result.signal ? `stopped by ${result.signal}` : `exit code ${result.status}`);
    throw new Error(
      `Mint Three.js Skills did not install (${reason}). Mint MCP and the Mint skills were not changed. ` +
      'Review the output above and run setup again, or add --skip-threejs.',
    );
  }
}

const usage = `Usage: npx <mint-setup package> [--agent all|codex|claude-code|cursor] [--skip-threejs]

Run from your project root. Installs Mint MCP, the Mint skills, and
Mint Three.js Skills for Codex, Claude Code, and Cursor in this project.
Mint Three.js Skills needs Node.js 22.20 or later.

  --agent <name>   Set up one agent. Repeat or comma-separate for several.
                   Defaults to all.
  --skip-threejs   Install only Mint MCP and the Mint skills.
  -h, --help       Show this help.`;

async function main() {
  const { values } = parseArgs({
    options: {
      agent: { type: 'string', multiple: true, default: [] },
      'skip-threejs': { type: 'boolean', default: false },
      help: { type: 'boolean', short: 'h' },
    },
  });

  if (values.help) {
    console.log(usage);
    return;
  }

  const agents = selectedAgents(values.agent);
  if (process.cwd() === await realpath(homedir())) {
    throw new Error('Run Mint setup from your project root.');
  }

  const configs = new Map();
  const skills = new Map();
  for (const agent of agents) {
    const client = clients[agent];
    if (!configs.has(client.config)) {
      const source = await readOptional(client.config);
      configs.set(client.config, { exists: source !== undefined, updated: configUpdate(client.config, source) });
    }
    for (const name of (await readdir(bundledSkills)).sort()) {
      const path = join(client.skills, name, 'SKILL.md');
      if (skills.has(path)) continue;
      const content = await readFile(new URL(`${name}/SKILL.md`, bundledSkills), 'utf8');
      const existing = await readOptional(path);
      if (existing !== undefined && existing !== content) {
        throw new Error(`A different skill already exists at ${path}. Review that file and run setup again.`);
      }
      skills.set(path, existing === undefined ? content : undefined);
    }
  }

  const threejsAgents = [];
  if (!values['skip-threejs']) {
    for (const agent of agents) {
      const path = join(clients[agent].skills, threejsSkills.skill);
      if (await readOptional(join(path, 'SKILL.md')) === undefined) {
        threejsAgents.push(agent);
      } else {
        console.log(`Mint Three.js Skills already exist in ${path}; leaving them unchanged. Run \`npx skills update\` to update them.`);
      }
    }
    if (threejsAgents.length) checkThreejsNode();
  }
  if (threejsAgents.length) installThreejsSkills(threejsAgents);

  for (const [path, content] of skills) {
    if (content === undefined) continue;
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content, { flag: 'wx' });
  }
  for (const [path, { exists, updated }] of configs) {
    if (updated === undefined) continue;
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, updated, { flag: exists ? 'w' : 'wx' });
  }

  console.log('');
  console.log(`Mint is set up for ${agents.map((agent) => clients[agent].name).join(', ')}.`);
  for (const agent of agents) {
    const client = clients[agent];
    console.log(`- ${client.name}: MCP in ${client.config}, skills in ${client.skills}. ${client.signIn}`);
  }
}

try {
  await main();
} catch (error) {
  console.error(`Mint setup: ${error.message}`);
  process.exitCode = 1;
}
