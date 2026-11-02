#!/usr/bin/env node
import { basename } from 'node:path';
import { parseArgs } from 'node:util';
import pc from 'picocolors';
import { ROLES, ROLE_IDS } from './core/index.js';
import { add, doctor, init, type Io } from './node/commands.js';
import { VERSION } from './version.js';

const HELP = `
${pc.bold(pc.cyan('crew'))} ${pc.dim(`v${VERSION}`)}  Ship like a team of eight.

${pc.bold('Usage')}
  npx create-crew [options]       Scaffold an agent team into this repo
  crew init [options]             Same as above
  crew doctor [--json]            Validate the team setup (exit 1 on errors)
  crew add <role> [--force]       Add one role and update the team docs
  crew roles                      List available roles

${pc.bold('Init options')}
  -y, --yes                Accept defaults, no prompts
      --name <name>        Project name (default: package.json name or folder)
      --description <txt>  One-line description
      --stack <txt>        Stack summary
      --roles <list>       Comma-separated roles (default: business,design,dev,qa)
      --language <lang>    Language for project documents (default: English)
      --force              Replace files that already exist
      --dry-run            Show what would be written, write nothing

${pc.bold('Roles')}
  ${ROLE_IDS.join(', ')}
`;

const { values, positionals } = parseArgs({
  allowPositionals: true,
  options: {
    yes: { type: 'boolean', short: 'y' },
    force: { type: 'boolean' },
    'dry-run': { type: 'boolean' },
    name: { type: 'string' },
    description: { type: 'string' },
    stack: { type: 'string' },
    roles: { type: 'string' },
    language: { type: 'string' },
    json: { type: 'boolean' },
    help: { type: 'boolean', short: 'h' },
    version: { type: 'boolean', short: 'v' },
  },
});

// `npx create-crew` enters through src/create.ts, which inserts `init`. The basename check
// stays for direct invocations of a file or link named create-crew.
const invokedAs = basename(process.argv[1] ?? '');
const command = positionals[0] ?? (invokedAs.startsWith('create-crew') ? 'init' : 'help');

const io: Io = {
  cwd: process.cwd(),
  out: (text) => process.stdout.write(`${text}\n`),
  interactive: Boolean(process.stdin.isTTY && process.stdout.isTTY) && !process.env.CI,
};

async function main(): Promise<number> {
  if (values.version) {
    io.out(VERSION);
    return 0;
  }
  if (values.help || command === 'help') {
    io.out(HELP);
    return 0;
  }
  switch (command) {
    case 'init':
      return init(io, {
        ...(values.yes !== undefined && { yes: values.yes }),
        ...(values.force !== undefined && { force: values.force }),
        ...(values['dry-run'] !== undefined && { dryRun: values['dry-run'] }),
        ...(values.name !== undefined && { name: values.name }),
        ...(values.description !== undefined && { description: values.description }),
        ...(values.stack !== undefined && { stack: values.stack }),
        ...(values.roles !== undefined && { roles: values.roles }),
        ...(values.language !== undefined && { language: values.language }),
      });
    case 'doctor':
      return doctor(io, { ...(values.json !== undefined && { json: values.json }) });
    case 'add':
      return add(io, positionals[1], {
        ...(values.force !== undefined && { force: values.force }),
        ...(values['dry-run'] !== undefined && { dryRun: values['dry-run'] }),
      });
    case 'roles':
      for (const id of ROLE_IDS) io.out(`  ${pc.cyan(id.padEnd(10))} ${ROLES[id].owns}`);
      return 0;
    default:
      io.out(`${pc.red('✗')} Unknown command: ${command}\n${HELP}`);
      return 1;
  }
}

main().then(
  (code) => {
    process.exitCode = code;
  },
  (err: unknown) => {
    process.stderr.write(`${pc.red('✗')} ${err instanceof Error ? err.message : String(err)}\n`);
    process.exitCode = 1;
  },
);
