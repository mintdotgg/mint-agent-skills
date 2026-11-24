#!/usr/bin/env node
import { mkdir, readFile, readdir, realpath, writeFile } from 'node:fs/promises';
import { homedir } from 'node:os';
import { dirname, join } from 'node:path';
import { parseArgs } from 'node:util';
import { parse as parseToml } from 'smol-toml';

const clients = {
  codex: { skills: '.agents/skills', config: '.codex/config.toml' },
  cursor: { skills: '.agents/skills', config: '.cursor/mcp.json' },
  'claude-code': { skills: '.claude/skills', config: '.mcp.json' },
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

async function main() {
  const { values } = parseArgs({
    options: {
      agent: { type: 'string', default: 'codex' },
      help: { type: 'boolean', short: 'h' },
    },
  });

  if (values.help) {
    console.log('Usage: npx @mintgg/setup [--agent codex|cursor|claude-code]');
    console.log('Run from your project root. The default agent is Codex.');
    return;
  }

  if (!Object.hasOwn(clients, values.agent)) {
    throw new Error('Choose --agent codex, cursor, or claude-code.');
  }
  if (process.cwd() === await realpath(homedir())) {
    throw new Error('Run Mint setup from your project root.');
  }

  const client = clients[values.agent];
  const config = await readOptional(client.config);
  const updatedConfig = configUpdate(client.config, config);
  const skills = [];

  for (const name of (await readdir(bundledSkills)).sort()) {
    const path = join(client.skills, name, 'SKILL.md');
    const content = await readFile(new URL(`${name}/SKILL.md`, bundledSkills), 'utf8');
    const existing = await readOptional(path);
    if (existing === undefined) {
      skills.push({ path, content });
    } else if (existing !== content) {
      throw new Error(`A different skill already exists at ${path}. Review that file and run setup again.`);
    }
  }

  for (const { path, content } of skills) {
    await mkdir(dirname(path), { recursive: true });
    await writeFile(path, content, { flag: 'wx' });
  }
  if (updatedConfig !== undefined) {
    await mkdir(dirname(client.config), { recursive: true });
    await writeFile(client.config, updatedConfig, { flag: config === undefined ? 'wx' : 'w' });
  }

  console.log(`Mint skills are ready in ${client.skills}.`);
  console.log(`Mint MCP is configured in ${client.config}.`);
  console.log('Open or restart your agent in this project and connect Mint to sign in.');
}

try {
  await main();
} catch (error) {
  console.error(`Mint setup: ${error.message}`);
  process.exitCode = 1;
}
