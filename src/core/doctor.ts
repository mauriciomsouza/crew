import { parseFrontmatter } from './frontmatter.js';
import { AGENT_DIR, CORE_DOCS } from './generate.js';
import { codeSpans, findSection, parseTable, pathFromCell } from './markdown.js';
import { findSecrets } from './secrets.js';

/** The read-only view of a repository that doctor needs. */
export interface RepoReader {
  read(path: string): string | undefined;
  exists(path: string): boolean;
  /** File names (not paths) directly inside `dir`, or [] if it does not exist. */
  list(dir: string): string[];
}

export type Status = 'pass' | 'warn' | 'fail';

export interface CheckResult {
  id: string;
  title: string;
  status: Status;
  /** One line per problem, or a single summary line on pass. */
  details: string[];
}

export interface DoctorReport {
  checks: CheckResult[];
  errors: number;
  warnings: number;
  ok: boolean;
}

/** Tools Claude Code ships with. Unknown names warn (they may be MCP tools). */
export const KNOWN_TOOLS = new Set([
  'Read',
  'Write',
  'Edit',
  'MultiEdit',
  'Glob',
  'Grep',
  'Bash',
  'BashOutput',
  'KillShell',
  'WebFetch',
  'WebSearch',
  'NotebookEdit',
  'NotebookRead',
  'TodoWrite',
  'Task',
  'Agent',
  'Skill',
  'SlashCommand',
  'ExitPlanMode',
  'LS',
]);

const NAME_PATTERN = /^[a-z][a-z0-9-]*$/;

function check(
  id: string,
  title: string,
  problems: string[],
  warnings: string[],
  okLine: string,
): CheckResult {
  if (problems.length > 0)
    return { id, title, status: 'fail', details: [...problems, ...warnings] };
  if (warnings.length > 0) return { id, title, status: 'warn', details: warnings };
  return { id, title, status: 'pass', details: [okLine] };
}

function toolList(value: unknown): string[] | undefined {
  if (typeof value === 'string')
    return value
      .split(',')
      .map((t) => t.trim())
      .filter(Boolean);
  if (Array.isArray(value) && value.every((t) => typeof t === 'string'))
    return value.map((t) => t.trim());
  return undefined;
}

export function agentFiles(repo: RepoReader): string[] {
  return repo
    .list(AGENT_DIR)
    .filter((f) => f.endsWith('.md'))
    .sort();
}

function checkCoreDocs(repo: RepoReader): CheckResult {
  const problems: string[] = [];
  const warnings: string[] = [];
  if (!repo.exists(CORE_DOCS.claude))
    problems.push(`${CORE_DOCS.claude} is missing — run \`crew init\``);
  if (!repo.exists(CORE_DOCS.agentTeam))
    problems.push(`${CORE_DOCS.agentTeam} is missing — run \`crew init\``);
  if (!repo.exists(CORE_DOCS.plan))
    warnings.push(`${CORE_DOCS.plan} is missing — gates have nowhere to be tracked`);
  return check(
    'core-docs',
    'Core documents',
    problems,
    warnings,
    'CLAUDE.md, AGENT_TEAM.md and PLAN.md present',
  );
}

function checkFrontmatter(repo: RepoReader, files: string[]): CheckResult {
  const problems: string[] = [];
  const warnings: string[] = [];
  if (files.length === 0) problems.push(`no agents found in ${AGENT_DIR}/`);
  for (const file of files) {
    const path = `${AGENT_DIR}/${file}`;
    const parsed = parseFrontmatter(repo.read(path) ?? '');
    if (!parsed.ok) {
      problems.push(`${path}: ${parsed.error}`);
      continue;
    }
    const { data, body } = parsed.value;
    const expected = file.replace(/\.md$/, '');
    if (typeof data.name !== 'string' || data.name.length === 0)
      problems.push(`${path}: \`name\` is required`);
    else if (!NAME_PATTERN.test(data.name))
      problems.push(`${path}: \`name\` must be lowercase-kebab-case, got "${data.name}"`);
    else if (data.name !== expected)
      problems.push(`${path}: \`name\` is "${data.name}" but the file is ${file}`);

    if (typeof data.description !== 'string' || data.description.trim().length === 0) {
      problems.push(
        `${path}: \`description\` is required (it is how the orchestrator picks this agent)`,
      );
    } else if (data.description.trim().length < 40) {
      warnings.push(`${path}: \`description\` is very short; say when to use this agent`);
    }

    if (data.tools !== undefined) {
      const tools = toolList(data.tools);
      if (!tools) problems.push(`${path}: \`tools\` must be a comma-separated string or a list`);
      else {
        const unknown = tools.filter(
          (t) => !KNOWN_TOOLS.has(t) && !t.startsWith('mcp__') && !t.includes('('),
        );
        if (unknown.length > 0) warnings.push(`${path}: unrecognised tools ${unknown.join(', ')}`);
      }
    } else {
      warnings.push(`${path}: no \`tools\` listed, so the agent inherits every tool`);
    }
    if (body.trim().length < 200) warnings.push(`${path}: the role prompt is nearly empty`);
  }
  return check(
    'frontmatter',
    'Agent frontmatter',
    problems,
    warnings,
    `${files.length} agent file${files.length === 1 ? '' : 's'} valid`,
  );
}

