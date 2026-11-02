import { readFileSync } from 'node:fs';
import { basename, join } from 'node:path';
import * as p from '@clack/prompts';
import pc from 'picocolors';
import {
  CONFIG_PATH,
  CORE_DOCS,
  DEFAULT_ROLES,
  ROLES,
  ROLE_IDS,
  normalizeRoles,
  planAdd,
  planInit,
  runDoctor,
  withDefaults,
  type ProjectConfig,
  type RoleId,
} from '../core/index.js';
import { VERSION } from '../version.js';
import { fsRepo, writeFiles } from './fs.js';
import { doctorReport, fileList, glyph, heading, summaryLine } from './ui.js';

export interface Io {
  cwd: string;
  out: (text: string) => void;
  interactive: boolean;
}

export interface InitFlags {
  yes?: boolean;
  force?: boolean;
  dryRun?: boolean;
  name?: string;
  description?: string;
  stack?: string;
  language?: string;
  roles?: string;
}

class Cancelled extends Error {}

function guard<T>(value: T): Exclude<T, symbol> {
  if (p.isCancel(value)) throw new Cancelled('Cancelled.');
  return value as Exclude<T, symbol>;
}

function detectName(cwd: string): string {
  try {
    const pkg = JSON.parse(readFileSync(join(cwd, 'package.json'), 'utf8')) as { name?: unknown };
    if (typeof pkg.name === 'string' && pkg.name) return pkg.name.replace(/^@[^/]+\//, '');
  } catch {
    // no package.json; fall back to the folder name
  }
  return basename(cwd);
}

function parseRoles(value: string): RoleId[] {
  return normalizeRoles(
    value
      .split(',')
      .map((r) => r.trim().toLowerCase())
      .filter(Boolean),
  );
}

async function askConfig(cwd: string, flags: InitFlags): Promise<ProjectConfig> {
  p.intro(`${pc.bgCyan(pc.black(' crew '))} ${pc.dim('ship like a team of eight')}`);
  const name =
    flags.name ??
    guard(
      await p.text({
        message: 'Project name',
        initialValue: detectName(cwd),
        validate: (v) => (v?.trim() ? undefined : 'A name is required'),
      }),
    );
  const description =
    flags.description ??
    guard(await p.text({ message: 'One-line description', placeholder: 'What it does, for whom' }));
  const stack =
    flags.stack ??
    guard(
      await p.text({ message: 'Stack', placeholder: 'e.g. Next.js, Postgres, Vercel (optional)' }),
    );
  const roles = flags.roles
    ? parseRoles(flags.roles)
    : guard(
        await p.multiselect<RoleId>({
          message: 'Which roles should the team have?',
          options: ROLE_IDS.map((id) => ({
            value: id,
            label: ROLES[id].title,
            hint: ROLES[id].owns,
          })),
          initialValues: DEFAULT_ROLES,
          required: true,
        }),
      );
  const language =
    flags.language ??
    guard(await p.text({ message: 'Language for project documents', initialValue: 'English' }));
  return withDefaults({ name, description, stack, language, roles });
}

export async function init(io: Io, flags: InitFlags): Promise<number> {
  const interactive = io.interactive && !flags.yes;
  let config: ProjectConfig;
  try {
    config = interactive
      ? await askConfig(io.cwd, flags)
      : withDefaults({
          name: flags.name ?? detectName(io.cwd),
          ...(flags.description !== undefined && { description: flags.description }),
          ...(flags.stack !== undefined && { stack: flags.stack }),
          ...(flags.language !== undefined && { language: flags.language }),
          roles: flags.roles ? parseRoles(flags.roles) : DEFAULT_ROLES,
        });
  } catch (err) {
    if (err instanceof Cancelled) {
      p.cancel('Nothing was written.');
      return 1;
    }
    throw err;
  }

  const files = planInit(config);
  const result = writeFiles(io.cwd, files, {
    force: Boolean(flags.force),
    dryRun: Boolean(flags.dryRun),
  });
  if (!interactive) io.out(heading(`init ${pc.bold(config.name)}`, VERSION));
  else io.out('');
  io.out(fileList(files, result));
  io.out('');
  io.out(summaryLine(result, flags.dryRun));

  const keptCore = result.skipped.filter(
    (f) => f === CORE_DOCS.claude || f === CORE_DOCS.agentTeam,
  );
  if (keptCore.length > 0) {
    io.out(
      `\n  ${glyph.warn} ${keptCore.join(' and ')} already existed and ${keptCore.length > 1 ? 'were' : 'was'} kept.`,
    );
    io.out(
      `    ${pc.dim('Merge the generated sections by hand, or re-run with --force to replace.')}`,
    );
  }
  io.out(`\n  ${pc.bold('Next')}`);
  io.out(
    `  ${pc.dim('1.')} Open Claude Code here and say: ${pc.cyan('"Read CLAUDE.md and docs/AGENT_TEAM.md, then propose the first brief."')}`,
  );
  io.out(
    `  ${pc.dim('2.')} Run ${pc.cyan('npx create-crew doctor')} whenever you change the team.\n`,
  );
  if (interactive) p.outro(`Your crew of ${config.roles.length + 1} is ready.`);
  return 0;
}

export function doctor(io: Io, flags: { json?: boolean }): number {
  const report = runDoctor(fsRepo(io.cwd));
  if (flags.json) {
    io.out(JSON.stringify(report, null, 2));
  } else {
    io.out(heading(`doctor ${pc.dim(basename(io.cwd))}`, VERSION));
    io.out(doctorReport(report));
  }
  return report.ok ? 0 : 1;
}

export function add(
  io: Io,
  role: string | undefined,
  flags: { force?: boolean; dryRun?: boolean },
): number {
  if (!role) {
    io.out(`${glyph.fail} Usage: crew add <role>   ${pc.dim(`(${ROLE_IDS.join(', ')})`)}`);
    return 1;
  }
  const repo = fsRepo(io.cwd);
  if (!repo.exists(CORE_DOCS.agentTeam) && !repo.exists(CONFIG_PATH)) {
    io.out(`${glyph.fail} No crew setup found here. Run ${pc.cyan('npx create-crew')} first.`);
    return 1;
  }
  const plan = planAdd(repo, role.toLowerCase());
  const createRes = writeFiles(io.cwd, plan.create, {
    force: Boolean(flags.force),
    dryRun: Boolean(flags.dryRun),
  });
  const updateRes = writeFiles(io.cwd, plan.update, {
    dryRun: Boolean(flags.dryRun),
    managed: new Set(plan.update.map((f) => f.path)),
  });
  const files = [...plan.create, ...plan.update];
  const merged = {
    written: [...createRes.written, ...updateRes.written],
    overwritten: [...createRes.overwritten, ...updateRes.overwritten],
    skipped: [...createRes.skipped, ...updateRes.skipped],
    unchanged: [...createRes.unchanged, ...updateRes.unchanged],
  };
  io.out(heading(`add ${pc.bold(role)}`, VERSION));
  io.out(fileList(files, merged));
  io.out('');
  io.out(summaryLine(merged, flags.dryRun));
  for (const note of plan.notes) io.out(`  ${glyph.warn} ${note}`);
  io.out('');
  return 0;
}
