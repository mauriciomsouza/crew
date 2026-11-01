import { ROLES, normalizeRoles, type Gate, type RoleId } from './roles.js';
import { render, type TemplateContext } from './template.js';
import { AGENT_TEMPLATES, DOC_TEMPLATES } from './templates.js';

export interface ProjectConfig {
  name: string;
  description: string;
  stack: string;
  language: string;
  roles: RoleId[];
}

export interface GeneratedFile {
  path: string;
  content: string;
  /** Short human label used in summaries. */
  kind: 'rules' | 'team' | 'plan' | 'agent' | 'doc' | 'config';
}

export const CONFIG_PATH = '.claude/crew.json';
export const AGENT_DIR = '.claude/agents';

export const CORE_DOCS = {
  claude: 'CLAUDE.md',
  agentTeam: 'docs/AGENT_TEAM.md',
  plan: 'docs/PLAN.md',
} as const;

export function agentPath(role: RoleId): string {
  return `${AGENT_DIR}/${role}.md`;
}

export function withDefaults(input: Partial<ProjectConfig> & { name: string }): ProjectConfig {
  return {
    name: input.name.trim(),
    description: input.description?.trim() || 'A product built with an agent team.',
    stack: input.stack?.trim() || 'Not decided yet (see docs/STACK.md once dev joins)',
    language: input.language?.trim() || 'English',
    roles: normalizeRoles(input.roles ?? []),
  };
}

// ---------------------------------------------------------------------------
// Tables and diagram. These live between <!-- crew:*:start/end --> markers in
// the generated docs so `crew add` can regenerate them without touching the
// rest of the file.
// ---------------------------------------------------------------------------

function table(header: string[], rows: string[][]): string {
  const line = (cells: string[]) => `| ${cells.join(' | ')} |`;
  return [
    line(header),
    line(header.map((h) => '-'.repeat(Math.max(3, h.length)))),
    ...rows.map(line),
  ].join('\n');
}

export function sourcesTable(roles: RoleId[]): string {
  const rows: string[][] = [
    ['[`CLAUDE.md`](CLAUDE.md)', 'Project rules for every agent', 'Owner'],
    ['[`docs/AGENT_TEAM.md`](docs/AGENT_TEAM.md)', 'Roles, iteration flow, owner gates', 'Owner'],
    ['[`docs/PLAN.md`](docs/PLAN.md)', 'Phases, gates, risks, decisions', 'Orchestrator'],
  ];
  for (const id of roles) {
    for (const doc of ROLES[id].docs) {
      rows.push([`[\`${doc.path}\`](${doc.path})`, doc.purpose, ROLES[id].title]);
    }
  }
  return table(['Document', 'Decides', 'Owner'], rows);
}

export function rolesTable(roles: RoleId[]): string {
  const rows: string[][] = [
    [
      'Orchestrator',
      'main session',
      'Briefs, routing, the plan, owner gates',
      'Brief per task; updated PLAN.md',
    ],
    ...roles.map((id) => {
      const r = ROLES[id];
      return [r.title, `\`${id}\``, r.owns, r.deliverable];
    }),
  ];
  return table(['Role', 'Agent', 'Owns', 'Typical deliverable'], rows);
}

interface NumberedGate extends Gate {
  id: string;
  role: RoleId | 'orchestrator';
}

export function gatesFor(roles: RoleId[]): NumberedGate[] {
  const gates: NumberedGate[] = [
    {
      id: 'G0',
      role: 'orchestrator',
      name: 'Kickoff',
      question: 'Is the goal right, and is the plan worth starting?',
    },
  ];
  for (const id of roles) {
    const gate = ROLES[id].gate;
    if (gate) gates.push({ id: `G${gates.length}`, role: id, ...gate });
  }
  return gates;
}

export function gatesTable(roles: RoleId[]): string {
  const rows = gatesFor(roles).map((g) => [
    g.id,
    g.name,
    g.role === 'orchestrator' ? 'Orchestrator' : ROLES[g.role].title,
    g.question,
  ]);
  return table(['Gate', 'Decision', 'Brought by', 'The owner answers'], rows);
}

export function planGatesTable(roles: RoleId[]): string {
  const rows = gatesFor(roles).map((g) => [g.id, g.name, g.question, 'not started']);
  return table(['Gate', 'Name', 'Exit question', 'Status'], rows);
}