/** Agent ids named in the roles table of AGENT_TEAM.md (the `Agent` column). */
export function referencedAgents(agentTeam: string): string[] | undefined {
  const section = findSection(agentTeam, /^roles\b/i);
  const parsed = parseTable(section?.body ?? agentTeam);
  if (!parsed) return undefined;
  const col = parsed.header.findIndex((h) => /^agent$/i.test(h));
  if (col === -1) return undefined;
  return parsed.rows.flatMap((row) => codeSpans(row[col] ?? ''));
}

function checkRoster(repo: RepoReader, files: string[]): CheckResult {
  const problems: string[] = [];
  const doc = repo.read(CORE_DOCS.agentTeam);
  if (doc === undefined)
    return check(
      'roster',
      'Team roster matches agents',
      [],
      [`skipped: ${CORE_DOCS.agentTeam} not found`],
      '',
    );
  const referenced = referencedAgents(doc);
  if (!referenced) {
    return check(
      'roster',
      'Team roster matches agents',
      [`${CORE_DOCS.agentTeam}: no roles table with an "Agent" column`],
      [],
      '',
    );
  }
  const onDisk = files.map((f) => f.replace(/\.md$/, ''));
  for (const id of referenced) {
    if (!onDisk.includes(id))
      problems.push(`\`${id}\` is in AGENT_TEAM.md but ${AGENT_DIR}/${id}.md does not exist`);
  }
  for (const id of onDisk) {
    if (!referenced.includes(id))
      problems.push(
        `${AGENT_DIR}/${id}.md exists but \`${id}\` is not in the AGENT_TEAM.md roles table`,
      );
  }
  return check(
    'roster',
    'Team roster matches agents',
    problems,
    [],
    `${referenced.length} role${referenced.length === 1 ? '' : 's'} in AGENT_TEAM.md, all with agent files`,
  );
}

/** File paths in the "Source of truth" table of CLAUDE.md. */
export function sourceOfTruthPaths(claude: string): string[] | undefined {
  const section = findSection(claude, /^source of truth/i);
  if (!section) return undefined;
  const parsed = parseTable(section.body);
  if (!parsed) return [];
  return parsed.rows
    .map((row) => pathFromCell(row[0] ?? ''))
    .filter((p): p is string => Boolean(p));
}

function checkSources(repo: RepoReader): CheckResult {
  const doc = repo.read(CORE_DOCS.claude);
  if (doc === undefined)
    return check(
      'sources',
      'Source-of-truth documents exist',
      [],
      [`skipped: ${CORE_DOCS.claude} not found`],
      '',
    );
  const paths = sourceOfTruthPaths(doc);
  if (!paths)
    return check(
      'sources',
      'Source-of-truth documents exist',
      [],
      ['CLAUDE.md has no "Source of truth" section'],
      '',
    );
  if (paths.length === 0)
    return check(
      'sources',
      'Source-of-truth documents exist',
      [],
      ['the "Source of truth" table lists no documents'],
      '',
    );
  const missing = paths.filter((p) => !repo.exists(p));
  return check(
    'sources',
    'Source-of-truth documents exist',
    missing.map((p) => `${p} is listed in CLAUDE.md but does not exist`),
    [],
    `${paths.length} documents listed, all present`,
  );
}

function checkSecrets(repo: RepoReader, files: string[]): CheckResult {
  const targets = [...files.map((f) => `${AGENT_DIR}/${f}`), CORE_DOCS.claude];
  const problems: string[] = [];
  for (const path of targets) {
    for (const f of findSecrets(repo.read(path) ?? '')) {
      problems.push(`${path}:${f.line} looks like a ${f.rule} (${f.preview})`);
    }
  }
  return check(
    'secrets',
    'No secrets in agent files',
    problems,
    [],
    `${targets.length} files scanned, nothing found`,
  );
}

export function runDoctor(repo: RepoReader): DoctorReport {
  const files = agentFiles(repo);
  const checks = [
    checkCoreDocs(repo),
    checkFrontmatter(repo, files),
    checkRoster(repo, files),
    checkSources(repo),
    checkSecrets(repo, files),
  ];
  const errors = checks
    .filter((c) => c.status === 'fail')
    .reduce((n, c) => n + c.details.length, 0);
  const warnings = checks
    .filter((c) => c.status === 'warn')
    .reduce((n, c) => n + c.details.length, 0);
  return { checks, errors, warnings, ok: errors === 0 };
}

/** An in-memory repository, used by tests and the browser demo. */
export function memoryRepo(files: Record<string, string>): RepoReader {
  return {
    read: (p) => files[p],
    exists: (p) =>
      p in files || Object.keys(files).some((k) => k.startsWith(`${p.replace(/\/$/, '')}/`)),
    list: (dir) => {
      const prefix = `${dir.replace(/\/$/, '')}/`;
      return Object.keys(files)
        .filter((k) => k.startsWith(prefix) && !k.slice(prefix.length).includes('/'))
        .map((k) => k.slice(prefix.length));
    },
  };
}
