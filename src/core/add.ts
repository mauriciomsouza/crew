import type { RepoReader } from './doctor.js';
import {
  CONFIG_PATH,
  CORE_DOCS,
  agentPath,
  flowDiagram,
  gatesTable,
  planGatesTable,
  renderAgent,
  renderConfig,
  renderOwnedDocs,
  replaceSection,
  rolesTable,
  sourcesTable,
  withDefaults,
  type GeneratedFile,
  type ProjectConfig,
} from './generate.js';
import { ROLE_IDS, isRoleId, normalizeRoles, type RoleId } from './roles.js';

export interface AddPlan {
  /** New files. Never overwrite unless the caller passes force. */
  create: GeneratedFile[];
  /** Existing crew-managed files whose marked sections are regenerated. */
  update: GeneratedFile[];
  /** Things the user should do by hand because a file was customised. */
  notes: string[];
  config: ProjectConfig;
}

/** Reads `.claude/crew.json`, falling back to what the repo itself says. */
export function readConfig(repo: RepoReader): ProjectConfig {
  const raw = repo.read(CONFIG_PATH);
  if (raw !== undefined) {
    try {
      const data = JSON.parse(raw) as Partial<ProjectConfig>;
      if (typeof data.name === 'string') {
        return withDefaults({
          ...data,
          name: data.name,
          roles: (data.roles ?? []).filter(isRoleId),
        });
      }
    } catch {
      // fall through to inference
    }
  }
  const heading = /^#\s+(.+)$/m.exec(repo.read(CORE_DOCS.claude) ?? '')?.[1]?.trim();
  const roles = repo
    .list('.claude/agents')
    .map((f) => f.replace(/\.md$/, ''))
    .filter(isRoleId);
  return withDefaults({ name: heading ?? 'This project', roles });
}

export function planAdd(repo: RepoReader, role: string): AddPlan {
  if (!isRoleId(role)) {
    throw new Error(`Unknown role: ${role}. Available: ${ROLE_IDS.join(', ')}`);
  }
  const current = readConfig(repo);
  const config: ProjectConfig = { ...current, roles: normalizeRoles([...current.roles, role]) };
  const create: GeneratedFile[] = [
    { path: agentPath(role), kind: 'agent', content: renderAgent(role, config) },
    ...renderOwnedDocs(role, config).filter((f) => !repo.exists(f.path)),
  ];
  const update: GeneratedFile[] = [];
  const notes: string[] = [];

  const regenerate = (path: string, sections: [marker: string, body: string][], hint: string) => {
    const source = repo.read(path);
    if (source === undefined) {
      notes.push(`${path} not found; ${hint}`);
      return;
    }
    let next = source;
    for (const [marker, body] of sections) {
      const replaced = replaceSection(next, marker, body);
      if (replaced === undefined) {
        notes.push(`${path} has no crew:${marker} markers; ${hint}`);
        return;
      }
      next = replaced;
    }
    if (next !== source)
      update.push({
        path,
        kind: path === CORE_DOCS.claude ? 'rules' : path === CORE_DOCS.plan ? 'plan' : 'team',
        content: next,
      });
  };

  regenerate(
    CORE_DOCS.agentTeam,
    [
      ['roles', rolesTable(config.roles)],
      ['flow', flowDiagram(config.roles)],
      ['gates', gatesTable(config.roles)],
    ],
    `add \`${role}\` to the roles table by hand`,
  );
  regenerate(
    CORE_DOCS.claude,
    [['sources', sourcesTable(config.roles)]],
    `list the ${role} documents in the source-of-truth table`,
  );
  regenerate(
    CORE_DOCS.plan,
    [['plan-gates', planGatesTable(config.roles)]],
    'add any new gate to the plan',
  );
  update.push({ path: CONFIG_PATH, kind: 'config', content: renderConfig(config) });

  return { create, update, notes, config };
}

export type { RoleId };
