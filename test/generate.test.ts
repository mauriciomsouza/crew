import { describe, expect, it } from 'vitest';
import { parseFrontmatter } from '../src/core/frontmatter.js';
import { flowDiagram, gatesFor, planInit, withDefaults } from '../src/core/generate.js';
import { normalizeRoles } from '../src/core/roles.js';

const config = withDefaults({
  name: 'Parcel',
  description: 'A habit tracker for people who keep breaking streaks.',
  stack: 'Expo, Supabase',
  roles: ['qa', 'business', 'dev', 'design'],
});

describe('planInit', () => {
  const files = planInit(config);
  const paths = files.map((f) => f.path);

  it('creates the core documents, one agent per role and the owned docs', () => {
    expect(paths).toEqual([
      'CLAUDE.md',
      'docs/AGENT_TEAM.md',
      'docs/PLAN.md',
      '.claude/agents/business.md',
      '.claude/agents/design.md',
      '.claude/agents/dev.md',
      '.claude/agents/qa.md',
      'docs/business/BUSINESS.md',
      'docs/design/DESIGN_SPEC.md',
      'docs/STACK.md',
      'docs/qa/TEST_PLAN.md',
      '.claude/crew.json',
    ]);
  });

  it('leaves no unrendered placeholders', () => {
    for (const f of files) expect(f.content, f.path).not.toMatch(/\{\{/);
  });

  it('writes agent files with name, description and tools frontmatter', () => {
    for (const f of files.filter((x) => x.kind === 'agent')) {
      const parsed = parseFrontmatter(f.content);
      expect(parsed.ok).toBe(true);
      if (!parsed.ok) continue;
      expect(parsed.value.data.name).toBe(f.path.split('/').pop()?.replace('.md', ''));
      expect(String(parsed.value.data.description)).toContain('Parcel');
      expect(parsed.value.data.tools).toBeTypeOf('string');
    }
  });

  it('puts project details into CLAUDE.md', () => {
    const claude = files[0]?.content ?? '';
    expect(claude).toMatch(/^# Parcel\n/);
    expect(claude).toContain('Stack: Expo, Supabase');
    expect(claude).toContain('[`docs/qa/TEST_PLAN.md`](docs/qa/TEST_PLAN.md)');
  });

  it('rejects an empty team', () => {
    expect(() => planInit({ ...config, roles: [] })).toThrow(/at least one role/);
  });
});

describe('roles and gates', () => {
  it('normalizes role order and rejects unknown roles', () => {
    expect(normalizeRoles(['qa', 'dev'])).toEqual(['dev', 'qa']);
    expect(() => normalizeRoles(['dev', 'lawyer'])).toThrow(/Unknown role: lawyer/);
  });

  it('numbers gates G0..Gn in role order', () => {
    expect(gatesFor(['business', 'dev', 'release']).map((g) => `${g.id} ${g.name}`)).toEqual([
      'G0 Kickoff',
      'G1 Scope',
      'G2 Ship',
    ]);
  });

  it('draws every role in the flow diagram', () => {
    const d = flowDiagram(['business', 'dev', 'qa']);
    expect(d).toContain('├─▶ business');
    expect(d).toContain('└─▶ qa');
    expect(d).toContain('◆ G1 Scope');
    expect(d).toContain('FAIL → back to author');
  });
});