export function flowDiagram(roles: RoleId[]): string {
  const gates = new Map(gatesFor(roles).map((g) => [g.role, g]));
  const nameWidth = Math.max(...roles.map((r) => r.length), 4);
  const flowWidth = Math.max(...roles.map((r) => ROLES[r].flow.length), 10);
  const lines = [
    'Owner',
    '  │  goal',
    '  ▼',
    'Orchestrator ── writes briefs, routes handoffs, keeps PLAN.md',
    '  │',
  ];
  roles.forEach((id, i) => {
    const branch = i === roles.length - 1 ? '└─▶' : '├─▶';
    const gate = gates.get(id);
    let marker = '';
    if (gate) marker = `◆ ${gate.id} ${gate.name}`;
    else if (id === 'qa') marker = '✗ FAIL → back to author';
    const left = `  ${branch} ${id.padEnd(nameWidth)}   ${ROLES[id].flow.padEnd(flowWidth)}`;
    lines.push(marker ? `${left}   ${marker}` : left.trimEnd());
  });
  lines.push('', '◆ stops for the owner’s explicit approval · nobody approves their own work');
  return ['```text', ...lines, '```'].join('\n');
}

// ---------------------------------------------------------------------------

function context(config: ProjectConfig): TemplateContext {
  return {
    vars: {
      'project.name': config.name,
      'project.description': config.description,
      'project.stack': config.stack,
      'docs.language': config.language,
      'table.sources': sourcesTable(config.roles),
      'table.roles': rolesTable(config.roles),
      'table.gates': gatesTable(config.roles),
      'table.planGates': planGatesTable(config.roles),
      'diagram.flow': flowDiagram(config.roles),
    },
    flags: {},
  };
}

export function renderAgent(role: RoleId, config: ProjectConfig): string {
  return render(AGENT_TEMPLATES[role], context(config));
}

export function renderOwnedDocs(role: RoleId, config: ProjectConfig): GeneratedFile[] {
  return ROLES[role].docs.map((doc) => {
    const sections = doc.sections
      .map((s) => `## ${s}\n\n_To be written by the ${role} agent._\n`)
      .join('\n');
    return {
      path: doc.path,
      kind: 'doc',
      content: `# ${doc.title} — ${config.name}\n\n> Owner: **${ROLES[role].title}** (\`.claude/agents/${role}.md\`). ${doc.purpose}.\n> Other roles propose changes; the owner makes them.\n\n${sections}`,
    };
  });
}

export function renderConfig(config: ProjectConfig): string {
  return `${JSON.stringify({ $schema: 'https://mauriciomsouza.github.io/crew/schema/crew.json', ...config }, null, 2)}\n`;
}

/** Every file `crew init` would write, in display order. Pure: no I/O. */
export function planInit(config: ProjectConfig): GeneratedFile[] {
  if (config.roles.length === 0) throw new Error('Pick at least one role.');
  const ctx = context(config);
  return [
    { path: CORE_DOCS.claude, kind: 'rules', content: render(DOC_TEMPLATES.claude, ctx) },
    { path: CORE_DOCS.agentTeam, kind: 'team', content: render(DOC_TEMPLATES.agentTeam, ctx) },
    { path: CORE_DOCS.plan, kind: 'plan', content: render(DOC_TEMPLATES.plan, ctx) },
    ...config.roles.map((role) => ({
      path: agentPath(role),
      kind: 'agent' as const,
      content: renderAgent(role, config),
    })),
    ...config.roles.flatMap((role) => renderOwnedDocs(role, config)),
    { path: CONFIG_PATH, kind: 'config', content: renderConfig(config) },
  ];
}

// ---------------------------------------------------------------------------
// Marker-based section replacement, used by `crew add`.
// ---------------------------------------------------------------------------

export function replaceSection(source: string, marker: string, body: string): string | undefined {
  const start = `<!-- crew:${marker}:start -->`;
  const end = `<!-- crew:${marker}:end -->`;
  const from = source.indexOf(start);
  const to = source.indexOf(end);
  if (from === -1 || to === -1 || to < from) return undefined;
  return `${source.slice(0, from + start.length)}\n${body}\n${source.slice(to)}`;
}
